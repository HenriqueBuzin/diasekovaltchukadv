import os
import sys
import unittest
from pathlib import Path
from smtplib import SMTPException
from unittest.mock import Mock, patch

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
    def test_environment_helpers(self):
        with patch.dict(os.environ, {"TEST_VALUE": " presente ", "BOOL_VALUE": "YeS"}):
            self.assertEqual(main.require_env("TEST_VALUE"), " presente ")
            self.assertTrue(main.parse_bool_env("BOOL_VALUE"))

        with patch.dict(os.environ, {"BOOL_VALUE": "no"}):
            self.assertFalse(main.parse_bool_env("BOOL_VALUE"))

        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(RuntimeError, "TEST_MISSING"):
                main.require_env("TEST_MISSING")

    def test_normalizers_and_email_validation(self):
        self.assertEqual(contact.only_digits("+55 (48) 98802-6847"), "5548988026847")
        self.assertTrue(contact.is_valid_email("nome@example.com"))
        self.assertFalse(contact.is_valid_email("nome@invalido"))

    def test_recipient_parser(self):
        self.assertEqual(
            main.parse_recipients(" um@example.com, ,dois@example.com "),
            ["um@example.com", "dois@example.com"],
        )
        with self.assertRaisesRegex(RuntimeError, "CONTACT_TO"):
            main.parse_recipients(" , ")

    def test_turnstile_config(self):
        self.assertEqual(main.load_turnstile_config(False), ("", ""))
        with patch.dict(
            os.environ,
            {"TURNSTILE_SITE_KEY": "site-key", "TURNSTILE_SECRET_KEY": "secret-key"},
        ):
            self.assertEqual(main.load_turnstile_config(True), ("site-key", "secret-key"))

    def test_app_factory_override_and_turnstile_adapter(self):
        application = main.create_app({"TESTING": True, "TURNSTILE_SECRET_KEY": "override-secret"})
        self.assertTrue(application.testing)

        with application.app_context(), patch.object(main, "verify_turnstile_request", return_value=True) as verify:
            self.assertTrue(main.verify_turnstile("token", "203.0.113.8"))

        verify.assert_called_once_with("token", "203.0.113.8", "override-secret", application.logger)

    def test_contact_from_mapping_trims_all_fields(self):
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
        self.assertEqual(parsed.email, "nome@example.com")
        self.assertEqual(parsed.telefone, "(48) 99999-9999")
        self.assertEqual(parsed.assunto, "Assunto")
        self.assertEqual(parsed.mensagem, "Mensagem suficientemente longa")

    def test_contact_from_empty_mapping(self):
        parsed = contact.Contato.from_mapping({})
        self.assertEqual(parsed, contact.Contato("", "", "", "", ""))

    def test_contact_validation_accepts_boundaries(self):
        parsed = contact.Contato(
            nome="Ana",
            email="a@b.co",
            telefone="4899999999",
            assunto="Caso",
            mensagem="1234567890",
        )
        self.assertEqual(contact.validate_contact(parsed), [])

        eleven_digit_phone = contact.Contato(**{**parsed.__dict__, "telefone": "48999999999"})
        self.assertEqual(contact.validate_contact(eleven_digit_phone), [])

    def test_contact_validation_rejects_each_invalid_field(self):
        parsed = contact.Contato("A", "inválido", "123", "Oi", "curta")
        errors = contact.validate_contact(parsed)
        self.assertEqual(len(errors), 5)
        self.assertIn("nome", errors[0])
        self.assertIn("e-mail", errors[1])
        self.assertIn("telefone", errors[2])
        self.assertIn("assunto", errors[3])
        self.assertIn("1200", errors[4])

    def test_contact_validation_rejects_oversized_and_header_injection(self):
        parsed = contact.Contato(
            nome="N" * 121,
            email=("a" * 156) + "@b.co",
            telefone="4899999999",
            assunto=("A" * 161) + "\r\nBcc: attacker@example.com",
            mensagem="M" * 1201,
        )
        errors = contact.validate_contact(parsed)
        self.assertEqual(len(errors), 5)
        self.assertTrue(any("caracteres inválidos" in error for error in errors))


class TurnstileUnitTests(unittest.TestCase):
    def test_empty_token_is_rejected(self):
        self.assertFalse(turnstile.verify("", "127.0.0.1", "secret", Mock()))

    def test_success_and_failure_responses(self):
        response = Mock()
        response.raise_for_status.return_value = None
        response.json.side_effect = [{"success": True}, {"success": False}]

        with patch.object(turnstile.requests, "post", return_value=response) as post:
            self.assertTrue(turnstile.verify("token", None, "secret", Mock()))
            self.assertFalse(turnstile.verify("token", "203.0.113.10", "secret", Mock()))

        self.assertEqual(post.call_args_list[0].kwargs["data"]["remoteip"], "")
        self.assertEqual(post.call_args_list[1].kwargs["data"]["remoteip"], "203.0.113.10")

    def test_network_and_json_errors_are_rejected(self):
        logger = Mock()
        with patch.object(turnstile.requests, "post", side_effect=turnstile.requests.RequestException):
            self.assertFalse(turnstile.verify("token", "127.0.0.1", "secret", logger))

        response = Mock()
        response.raise_for_status.return_value = None
        response.json.side_effect = ValueError
        with patch.object(turnstile.requests, "post", return_value=response):
            self.assertFalse(turnstile.verify("token", "127.0.0.1", "secret", logger))
        self.assertEqual(logger.exception.call_count, 2)


class ApiFunctionalIntegrationTests(unittest.TestCase):
    def setUp(self):
        main.app.config.update(TESTING=True)
        self.client = main.app.test_client()

    def test_smoke_home_page_and_regression_contracts(self):
        response = self.client.get("/")
        html = response.get_data(as_text=True)

        self.assertEqual(response.status_code, 200)
        self.assertIn("Dias Kovaltchuk Advogadas Associadas", html)
        self.assertIn("https://wa.me/5548988026847", html)
        self.assertNotIn("https://wa.me/55 (48)", html)
        self.assertIn("v=test-version", html)
        self.assertNotIn("jquery", html.lower())
        self.assertIn('aria-describedby="email-error"', html)
        self.assertIn('minlength="3"', html)
        self.assertIn('data-min-digits="10"', html)
        self.assertIn("bootstrap@5.3.8", html)
        self.assertIn("images/equipe.webp", html)

    def test_conversion_event_is_rendered_once(self):
        with self.client.session_transaction() as flask_session:
            flask_session["conversion_fired"] = True

        first = self.client.get("/").get_data(as_text=True)
        second = self.client.get("/").get_data(as_text=True)

        self.assertIn("AW-17913181584/aE3cCKLPmY4cEJDr1d1C", first)
        self.assertNotIn("AW-17913181584/aE3cCKLPmY4cEJDr1d1C", second)

    def test_send_endpoint_rejects_get(self):
        self.assertEqual(self.client.get("/send").status_code, 405)

    def test_request_size_limit(self):
        response = self.client.post(
            "/send",
            data={**VALID_CONTACT, "mensagem": "X" * (65 * 1024)},
        )
        self.assertEqual(response.status_code, 413)

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

        self.assertIn("e-mail válido", response.get_data(as_text=True))
        send_mail.assert_not_called()

    def test_honeypot_is_rejected(self):
        with patch.object(main.mail, "send") as send_mail:
            response = self.client.post(
                "/send",
                data={**VALID_CONTACT, "website": "https://spam.example"},
                follow_redirects=True,
            )

        self.assertIn("Não foi possível enviar", response.get_data(as_text=True))
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
                patch.dict(main.app.config, {"CAPTCHA_ENABLED": True}),
                patch.object(main, "verify_turnstile", return_value=False) as verify,
                patch.object(main.mail, "send") as send_mail,
            ):
                response = self.client.post(
                    "/send",
                    data={**VALID_CONTACT, "cf-turnstile-response": "token"},
                    headers=headers,
                    follow_redirects=True,
                )

            self.assertIn("anti-spam", response.get_data(as_text=True))
            verify.assert_called_once_with("token", expected_ip)
            send_mail.assert_not_called()

    def test_valid_contact_sends_expected_message(self):
        with patch.object(main.mail, "send") as send_mail:
            response = self.client.post("/send", data=VALID_CONTACT)

        self.assertEqual(response.status_code, 302)
        self.assertTrue(response.headers["Location"].endswith("/#contact"))
        message = send_mail.call_args.args[0]
        self.assertEqual(message.subject, VALID_CONTACT["assunto"])
        self.assertEqual(message.reply_to, VALID_CONTACT["email"])
        self.assertIn(VALID_CONTACT["mensagem"], message.body)

        with self.client.session_transaction() as flask_session:
            self.assertTrue(flask_session["conversion_fired"])

    def test_valid_captcha_allows_mail_delivery(self):
        with (
            patch.dict(main.app.config, {"CAPTCHA_ENABLED": True}),
            patch.object(main, "verify_turnstile", return_value=True) as verify,
            patch.object(main.mail, "send") as send_mail,
        ):
            response = self.client.post(
                "/send",
                data={**VALID_CONTACT, "cf-turnstile-response": "valid-token"},
            )

        self.assertEqual(response.status_code, 302)
        verify.assert_called_once_with("valid-token", "127.0.0.1")
        send_mail.assert_called_once()

    def test_smtp_and_unexpected_failures_show_safe_message(self):
        for error in (SMTPException("smtp"), RuntimeError("unexpected")):
            with self.subTest(error=type(error).__name__), patch.object(main.mail, "send", side_effect=error):
                response = self.client.post("/send", data=VALID_CONTACT, follow_redirects=True)

            self.assertEqual(response.status_code, 200)
            self.assertIn("Não foi possível enviar", response.get_data(as_text=True))


if __name__ == "__main__":
    unittest.main()
