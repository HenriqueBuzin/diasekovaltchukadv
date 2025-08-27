# src/main.py

from flask import Flask, render_template, request, flash, redirect
from flask_mail import Mail, Message
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

mail_settings = {
    "MAIL_SERVER": require_env("MAIL_SERVER"),
    "MAIL_PORT": int(require_env("MAIL_PORT")),
    "MAIL_USE_TLS": parse_bool_env("MAIL_USE_TLS"),
    "MAIL_USE_SSL": parse_bool_env("MAIL_USE_SSL"),
    "MAIL_USERNAME": require_env("MAIL_USERNAME"),
    "MAIL_PASSWORD": require_env("MAIL_PASSWORD"),
}
app.config.update(mail_settings)

mail = Mail(app)

CONTACT_EMAIL = require_env("CONTACT_EMAIL")
WHATS_NUMBER  = require_env("WHATS_NUMBER")
SOCIAL_FB_URL = require_env("SOCIAL_FB_URL")
SOCIAL_IG_URL = require_env("SOCIAL_IG_URL")

DEBUG = parse_bool_env("FLASK_DEBUG")

CONTACT_TO = require_env("CONTACT_TO")
RECIPIENTS = [e.strip() for e in CONTACT_TO.split(",") if e.strip()]
if not RECIPIENTS:
    raise RuntimeError("CONTACT_TO não contém nenhum e-mail válido.")

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
    )

@app.route("/send", methods=["GET", "POST"])
def send():
    if request.method == "POST":
        formContato = Contato(
            request.form.get("nome", ""),
            request.form.get("email", ""),
            request.form.get("telefone", ""),
            request.form.get("assunto", ""),
            request.form.get("mensagem", ""),
        )

        msg = Message(
            subject=formContato.assunto,
            sender=app.config["MAIL_USERNAME"],
            recipients=RECIPIENTS,
            body=(
                f"Nome: {formContato.nome}\n"
                f"E-mail: {formContato.email}\n"
                f"Telefone: {formContato.telefone}\n"
                f"Assunto: {formContato.assunto}\n"
                f"Mensagem: {formContato.mensagem}\n"
            ),
        )

        mail.send(msg)
        flash("Mensagem enviada com sucesso!")

    return redirect("/#contact")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=DEBUG)
