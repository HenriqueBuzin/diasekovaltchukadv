import re
from dataclasses import dataclass
from typing import Mapping

EMAIL_PATTERN = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]{2,}")
FIELD_LIMITS = {
    "nome": (3, 120),
    "email": (3, 160),
    "telefone": (10, 11),
    "assunto": (3, 160),
    "mensagem": (10, 1200),
}


def only_digits(value: str) -> str:
    return re.sub(r"\D", "", value)


def is_valid_email(value: str) -> bool:
    return bool(EMAIL_PATTERN.fullmatch(value))


@dataclass(frozen=True)
class Contato:
    nome: str
    email: str
    telefone: str
    assunto: str
    mensagem: str

    @classmethod
    def from_mapping(cls, values: Mapping[str, str]) -> "Contato":
        def text(name: str) -> str:
            value = values.get(name, "")
            return value.strip() if isinstance(value, str) else ""

        return cls(
            nome=text("nome"),
            email=text("email"),
            telefone=text("telefone"),
            assunto=text("assunto"),
            mensagem=text("mensagem"),
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


def build_message_body(contact: Contato) -> str:
    return (
        f"Nome: {contact.nome}\n"
        f"E-mail: {contact.email}\n"
        f"Telefone: {contact.telefone}\n"
        f"Assunto: {contact.assunto}\n"
        f"Mensagem:\n{contact.mensagem}\n"
    )
