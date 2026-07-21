ERROR_MESSAGES = {
    "captcha_failed": "Falha na verificação anti-spam. Tente novamente.",
    "contact_failed": "Não foi possível enviar a mensagem. Tente novamente.",
    "contact_success": "Mensagem enviada com sucesso!",
    "frontend_missing": "Frontend build not found. Run npm run build.",
    "honeypot": "Não foi possível enviar a mensagem. Tente novamente.",
    "invalid_subject_chars": "O assunto contém caracteres inválidos.",
    "missing_contact_to": "CONTACT_TO não contém nenhum e-mail válido.",
    "missing_env": "Variável de ambiente obrigatória ausente: {name}",
    "payload_too_large": "O conteúdo enviado excede o limite permitido.",
    "valid_email": "Informe um e-mail válido.",
    "valid_message": "Escreva um resumo do caso entre 10 e 1200 caracteres.",
    "valid_name": "Informe seu nome completo.",
    "valid_phone": "Informe um telefone válido com DDD.",
    "valid_subject": "Informe um assunto válido.",
}


def message(key: str, **values: str) -> str:
    return ERROR_MESSAGES[key].format(**values)
