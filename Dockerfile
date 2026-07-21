FROM node:24.18.0-bookworm-slim AS frontend-build

WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci
COPY frontend/ ./frontend/
RUN npm run build

FROM python:3.14.6-slim-bookworm

ENV POETRY_VERSION=2.4.1 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1

WORKDIR /app

RUN pip install --no-cache-dir "poetry==$POETRY_VERSION"

COPY pyproject.toml poetry.lock ./
RUN poetry install --only main --no-root

COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist/

CMD ["python3", "backend/main.py"]
