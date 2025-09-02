# src/main.py

from flask import Flask, render_template, request, flash, redirect, url_for
from flask_mail import Mail, Message
from smtplib import SMTPException
from werkzeug.middleware.proxy_fix import ProxyFix
import requests
import os

def require_env(name: str) -> str:
    val = os.getenv(name)
    if val is None or val == "":
        raise RuntimeError(f"Variável de ambiente obrigatória ausente: {name}")
    return val

def parse_bool_env(name: str) -> bool:
    val = require_env(name)
    return val.strip().lower() in ("1", "true", "t", "yes", "y")

app = Flask(__name__)
app.secret_key = require_env("FLASK_SECRET_KEY")

app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1)

app.config.update(
    PREFERRED_URL_SCHEME="https",
    SESSION_COOKIE_SECURE=not parse_bool_env("FLASK_DEBUG"),
    REMEMBER_COOKIE_SECURE=not parse_bool_env("FLASK_DEBUG"),
)

mail_settings = {
    "MAIL_SERVER": require_env("MAIL_SERVER"),
    "MAIL_PORT": int(require_env("MAIL_PORT")),
    "MAIL_USE_TLS": parse_bool_env("MAIL_USE_TLS"),
    "MAIL_USE_SSL": parse_bool_env("MAIL_USE_SSL"),
    "MAIL_USERNAME": require_env("MAIL_USERNAME"),
    "MAIL_PASSWORD": require_env("MAIL_PASSWORD"),
}

app.config.update(mail_settings)

app.config["MAIL_DEFAULT_SENDER"] = app.config["MAIL_USERNAME"]

mail = Mail(app)

CONTACT_EMAIL = require_env("CONTACT_EMAIL")
WHATS_NUMBER  = require_env("WHATS_NUMBER")
SOCIAL_FB_URL = require_env("SOCIAL_FB_URL")
SOCIAL_IG_URL = require_env("SOCIAL_IG_URL")

CAPTCHA_ENABLED = parse_bool_env("CAPTCHA_ENABLED")
TURNSTILE_SITE_KEY = require_env("TURNSTILE_SITE_KEY") if CAPTCHA_ENABLED else ""
TURNSTILE_SECRET_KEY = require_env("TURNSTILE_SECRET_KEY") if CAPTCHA_ENABLED else ""

DEBUG = parse_bool_env("FLASK_DEBUG")

CONTACT_TO = require_env("CONTACT_TO")
RECIPIENTS = [e.strip() for e in CONTACT_TO.split(",") if e.strip()]
if not RECIPIENTS:
    raise RuntimeError("CONTACT_TO não contém nenhum e-mail válido.")

def verify_turnstile(token: str, remoteip: str | None) -> bool:
    if not token:
        return False
    try:
        resp = requests.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            data={
                "secret": TURNSTILE_SECRET_KEY,
                "response": token,
                "remoteip": remoteip or "",
            },
            timeout=5,
        )
        data = resp.json()
        return bool(data.get("success"))
    except Exception:
        app.logger.exception("Erro ao verificar Turnstile")
        return False

class Contato:
    def __init__(self, nome, email, telefone, assunto, mensagem):
        self.nome = nome
        self.email = email
        self.telefone = telefone
        self.assunto = assunto
        self.mensagem = mensagem

@app.route("/")
def index():
    return render_template(
        "index.html",
        CONTACT_EMAIL=CONTACT_EMAIL,
        WHATS_NUMBER=WHATS_NUMBER,
        SOCIAL_FB_URL=SOCIAL_FB_URL,
        SOCIAL_IG_URL=SOCIAL_IG_URL,
        CAPTCHA_ENABLED=CAPTCHA_ENABLED,
        TURNSTILE_SITE_KEY=TURNSTILE_SITE_KEY
    )

@app.route("/send", methods=["POST"])
def send():
    # monta objeto com os campos do formulário
    formContato = Contato(
        request.form.get("nome", "").strip(),
        request.form.get("email", "").strip(),
        request.form.get("telefone", "").strip(),
        request.form.get("assunto", "").strip(),
        request.form.get("mensagem", "").strip(),
    )

    # 1) Honeypot: se o campo oculto "website" vier preenchido, provavelmente é bot
    if request.form.get("website"):
        app.logger.warning("Honeypot acionado no formulário de contato.")
        flash("Não foi possível enviar a mensagem. Tente novamente.", "danger")
        return redirect(url_for("index") + "#contact")

    # 2) CAPTCHA: valida o token do Cloudflare Turnstile (se habilitado)
    if CAPTCHA_ENABLED:
        token = request.form.get("cf-turnstile-response", "")
        remote_ip = (
            request.headers.get("CF-Connecting-IP")
            or request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
            or request.remote_addr
        )
        if not verify_turnstile(token, remote_ip):
            flash("Falha na verificação anti-spam. Tente novamente.", "danger")
            return redirect(url_for("index") + "#contact")

    # 3) Envia o e-mail
    try:
        msg = Message(
            subject=formContato.assunto or "Contato do site",
            recipients=RECIPIENTS,
            body=(
                f"Nome: {formContato.nome}\n"
                f"E-mail: {formContato.email}\n"
                f"Telefone: {formContato.telefone}\n"
                f"Assunto: {formContato.assunto}\n"
                f"Mensagem:\n{formContato.mensagem}\n"
            ),
        )
        # facilita o reply direto ao remetente
        try:
            msg.reply_to = formContato.email or None
        except Exception:
            pass

        mail.send(msg)
        flash("Mensagem enviada com sucesso!", "success")
    except SMTPException:
        app.logger.exception("Erro ao enviar e-mail")
        flash("Não foi possível enviar a mensagem. Tente novamente.", "danger")
    except Exception:
        app.logger.exception("Erro inesperado ao enviar e-mail")
        flash("Não foi possível enviar a mensagem. Tente novamente.", "danger")

    return redirect(url_for("index") + "#contact")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=DEBUG)
