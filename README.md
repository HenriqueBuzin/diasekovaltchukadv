<!-- Readme.md -->

# diasekovaltchukadv

Site institucional com backend Flask e frontend React 19 + TypeScript + Vite.

## Arquitetura

- `backend/`: API Flask, validação, Turnstile e envio de e-mail;
- `frontend/`: aplicação React com TypeScript estrito, estilos, assets e testes de componentes;
- `tests/`: testes de API/backend e E2E;
- `Dockerfile`: build multi-stage que compila o React e entrega o resultado pelo Flask.

Em produção existe uma única porta HTTP. O Flask responde aos endpoints `/api/*` e serve o bundle React nas demais rotas.

## Desenvolvimento local

Com o backend ativo na porta `5000`, o Vite encaminha automaticamente as chamadas `/api`:

```powershell
# terminal 1
$env:PORT = "5000"
poetry run python backend/main.py

# terminal 2
npm run dev
```

O frontend fica disponível em `http://127.0.0.1:5173`. Para testar a forma usada em produção:

```powershell
npm run build
poetry run python backend/main.py
```

## Desenvolvimento (profile: dev)

```bash
# build das imagens
docker compose --profile dev build

# sobe a aplicação de DEV
docker compose --profile dev up -d

# logs em tempo real
docker compose --profile dev logs -f

# parar/remover
docker compose --profile dev down
```

## Produção (profile: prod)

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

Versões de desenvolvimento suportadas:

- Python 3.14.6;
- Node.js 24.18.0 LTS;
- Poetry 2.4.1;
- TypeScript 6.0.3.

Crie e ative um ambiente virtual dedicado. Neste computador ele fica em `C:\Users\henri\Documents\Projects\venv\diasekovaltchukadv`:

```powershell
& "$env:LOCALAPPDATA\Programs\Python\Python314\python.exe" -m venv C:\Users\henri\Documents\Projects\venv\diasekovaltchukadv
C:\Users\henri\Documents\Projects\venv\diasekovaltchukadv\Scripts\Activate.ps1
python -m pip install poetry==2.4.1
poetry install
nvm use 24.18.0
```

Instale também as dependências e o navegador dos testes frontend:

```bash
npm ci
npx playwright install chromium
```

No Windows, execute toda a suíte com:

```powershell
.\scripts\test.ps1
```

O script do Windows usa o Google Chrome instalado. No Linux/Jenkins, o Playwright usa o Chromium instalado pelo comando acima.

No Linux/Jenkins:

```bash
sh scripts/test.sh
```

A suíte contém:

- testes unitários das regras de validação, ambiente, telefone, e-mail e Turnstile;
- testes de API para `/api/site-config` e `/api/contact`;
- testes funcionais dos componentes React, formulário e navegação;
- testes de integração entre React, API Flask, Turnstile e e-mail simulado;
- testes de regressão para WhatsApp, conversão, acessibilidade e layout mobile;
- smoke tests da página e assets principais;
- testes E2E em Chrome desktop e viewport de iPhone SE;
- cobertura obrigatória de 100% de linhas, funções, statements e branches no backend e frontend.

### Validar automaticamente antes do commit

Instale o hook uma vez em cada clone do repositório. No Windows, o instalador também configura o GitHub Desktop para encontrar o Poetry no venv dedicado:

```powershell
.\scripts\install_hooks.ps1
```

A partir disso, `git commit` executa toda a suíte e bloqueia o commit quando qualquer teste, auditoria ou meta de cobertura falhar. Para disparar a mesma validação manualmente:

```bash
poetry run pre-commit run --all-files
```

Os hooks executam `poetry run black`, `poetry run isort` e `poetry run flake8` no backend; Prettier, ESLint e `tsc --noEmit` no frontend; e por fim a suíte completa. O workflow `.github/workflows/tests.yml` repete a validação no GitHub em todo push e pull request. O hook local atua antes do commit; o GitHub Actions protege o repositório mesmo quando alguém ainda não instalou o hook.
