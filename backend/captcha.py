import logging
import os
from dataclasses import dataclass
from typing import Mapping, Protocol

import requests

VERIFY_URLS = {
    "turnstile": "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    "recaptcha": "https://www.google.com/recaptcha/api/siteverify",
    "hcaptcha": "https://hcaptcha.com/siteverify",
}

ENV_PREFIXES = {
    "turnstile": "TURNSTILE",
    "recaptcha": "RECAPTCHA",
    "hcaptcha": "HCAPTCHA",
}


@dataclass(frozen=True)
class CaptchaProviderConfig:
    name: str
    site_key: str
    secret_key: str
    verify_url: str

    def public_dict(self) -> dict[str, str]:
        return {"name": self.name, "siteKey": self.site_key}


@dataclass(frozen=True)
class CaptchaSettings:
    enabled: bool
    providers: tuple[CaptchaProviderConfig, ...]
    timeout: float

    @property
    def default_provider(self) -> CaptchaProviderConfig | None:
        return self.providers[0] if self.providers else None


class CaptchaProvider(Protocol):
    def verify(self, token: str, remote_ip: str | None) -> bool:  # pragma: no cover
        ...


class HttpCaptchaProvider:
    def __init__(self, config: CaptchaProviderConfig, timeout: float, logger: logging.Logger):
        self.config = config
        self.timeout = timeout
        self.logger = logger

    def verify(self, token: str, remote_ip: str | None) -> bool:
        if not token:
            return False

        try:
            response = requests.post(
                self.config.verify_url,
                data={"secret": self.config.secret_key, "response": token, "remoteip": remote_ip or ""},
                timeout=self.timeout,
            )
            response.raise_for_status()
            return bool(response.json().get("success"))
        except requests.RequestException, ValueError:
            self.logger.exception("Erro ao verificar CAPTCHA com %s", self.config.name)
            return False


class CaptchaOrchestrator:
    def __init__(self, settings: CaptchaSettings, logger: logging.Logger):
        self.settings = settings
        self.logger = logger

    def verify(self, provider_name: str | None, token: str, remote_ip: str | None) -> bool:
        if not self.settings.enabled:
            return True

        provider_config = self._resolve_provider(provider_name)
        if provider_config is None:
            return False

        return HttpCaptchaProvider(provider_config, self.settings.timeout, self.logger).verify(token, remote_ip)

    def _resolve_provider(self, provider_name: str | None) -> CaptchaProviderConfig | None:
        requested = normalize_provider(provider_name or "")
        if not requested and len(self.settings.providers) == 1:
            return self.settings.default_provider

        return next((provider for provider in self.settings.providers if provider.name == requested), None)


def normalize_provider(value: str) -> str:
    normalized = value.strip().lower().replace("-", "").replace("_", "")
    aliases = {"cloudflare": "turnstile", "cloudflareturnstile": "turnstile", "google": "recaptcha"}
    return aliases.get(normalized, normalized)


def parse_provider_names(value: str | None) -> tuple[str, ...]:
    raw_names = value.split(",") if value else ["turnstile"]
    names: list[str] = []
    for raw_name in raw_names:
        name = normalize_provider(raw_name)
        if name and name not in names:
            names.append(name)
    return tuple(names)


def load_captcha_settings(environ: Mapping[str, str] | None = None, enabled: bool = True) -> CaptchaSettings:
    source = environ if environ is not None else os.environ
    timeout = float(source.get("CAPTCHA_TIMEOUT_SECONDS", "5"))
    if not enabled:
        return CaptchaSettings(False, (), timeout)

    providers = tuple(
        load_provider_config(source, name) for name in parse_provider_names(source.get("CAPTCHA_PROVIDERS"))
    )
    return CaptchaSettings(True, providers, timeout)


def load_provider_config(environ: Mapping[str, str], name: str) -> CaptchaProviderConfig:
    if name not in ENV_PREFIXES:
        raise RuntimeError(f"Provider de CAPTCHA não suportado: {name}")

    prefix = ENV_PREFIXES[name]
    site_key = require_config(environ, f"{prefix}_SITE_KEY")
    secret_key = require_config(environ, f"{prefix}_SECRET_KEY")
    verify_url = environ.get(f"{prefix}_VERIFY_URL", VERIFY_URLS[name])
    return CaptchaProviderConfig(name=name, site_key=site_key, secret_key=secret_key, verify_url=verify_url)


def require_config(environ: Mapping[str, str], name: str) -> str:
    value = environ.get(name)
    if not value:
        raise RuntimeError(f"Variável de ambiente obrigatória ausente: {name}")
    return value
