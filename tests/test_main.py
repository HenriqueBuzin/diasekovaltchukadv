import os
from pathlib import Path
import sys
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

ENV_DEFAULTS = {
    "FLASK_SECRET_KEY": "test-secret",
    "FLASK_DEBUG": "true",
    "MAIL_SERVER": "localhost",
    "MAIL_PORT": "25",
    "MAIL_USE_TLS": "false",
    "MAIL_USE_SSL": "false",
    "MAIL_USERNAME": "site@example.com",
    "MAIL_PASSWORD": "password",
    "CONTACT_EMAIL": "contato@example.com",
    "WHATS_NUMBER": "55 (48) 98802-6847",
    "SOCIAL_FB_URL": "https://facebook.com/example",
    "SOCIAL_IG_URL": "https://instagram.com/example",
    "CAPTCHA_ENABLED": "false",
    "CONTACT_TO": "destino@example.com",
    "ASSET_VERSION": "test-version",
}

for name, value in ENV_DEFAULTS.items():
    os.environ.setdefault(name, value)

import main


VALID_CONTACT = {
    "nome": "Pessoa da Silva",
    "email": "pessoa@example.com",
    "telefone": "(48) 99999-9999",
    "assunto": "Orientação jurídica",
    "mensagem": "Gostaria de entender os próximos passos do meu caso.",
}


class ContactSiteTest(unittest.TestCase):
    def setUp(self):
        main.app.config.update(TESTING=True)
        self.client = main.app.test_client()

    def test_index_uses_sanitized_whatsapp_and_asset_version(self):
        response = self.client.get("/")
        html = response.get_data(as_text=True)

        self.assertEqual(response.status_code, 200)
        self.assertIn("https://wa.me/5548988026847", html)
        self.assertNotIn("https://wa.me/55 (48)", html)
        self.assertIn("v=test-version", html)

    def test_invalid_contact_is_rejected_before_mail(self):
        invalid = {
            "nome": "A",
            "email": "invalido",
            "telefone": "123",
            "assunto": "Oi",
            "mensagem": "curta",
        }

        with patch.object(main.mail, "send") as send_mail:
            response = self.client.post("/send", data=invalid, follow_redirects=True)

        self.assertEqual(response.status_code, 200)
        self.assertIn("e-mail válido", response.get_data(as_text=True))
        send_mail.assert_not_called()

    def test_honeypot_is_rejected(self):
        payload = {**VALID_CONTACT, "website": "https://spam.example"}

        with patch.object(main.mail, "send") as send_mail:
            response = self.client.post("/send", data=payload, follow_redirects=True)

        self.assertIn("Não foi possível enviar", response.get_data(as_text=True))
        send_mail.assert_not_called()

    def test_valid_contact_sends_mail_and_marks_conversion(self):
        with patch.object(main.mail, "send") as send_mail:
            response = self.client.post("/send", data=VALID_CONTACT)

        self.assertEqual(response.status_code, 302)
        self.assertTrue(response.headers["Location"].endswith("/#contact"))
        send_mail.assert_called_once()

        message = send_mail.call_args.args[0]
        self.assertEqual(message.reply_to, VALID_CONTACT["email"])
        self.assertIn(VALID_CONTACT["mensagem"], message.body)

        with self.client.session_transaction() as flask_session:
            self.assertTrue(flask_session["conversion_fired"])


if __name__ == "__main__":
    unittest.main()
