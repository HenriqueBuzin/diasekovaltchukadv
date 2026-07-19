import logging

import requests

VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


def verify(token: str, remote_ip: str | None, secret: str, logger: logging.Logger) -> bool:
    if not token:
        return False

    try:
        response = requests.post(
            VERIFY_URL,
            data={"secret": secret, "response": token, "remoteip": remote_ip or ""},
            timeout=5,
        )
        response.raise_for_status()
        return bool(response.json().get("success"))
    except requests.RequestException, ValueError:
        logger.exception("Erro ao verificar Turnstile")
        return False
