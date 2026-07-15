# src/main.py

import os
import re
from dataclasses import dataclass
from smtplib import SMTPException

import requests
from flask import Flask, flash, redirect, render_template, request, session, url_for
from flask_mail import Mail, Message
from werkzeug.middleware.proxy_fix import ProxyFix

EMAIL_PATTERN = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]{2,}")
FIELD_LIMITS = {
    "nome": (3, 120),
    "email": (3, 160),
    "telefone": (10, 11),
    "assunto": (3, 160),
    "mensagem": (10, 1200),
}


def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Variável de ambiente obrigatória ausente: {name}")
    return value


def parse_bool_env(name: str) -> bool:
    return require_env(name).strip().lower() in ("1", "true", "t", "yes", "y")


def only_digits(value: str) -> str:
    return re.sub(r"\D", "", value)


def is_valid_email(value: str) -> bool:
    return bool(EMAIL_PATTERN.fullmatch(value))


def parse_recipients(value: str) -> list[str]:
    recipients = [email.strip() for email in value.split(",") if email.strip()]
    if not recipients:
        raise RuntimeError("CONTACT_TO não contém nenhum e-mail válido.")
    return recipients


def load_turnstile_config(enabled: bool) -> tuple[str, str]:
    if not enabled:
        return "", ""
    return require_env("TURNSTILE_SITE_KEY"), require_env("TURNSTILE_SECRET_KEY")


@dataclass(frozen=True)
class Contato:
    nome: str
    email: str
    telefone: str
    assunto: str
    mensagem: str

    @classmethod
    def from_request(cls) -> "Contato":
        return cls(
            nome=request.form.get("nome", "").strip(),
            email=request.form.get("email", "").strip(),
            telefone=request.form.get("telefone", "").strip(),
            assunto=request.form.get("assunto", "").strip(),
            mensagem=request.form.get("mensagem", "").strip(),
        )


def validate_contact(contact: Contato) -> list[str]:
    errors = []
    phone_digits = only_digits(contact.telefone)

    if not FIELD_LIMITS["nome"][0] <= len(contact.nome) <= FIELD_LIMITS["nome"][1]:
        errors.append("Informe seu nome completo.")
    if len(contact.email) > FIELD_LIMITS["email"][1] or not is_valid_email(contact.email):
        errors.append("Informe um e-mail válido.")
    if len(phone_digits) not in FIELD_LIMITS["telefone"]:
        errors.append("Informe um telefone válido com DDD.")
    if not FIELD_LIMITS["assunto"][0] <= len(contact.assunto) <= FIELD_LIMITS["assunto"][1]:
        errors.append("Informe um assunto válido.")
    if "\r" in contact.assunto or "\n" in contact.assunto:
        errors.append("O assunto contém caracteres inválidos.")
    if not FIELD_LIMITS["mensagem"][0] <= len(contact.mensagem) <= FIELD_LIMITS["mensagem"][1]:
        errors.append("Escreva um resumo do caso entre 10 e 1200 caracteres.")

    return errors


app = Flask(__name__)
app.secret_key = require_env("FLASK_SECRET_KEY")
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1)

DEBUG = parse_bool_env("FLASK_DEBUG")

app.config.update(
    PREFERRED_URL_SCHEME="https",
    SESSION_COOKIE_SECURE=not DEBUG,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    REMEMBER_COOKIE_SECURE=not DEBUG,
    MAX_CONTENT_LENGTH=64 * 1024,
    MAIL_SERVER=require_env("MAIL_SERVER"),
    MAIL_PORT=int(require_env("MAIL_PORT")),
    MAIL_USE_TLS=parse_bool_env("MAIL_USE_TLS"),
    MAIL_USE_SSL=parse_bool_env("MAIL_USE_SSL"),
    MAIL_USERNAME=require_env("MAIL_USERNAME"),
    MAIL_PASSWORD=require_env("MAIL_PASSWORD"),
)
app.config["MAIL_DEFAULT_SENDER"] = app.config["MAIL_USERNAME"]

mail = Mail(app)

CONTACT_EMAIL = require_env("CONTACT_EMAIL")
WHATS_NUMBER = require_env("WHATS_NUMBER")
WHATS_LINK_NUMBER = only_digits(WHATS_NUMBER)
SOCIAL_FB_URL = require_env("SOCIAL_FB_URL")
SOCIAL_IG_URL = require_env("SOCIAL_IG_URL")
ASSET_VERSION = os.getenv("ASSET_VERSION", "20260711")

CAPTCHA_ENABLED = parse_bool_env("CAPTCHA_ENABLED")
TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY = load_turnstile_config(CAPTCHA_ENABLED)

RECIPIENTS = parse_recipients(require_env("CONTACT_TO"))


def verify_turnstile(token: str, remote_ip: str | None) -> bool:
    if not token:
        return False

    try:
        response = requests.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            data={
                "secret": TURNSTILE_SECRET_KEY,
                "response": token,
                "remoteip": remote_ip or "",
            },
            timeout=5,
        )
        response.raise_for_status()
        return bool(response.json().get("success"))
    except requests.RequestException, ValueError:
        app.logger.exception("Erro ao verificar Turnstile")
        return False


def contact_redirect():
    return redirect(url_for("index") + "#contact")


@app.route("/")
def index():
    return render_template(
        "index.html",
        CONTACT_EMAIL=CONTACT_EMAIL,
        WHATS_NUMBER=WHATS_NUMBER,
        WHATS_LINK_NUMBER=WHATS_LINK_NUMBER,
        SOCIAL_FB_URL=SOCIAL_FB_URL,
        SOCIAL_IG_URL=SOCIAL_IG_URL,
        CAPTCHA_ENABLED=CAPTCHA_ENABLED,
        TURNSTILE_SITE_KEY=TURNSTILE_SITE_KEY,
        ASSET_VERSION=ASSET_VERSION,
    )


@app.route("/send", methods=["POST"])
def send():
    contact = Contato.from_request()

    if request.form.get("website"):
        app.logger.warning("Honeypot acionado no formulário de contato.")
        flash("Não foi possível enviar a mensagem. Tente novamente.", "danger")
        return contact_redirect()

    validation_errors = validate_contact(contact)
    if validation_errors:
        flash(" ".join(validation_errors), "danger")
        return contact_redirect()

    if CAPTCHA_ENABLED:
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
            recipients=RECIPIENTS,
            reply_to=contact.email,
            body=(
                f"Nome: {contact.nome}\n"
                f"E-mail: {contact.email}\n"
                f"Telefone: {contact.telefone}\n"
                f"Assunto: {contact.assunto}\n"
                f"Mensagem:\n{contact.mensagem}\n"
            ),
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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=DEBUG)
