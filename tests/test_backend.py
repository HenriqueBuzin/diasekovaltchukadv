import os
import sys
import tempfile
import unittest
from pathlib import Path
from smtplib import SMTPException
from unittest.mock import Mock, patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

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
}

for name, value in ENV_DEFAULTS.items():
    os.environ.setdefault(name, value)

import contact  # noqa: E402
import main  # noqa: E402
import turnstile  # noqa: E402

VALID_CONTACT = {
    "nome": "Pessoa da Silva",
    "email": "pessoa@example.com",
    "telefone": "(48) 99999-9999",
    "assunto": "Orientação jurídica",
    "mensagem": "Gostaria de entender os próximos passos do meu caso.",
}


class UnitTests(unittest.TestCase):
    def test_environment_helpers_and_configuration(self):
        with patch.dict(os.environ, {"TEST_VALUE": " presente ", "BOOL_VALUE": "YeS"}):
            self.assertEqual(main.require_env("TEST_VALUE"), " presente ")
            self.assertTrue(main.parse_bool_env("BOOL_VALUE"))

        with patch.dict(os.environ, {"BOOL_VALUE": "no"}):
            self.assertFalse(main.parse_bool_env("BOOL_VALUE"))

        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(RuntimeError, "TEST_MISSING"):
                main.require_env("TEST_MISSING")

        self.assertEqual(
            main.parse_recipients(" um@example.com, ,dois@example.com "), ["um@example.com", "dois@example.com"]
        )
        with self.assertRaisesRegex(RuntimeError, "CONTACT_TO"):
            main.parse_recipients(" , ")

        self.assertEqual(main.load_turnstile_config(False), ("", ""))
        with patch.dict(os.environ, {"TURNSTILE_SITE_KEY": "site-key", "TURNSTILE_SECRET_KEY": "secret-key"}):
            self.assertEqual(main.load_turnstile_config(True), ("site-key", "secret-key"))

    def test_contact_normalization_validation_and_message(self):
        self.assertEqual(contact.only_digits("+55 (48) 98802-6847"), "5548988026847")
        self.assertTrue(contact.is_valid_email("nome@example.com"))
        self.assertFalse(contact.is_valid_email("nome@invalido"))

        parsed = contact.Contato.from_mapping(
            {
                "nome": "  Nome  ",
                "email": "  nome@example.com ",
                "telefone": "  (48) 99999-9999 ",
                "assunto": "  Assunto  ",
                "mensagem": "  Mensagem suficientemente longa  ",
            }
        )
        self.assertEqual(parsed.nome, "Nome")
        self.assertIn("Mensagem suficientemente longa", contact.build_message_body(parsed))
        self.assertEqual(contact.Contato.from_mapping({"nome": 123}), contact.Contato("", "", "", "", ""))

        boundary = contact.Contato("Ana", "a@b.co", "4899999999", "Caso", "1234567890")
        self.assertEqual(contact.validate_contact(boundary), [])
        eleven_digits = contact.Contato(**{**boundary.__dict__, "telefone": "48999999999"})
        self.assertEqual(contact.validate_contact(eleven_digits), [])

        invalid = contact.Contato("A", "inválido", "123", "Oi", "curta")
        self.assertEqual(len(contact.validate_contact(invalid)), 5)
        oversized = contact.Contato(
            "N" * 121,
            ("a" * 156) + "@b.co",
            "4899999999",
            ("A" * 161) + "\r\nBcc: attacker@example.com",
            "M" * 1201,
        )
        errors = contact.validate_contact(oversized)
        self.assertEqual(len(errors), 5)
        self.assertTrue(any("caracteres inválidos" in error for error in errors))

    def test_app_factory_override_and_turnstile_adapter(self):
        application = main.create_app({"TESTING": True, "TURNSTILE_SECRET_KEY": "override-secret"})
        self.assertTrue(application.testing)
        with application.app_context(), patch.object(main, "verify_turnstile_request", return_value=True) as verify:
            self.assertTrue(main.verify_turnstile("token", "203.0.113.8"))
        verify.assert_called_once_with("token", "203.0.113.8", "override-secret", application.logger)


class TurnstileUnitTests(unittest.TestCase):
    def test_empty_success_failure_and_exceptions(self):
        logger = Mock()
        self.assertFalse(turnstile.verify("", "127.0.0.1", "secret", logger))

        response = Mock()
        response.raise_for_status.return_value = None
        response.json.side_effect = [{"success": True}, {"success": False}]
        with patch.object(turnstile.requests, "post", return_value=response) as post:
            self.assertTrue(turnstile.verify("token", None, "secret", logger))
            self.assertFalse(turnstile.verify("token", "203.0.113.10", "secret", logger))
        self.assertEqual(post.call_args_list[0].kwargs["data"]["remoteip"], "")
        self.assertEqual(post.call_args_list[1].kwargs["data"]["remoteip"], "203.0.113.10")

        with patch.object(turnstile.requests, "post", side_effect=turnstile.requests.RequestException):
            self.assertFalse(turnstile.verify("token", "127.0.0.1", "secret", logger))
        response.json.side_effect = ValueError
        with patch.object(turnstile.requests, "post", return_value=response):
            self.assertFalse(turnstile.verify("token", "127.0.0.1", "secret", logger))
        self.assertEqual(logger.exception.call_count, 2)


class ApiFunctionalIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        dist = Path(self.temp.name)
        (dist / "index.html").write_text("<title>React frontend</title>", encoding="utf-8")
        (dist / "asset.js").write_text("console.log('asset')", encoding="utf-8")
        self.app = main.create_app({"TESTING": True, "FRONTEND_DIST": dist, "CAPTCHA_ENABLED": False})
        self.client = self.app.test_client()

    def tearDown(self):
        self.temp.cleanup()

    def test_site_config_and_frontend_routes(self):
        response = self.client.get("/api/site-config")
        config = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(config["whatsLinkNumber"], "5548988026847")
        self.assertEqual(config["fieldLimits"]["mensagem"], {"min": 10, "max": 1200})

        for path, expected in (
            ("/", "React frontend"),
            ("/asset.js", "console.log"),
            ("/rota-do-react", "React frontend"),
        ):
            with self.client.get(path) as frontend_response:
                self.assertIn(expected, frontend_response.get_data(as_text=True))
        self.assertEqual(self.client.get("/api/missing").status_code, 404)

        self.app.config["FRONTEND_DIST"] = Path(self.temp.name) / "missing"
        missing = self.client.get("/")
        self.assertEqual(missing.status_code, 503)
        self.assertIn("npm run build", missing.get_json()["message"])

    def test_method_and_request_size_contracts(self):
        self.assertEqual(self.client.get("/api/contact").status_code, 404)
        response = self.client.post("/api/contact", json={**VALID_CONTACT, "mensagem": "X" * (65 * 1024)})
        self.assertEqual(response.status_code, 413)
        self.assertIn("limite", response.get_json()["message"])

    def test_invalid_contact_and_honeypot_are_rejected(self):
        with patch.object(main.mail, "send") as send_mail:
            invalid = self.client.post("/api/contact", json={"nome": "A"})
            honeypot = self.client.post("/api/contact", json={**VALID_CONTACT, "website": "spam"})
        self.assertEqual(invalid.status_code, 400)
        self.assertEqual(len(invalid.get_json()["errors"]), 5)
        self.assertEqual(honeypot.status_code, 400)
        send_mail.assert_not_called()

    def test_captcha_failure_uses_each_proxy_ip_source(self):
        cases = [
            ({"CF-Connecting-IP": "203.0.113.1"}, "203.0.113.1"),
            ({"X-Forwarded-For": "203.0.113.2, 10.0.0.1"}, "203.0.113.2"),
            ({}, "127.0.0.1"),
        ]
        for headers, expected_ip in cases:
            with (
                self.subTest(headers=headers),
                patch.dict(self.app.config, {"CAPTCHA_ENABLED": True}),
                patch.object(main, "verify_turnstile", return_value=False) as verify,
                patch.object(main.mail, "send") as send_mail,
            ):
                response = self.client.post(
                    "/api/contact",
                    json={**VALID_CONTACT, "captchaToken": "token"},
                    headers=headers,
                )
            self.assertEqual(response.status_code, 400)
            verify.assert_called_once_with("token", expected_ip)
            send_mail.assert_not_called()

    def test_valid_json_and_form_contacts_send_mail(self):
        with patch.object(main.mail, "send") as send_mail:
            json_response = self.client.post("/api/contact", json=VALID_CONTACT)
            form_response = self.client.post("/api/contact", data=VALID_CONTACT)
        self.assertEqual(json_response.status_code, 200)
        self.assertTrue(json_response.get_json()["conversion"])
        self.assertEqual(form_response.status_code, 200)
        self.assertEqual(send_mail.call_count, 2)
        message = send_mail.call_args_list[0].args[0]
        self.assertEqual(message.subject, VALID_CONTACT["assunto"])
        self.assertEqual(message.reply_to, VALID_CONTACT["email"])

    def test_valid_captcha_allows_delivery(self):
        with (
            patch.dict(self.app.config, {"CAPTCHA_ENABLED": True}),
            patch.object(main, "verify_turnstile", return_value=True) as verify,
            patch.object(main.mail, "send") as send_mail,
        ):
            response = self.client.post("/api/contact", json={**VALID_CONTACT, "captchaToken": "valid-token"})
        self.assertEqual(response.status_code, 200)
        verify.assert_called_once_with("valid-token", "127.0.0.1")
        send_mail.assert_called_once()

    def test_mail_failures_return_safe_json(self):
        for error, status in ((SMTPException("smtp"), 502), (RuntimeError("unexpected"), 500)):
            with self.subTest(status=status), patch.object(main.mail, "send", side_effect=error):
                response = self.client.post("/api/contact", json=VALID_CONTACT)
            self.assertEqual(response.status_code, status)
            self.assertIn("Não foi possível", response.get_json()["message"])


if __name__ == "__main__":
    unittest.main()
