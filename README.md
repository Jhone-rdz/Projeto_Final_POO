# ReserveAqui

Projeto Final — Sistema de reservas de mesas para restaurantes.

## Visão Geral
ReserveAqui é uma aplicação full‑stack (Django REST API + React/TypeScript) que permite clientes criarem reservas, funcionários e proprietários gerenciarem mesas e reservas, e administradores do sistema gerenciarem restaurantes e relatórios.

## Arquitetura
- Backend: Django REST Framework (API)
- Frontend: React + TypeScript (Vite)
- Banco: PostgreSQL
- Reverse Proxy / CDN: Nginx
- Observabilidade: Sentry (opcional)
- Empacotamento: Docker + Docker Compose

## Tecnologias
- Python 3.12, Django 6.x
- Django REST Framework, Simple JWT
- Node 20, React, TypeScript, Tailwind (quando aplicável)
- PostgreSQL, WhiteNoise
- Docker, Docker Compose, GitHub Actions

## Executando localmente
Pré-requisitos: Python 3.12+, Node 20, Docker (opcional)

Backend (virtualenv):
```bash
cd Backend/reserveaqui
python3 -m venv venv
source venv/bin/activate
pip install -r ../requirements.txt
python manage.py migrate
python manage.py seed_database
python manage.py runserver
```

Frontend (dev):
```bash
cd Frontend/ReserveAqui
npm ci
npm run dev
```

## Executando com Docker
1. Copie e ajuste variáveis:
```bash
cp .env.example .env
# edite .env conforme necessário
```
2. Build e subir stack:
```bash
docker compose build
docker compose up -d
```
3. Comandos úteis:
```bash
docker compose exec backend python manage.py migrate --noinput
docker compose exec backend python manage.py collectstatic --noinput
docker compose logs -f
```

## Testes
Backend:
```bash
cd Backend/reserveaqui
pytest  # ou python manage.py test
```

Frontend:
```bash
cd Frontend/ReserveAqui
npm test
```

## CI/CD
- O repositório possui GitHub Actions em `.github/workflows/ci-cd.yml` que:
  - executa testes backend e frontend
  - valida build das imagens Docker
  - publica imagens para o Docker Hub (quando os secrets `DOCKER_USERNAME` e `DOCKER_PASSWORD` estiverem configurados)
  - realiza deploy por SSH quando variáveis de deploy estiverem presentes

### Secrets necessários para publicar no Docker Hub via CI
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`

## Observabilidade
- Sentry integrado condicionalmente via `SENTRY_DSN` (veja `Backend/reserveaqui/reserveaqui/settings.py`)
- Logs configurados para console e arquivo (`logs/app.log`) com rotação

## Docker Hub / Publicação
- O CI gera e publica imagens com tags: `latest`, `{{ commit SHA }}` e `{{ branch name }}`. Configure `DOCKER_USERNAME` e `DOCKER_PASSWORD` nos Secrets do repositório antes de permitir publish.

## Variáveis de ambiente (resumo)
- Veja `.env.example` para todas as variáveis. Principais:
  - `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`
  - Banco: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`
  - `SENTRY_DSN`, `SENTRY_ENVIRONMENT`
  - `FRONTEND_URL`

## Estrutura de pastas
- `Backend/` — API Django
- `Frontend/ReserveAqui/` — aplicação React
- `deploy/nginx/` — configuração do Nginx
- `docker-compose.yml` — stack local/produção simples

## Segurança e boas práticas aplicadas
- `.env` está em `.gitignore` — variáveis sensíveis não versionadas
- Builds Docker otimizados (multi-stage, .dockerignore)
- Usuário não-root em containers de aplicação
- Sentry integrado e logging estruturado

## Como revisar branch protection e required checks
- Vá em Settings → Branches → Add rule para `main`
- Marque `Require status checks to pass before merging` e selecione os jobs do workflow (`Backend CI`, `Frontend CI`, `Docker Build Validation`, `Publish images`)
- Habilite `Require pull request reviews before merging` e `Include administrators` se desejar bloqueio total

---

Se quiser, aplico também as mudanças em pequenos commits separados (CI, Dockerfiles, logging, README).