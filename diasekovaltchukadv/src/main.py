from flask import Flask, render_template, request, flash, redirect
from flask_mail import Mail, Message
from config import email, senha

app = Flask(__name__)
app.secret_key = "thicode"

mail_settings = {
  "MAIL_SERVER": "smtp.gmail.com",
  "MAIL_PORT": 465,
  "MAIL_USE_TLS": False,
  "MAIL_USE_SSL": True,
  "MAIL_USERNAME": email,
  "MAIL_PASSWORD": senha,
}

app.config.update(mail_settings)

mail = Mail(app)

class Contato:
  def __init__(self, nome, email, telefone, assunto, mensagem):
    self.nome = nome
    self.email = email
    self.telefone = telefone
    self.assunto = assunto
    self.mensagem = mensagem

@app.route("/")
def index():
  return render_template('index.html')

@app.route("/send", methods=["GET", "POST"])
def send():
  
  if request.method == "POST":
    
    formContato = Contato(
      request.form["nome"],
      request.form["email"],
      request.form["telefone"],
      request.form["assunto"],
      request.form["mensagem"]
    )

    msg = Message(
      subject = f"{formContato.assunto}",
      sender = app.config.get("MAIL_USERNAME"),
      recipients = ["cultura.henrique@gmail.com", app.config.get("MAIL_USERNAME")],
      body = f"""
        Nome: {formContato.nome}
        E-mail: {formContato.email}
        Telefone: {formContato.telefone}
        Assunto: {formContato.assunto}
        Mensagem: {formContato.mensagem}
      """
    )
    
    mail.send(msg)
    
    flash("Mensagem enviada com sucesso!")
 
  return redirect("/")

if __name__ == "__main__":
 app.run()