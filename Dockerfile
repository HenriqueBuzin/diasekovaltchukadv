# Dockerfile

FROM python:3.14.6-slim-bookworm

ENV POETRY_VERSION=2.4.1 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1

WORKDIR /src

RUN pip install --no-cache-dir "poetry==$POETRY_VERSION"

COPY pyproject.toml poetry.lock ./
RUN poetry install --only main --no-root

COPY src/ /src/

CMD ["python3", "main.py"]
