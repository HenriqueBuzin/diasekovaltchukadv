import os
from smtplib import SMTPException

from flask import Flask, current_app, flash, redirect, render_template, request, session, url_for
from flask_mail import Mail, Message
from werkzeug.middleware.proxy_fix import ProxyFix

from contact import FIELD_LIMITS, Contato, build_message_body, only_digits, validate_contact
from turnstile import verify as verify_turnstile_request

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
        "SESSION_COOKIE_SECURE": not debug,
        "SESSION_COOKIE_HTTPONLY": True,
        "SESSION_COOKIE_SAMESITE": "Lax",
        "REMEMBER_COOKIE_SECURE": not debug,
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
        "ASSET_VERSION": os.getenv("ASSET_VERSION", "20260716"),
        "CAPTCHA_ENABLED": captcha_enabled,
        "TURNSTILE_SITE_KEY": turnstile_site_key,
        "TURNSTILE_SECRET_KEY": turnstile_secret_key,
        "RECIPIENTS": parse_recipients(require_env("CONTACT_TO")),
    }


def verify_turnstile(token: str, remote_ip: str | None) -> bool:
    return verify_turnstile_request(
        token,
        remote_ip,
        current_app.config["TURNSTILE_SECRET_KEY"],
        current_app.logger,
    )


def contact_redirect():
    return redirect(url_for("index") + "#contact")


def register_routes(app: Flask) -> None:
    @app.route("/")
    def index():
        template_context = {
            name: app.config[name]
            for name in (
                "CONTACT_EMAIL",
                "WHATS_NUMBER",
                "WHATS_LINK_NUMBER",
                "SOCIAL_FB_URL",
                "SOCIAL_IG_URL",
                "CAPTCHA_ENABLED",
                "TURNSTILE_SITE_KEY",
                "ASSET_VERSION",
            )
        }
        return render_template("index.html", FIELD_LIMITS=FIELD_LIMITS, **template_context)

    @app.route("/send", methods=["POST"])
    def send():
        contact = Contato.from_mapping(request.form)

        if request.form.get("website"):
            app.logger.warning("Honeypot acionado no formulário de contato.")
            flash("Não foi possível enviar a mensagem. Tente novamente.", "danger")
            return contact_redirect()

        validation_errors = validate_contact(contact)
        if validation_errors:
            flash(" ".join(validation_errors), "danger")
            return contact_redirect()

        if app.config["CAPTCHA_ENABLED"]:
            remote_ip = (
                request.headers.get("CF-Connecting-IP")
                or request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
                or request.remote_addr
            )
            if not verify_turnstile(request.form.get("cf-turnstile-response", ""), remote_ip):
                flash("Falha na verificação anti-spam. Tente novamente.", "danger")
                return contact_redirect()

        try:
            message = Message(
                subject=contact.assunto,
                recipients=app.config["RECIPIENTS"],
                reply_to=contact.email,
                body=build_message_body(contact),
            )
            mail.send(message)
            flash("Mensagem enviada com sucesso!", "success")
            session["conversion_fired"] = True
        except SMTPException:
            app.logger.exception("Erro ao enviar e-mail")
            flash("Não foi possível enviar a mensagem. Tente novamente.", "danger")
        except Exception:
            app.logger.exception("Erro inesperado ao enviar e-mail")
            flash("Não foi possível enviar a mensagem. Tente novamente.", "danger")

        return contact_redirect()


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
