<!-- Readme.md -->

# diasekovaltchukadv

Site em Flask com Caddy como reverse proxy.

## Desenvolvimento (profile: dev)

```bash
# build das imagens
docker compose --profile dev build

# sobe os serviços de DEV (Caddy em :8080)
docker compose --profile dev up -d

# logs em tempo real
docker compose --profile dev logs -f

# parar/remover
docker compose --profile dev down
```

## Desenvolvimento (profile: prod)

```bash
docker compose --profile prod build

# sobe os serviços de PROD (80/443)
docker compose --profile prod up -d

# logs em tempo real
docker compose --profile prod logs -f

# parar/remover
docker compose --profile prod down
```

## Testes

Instale as dependências de desenvolvimento:

```bash
python -m pip install -r requirements-dev.txt
npm ci
npx playwright install chromium
```

No Windows, execute toda a suíte com:

```powershell
.\scripts\test.ps1 -Python python
```

O script do Windows usa o Google Chrome instalado. No Linux/Jenkins, o Playwright usa o Chromium instalado pelo comando acima.

No Linux/Jenkins:

```bash
sh scripts/test.sh
```

A suíte contém:

- testes unitários das regras de validação, ambiente, telefone, e-mail e Turnstile;
- testes de API para `/` e `/send`;
- testes funcionais do formulário e navegação;
- testes de integração entre Flask, template, sessão e e-mail simulado;
- testes de regressão para WhatsApp, conversão, acessibilidade e layout mobile;
- smoke tests da página e assets principais;
- testes E2E em Chrome desktop e viewport de iPhone SE;
- cobertura obrigatória de 100% de linhas, funções, statements e branches no backend e frontend.
