import os
from pathlib import Path
from smtplib import SMTPException

from contact import FIELD_LIMITS, Contato, build_message_body, only_digits, validate_contact
from flask import Flask, abort, current_app, jsonify, request, send_from_directory
from flask_mail import Mail, Message
from turnstile import verify as verify_turnstile_request
from werkzeug.exceptions import RequestEntityTooLarge
from werkzeug.middleware.proxy_fix import ProxyFix

ROOT = Path(__file__).resolve().parents[1]
mail = Mail()


def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Variável de ambiente obrigatória ausente: {name}")
    return value


def parse_bool_env(name: str) -> bool:
    return require_env(name).strip().lower() in ("1", "true", "t", "yes", "y")


def parse_recipients(value: str) -> list[str]:
    recipients = [email.strip() for email in value.split(",") if email.strip()]
    if not recipients:
        raise RuntimeError("CONTACT_TO não contém nenhum e-mail válido.")
    return recipients


def load_turnstile_config(enabled: bool) -> tuple[str, str]:
    if not enabled:
        return "", ""
    return require_env("TURNSTILE_SITE_KEY"), require_env("TURNSTILE_SECRET_KEY")


def environment_config() -> dict:
    debug = parse_bool_env("FLASK_DEBUG")
    captcha_enabled = parse_bool_env("CAPTCHA_ENABLED")
    turnstile_site_key, turnstile_secret_key = load_turnstile_config(captcha_enabled)
    whats_number = require_env("WHATS_NUMBER")

    return {
        "DEBUG": debug,
        "SECRET_KEY": require_env("FLASK_SECRET_KEY"),
        "PREFERRED_URL_SCHEME": "https",
        "MAX_CONTENT_LENGTH": 64 * 1024,
        "MAIL_SERVER": require_env("MAIL_SERVER"),
        "MAIL_PORT": int(require_env("MAIL_PORT")),
        "MAIL_USE_TLS": parse_bool_env("MAIL_USE_TLS"),
        "MAIL_USE_SSL": parse_bool_env("MAIL_USE_SSL"),
        "MAIL_USERNAME": require_env("MAIL_USERNAME"),
        "MAIL_PASSWORD": require_env("MAIL_PASSWORD"),
        "MAIL_DEFAULT_SENDER": require_env("MAIL_USERNAME"),
        "CONTACT_EMAIL": require_env("CONTACT_EMAIL"),
        "WHATS_NUMBER": whats_number,
        "WHATS_LINK_NUMBER": only_digits(whats_number),
        "SOCIAL_FB_URL": require_env("SOCIAL_FB_URL"),
        "SOCIAL_IG_URL": require_env("SOCIAL_IG_URL"),
        "CAPTCHA_ENABLED": captcha_enabled,
        "TURNSTILE_SITE_KEY": turnstile_site_key,
        "TURNSTILE_SECRET_KEY": turnstile_secret_key,
        "RECIPIENTS": parse_recipients(require_env("CONTACT_TO")),
        "FRONTEND_DIST": Path(os.getenv("FRONTEND_DIST", ROOT / "frontend" / "dist")),
    }


def verify_turnstile(token: str, remote_ip: str | None) -> bool:
    return verify_turnstile_request(
        token,
        remote_ip,
        current_app.config["TURNSTILE_SECRET_KEY"],
        current_app.logger,
    )


def field_rules() -> dict[str, dict[str, int]]:
    return {name: {"min": limits[0], "max": limits[1]} for name, limits in FIELD_LIMITS.items()}


def client_ip() -> str | None:
    return (
        request.headers.get("CF-Connecting-IP")
        or request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
        or request.remote_addr
    )


def register_routes(app: Flask) -> None:
    @app.get("/api/site-config")
    def site_config():
        return jsonify(
            contactEmail=app.config["CONTACT_EMAIL"],
            whatsNumber=app.config["WHATS_NUMBER"],
            whatsLinkNumber=app.config["WHATS_LINK_NUMBER"],
            socialFacebook=app.config["SOCIAL_FB_URL"],
            socialInstagram=app.config["SOCIAL_IG_URL"],
            captchaEnabled=app.config["CAPTCHA_ENABLED"],
            turnstileSiteKey=app.config["TURNSTILE_SITE_KEY"],
            fieldLimits=field_rules(),
        )

    @app.post("/api/contact")
    def send_contact():
        data = request.get_json(silent=True) or request.form
        contact = Contato.from_mapping(data)

        if data.get("website"):
            app.logger.warning("Honeypot acionado no formulário de contato.")
            return jsonify(message="Não foi possível enviar a mensagem. Tente novamente."), 400

        validation_errors = validate_contact(contact)
        if validation_errors:
            return jsonify(message=" ".join(validation_errors), errors=validation_errors), 400

        if app.config["CAPTCHA_ENABLED"] and not verify_turnstile(data.get("captchaToken", ""), client_ip()):
            return jsonify(message="Falha na verificação anti-spam. Tente novamente."), 400

        try:
            message = Message(
                subject=contact.assunto,
                recipients=app.config["RECIPIENTS"],
                reply_to=contact.email,
                body=build_message_body(contact),
            )
            mail.send(message)
        except SMTPException:
            app.logger.exception("Erro ao enviar e-mail")
            return jsonify(message="Não foi possível enviar a mensagem. Tente novamente."), 502
        except Exception:
            app.logger.exception("Erro inesperado ao enviar e-mail")
            return jsonify(message="Não foi possível enviar a mensagem. Tente novamente."), 500

        return jsonify(message="Mensagem enviada com sucesso!", conversion=True)

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def frontend(path: str):
        if path.startswith("api/"):
            abort(404)

        dist = Path(app.config["FRONTEND_DIST"])
        requested = dist / path
        if path and requested.is_file():
            return send_from_directory(dist, path)
        if (dist / "index.html").is_file():
            return send_from_directory(dist, "index.html")
        return jsonify(message="Frontend build not found. Run npm run build."), 503

    @app.errorhandler(RequestEntityTooLarge)
    def request_too_large(_error):
        return jsonify(message="O conteúdo enviado excede o limite permitido."), 413


def create_app(config: dict | None = None) -> Flask:
    application = Flask(__name__)
    application.config.from_mapping(environment_config())
    if config:
        application.config.update(config)

    application.wsgi_app = ProxyFix(application.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1)
    mail.init_app(application)
    register_routes(application)
    return application


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
