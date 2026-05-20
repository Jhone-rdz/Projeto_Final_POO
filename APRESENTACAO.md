# Apresentação Técnica — Projeto ReserveAqui

Data da avaliação: 20/05/2026

Equipe: ReserveAqui
Repositório: https://github.com/Jhone-rdz/Projeto_Final_POO

Objetivo: roteiro para a apresentação técnica ao vivo (showcase), cobrindo stack, demo do CI, subir o sistema com Docker Compose, e demonstrar captura de erro no Sentry.

---

## 1. Tecnologias utilizadas

- **Linguagem:** Python 3.12 (backend), TypeScript/React (frontend)
- **Frameworks:** Django 6 + Django REST Framework (API), Vite + React (frontend)
- **Banco de dados:** PostgreSQL (em produção e em compose), fallback SQLite para testes locais
- **Contêineres / Orquestração:** Docker, Docker Compose
- **CI/CD:** GitHub Actions (pipeline: testes, build, publish imagem)
- **Registro de imagens:** Docker Hub (reserveaqui-backend / reserveaqui-frontend)
- **Observabilidade:** Sentry (backend + frontend) + logs rotativos (RotatingFileHandler)
- **Deploys estáticos / PaaS:** Netlify (frontend) e Render (backend) — configurados para usar as variáveis de ambiente do Sentry

---

## 2. Demonstração ao vivo (Live Demo)

Passos para executar durante a apresentação:

1. Mostrar repositório e explicar o workflow: `.github/workflows/ci-cd.yml` — destacar jobs: `backend-ci`, `frontend-ci`, `docker-build`, `publish`, `deploy`.
2. Fazer um commit de demonstração e dar push (vai disparar a Action):

```bash
git commit --allow-empty -m "ci: trigger demo pipeline"
git push origin main
```

3. Abrir a aba GitHub Actions e acompanhar o pipeline em tempo real. Pontos a observar:
- Execução dos testes (backend) — mostrar saída e status verde
- Build do frontend (Vite) e backend (Docker)
- Push para Docker Hub (publish) — mostrar tags geradas: `latest`, `sha`, `branch`

4. Confirmar imagem publicada no Docker Hub (página do repositório Docker Hub ou `docker pull` rápido).

---

## 3. Subir o projeto completo com Docker Compose

Pré-requisitos:
- Docker + Docker Compose v2 instalados
- Criar `.env` a partir de `.env.example` e preencher variáveis sensíveis (ex.: `SECRET_KEY`, `POSTGRES_PASSWORD`, `SENTRY_DSN` se desejar testar)

Comandos:

```bash
# na raiz do projeto
cp .env.example .env
# editar .env conforme necessário (SECRET_KEY, POSTGRES_*, SENTRY_DSN se quiser testar)
docker compose up --build -d

# Verificar status
docker compose ps
# Logs
docker compose logs -f backend
docker compose logs -f nginx
```

Observações:
- O `entrypoint.sh` do backend já executa `migrate` e `collectstatic` automaticamente.
- O serviço `frontend` copia os assets estáticos para o volume `frontend_dist` durante a criação do container (o compose foi configurado para isso).

---

## 4. Prova de Falha (Monitoramento / Sentry)

Objetivo: provocar um erro proposital e demonstrar que o evento aparece no painel do Sentry.

Backend (API):

1. Verifique que `SENTRY_DSN` está definido no ambiente do backend (Render ou `.env` local).
2. Acesse a rota de teste (ajustada para produção):

```
https://seu-backend.onrender.com/sentry-debug/
```

3. Conferir no Sentry que o evento chegou (chega em segundos).

Frontend (React):

1. Configure `VITE_SENTRY_DSN` no Netlify (ou variável de ambiente local) com o DSN do projeto frontend.
2. No site em produção (Netlify), clique no botão `🧪 Testar Sentry` na Home (adicionado no projeto). Isso gera uma exceção intencional.
3. Conferir no Sentry o evento referente ao frontend.

Notas: caso prefiram não expor o botão em produção, existe opção de ativá-lo via variável de ambiente `VITE_SHOW_SENTRY_TEST=true` no Netlify.

---

## 5. Checklist de avaliação (linkar ao critério)

- Funcionalidade e Automação (40%):
  - [ ] Pipeline GitHub Actions verde (tests + build)
  - [ ] Testes do backend passando (mostre saída `python manage.py test` ou log do Actions)
  - [ ] Imagem backend/frontend publicada no Docker Hub (mostrar tags)

- Orquestração com Compose (20%):
  - [ ] `docker compose up --build -d` sobe todo o ambiente (db, backend, frontend, nginx)
  - [ ] Endpoints básicos disponíveis (ex.: `/api/`, `/admin/`)

- Observabilidade (20%):
  - [ ] Sentry recebe evento de teste do backend e do frontend
  - [ ] Logs configurados (console + arquivo rotativo) — mostrar `logs/app.log` ou logs do container

- Domínio Técnico e Postura (20%):
  - [ ] Explicar decisões: uso de Docker, multi-stage builds, CI para build/push, uso de Sentry, separação de front/back

---

## 6. Comandos úteis (cole e execute durante a demo)

Pipeline & Git
```bash
# Trigger pipeline
git commit --allow-empty -m "demo: trigger CI"
git push origin main
```

Docker Compose
```bash
cp .env.example .env
# editar .env (SECRET_KEY, POSTGRES_PASSWORD, SENTRY_DSN se necessário)
docker compose up --build -d
# checar serviços e logs
docker compose ps
docker compose logs -f backend
```

Testes locais (backend)
```bash
cd Backend/reserveaqui
DB_ENGINE=sqlite DEBUG=True python manage.py test
```

Verificar imagem no Docker Hub (após CI)
```bash
docker pull jhonerdz/reserveaqui-backend:latest
```

Provocar erro (backend)
```bash
curl -i https://seu-backend.onrender.com/sentry-debug/
```

Provocar erro (frontend)
- Acesse o site no Netlify e clique no botão `🧪 Testar Sentry` na Home.

---

## 7. Problemas comuns e solução rápida

- Erro `unauthorized: access token has insufficient scopes` ao push de imagens:
  - Verifique o token Docker Hub (crie PAT com permissão de escrita) e atualize `DOCKER_USERNAME`/`DOCKER_PASSWORD` nos GitHub Actions Secrets.
- Botão de teste do frontend não aparece:
  - Assegure-se de que o deploy rodou com a versão atual (git push) ou teste localmente com `npm run dev`.
- Sentry não recebe eventos:
  - Confirme que `SENTRY_DSN` / `VITE_SENTRY_DSN` estão definidos no ambiente de deploy (Render/Netlify) e que os projetos Sentry corretos foram usados.

---

## 8. Observações finais (o que mostrar ao avaliador)

- Abrir o repositório e explicar a estrutura (Backend, Frontend, docker-compose.yml, .github/workflows).
- Disparar o pipeline e acompanhar os jobs no Actions.
- Mostrar `docker compose up` iniciando os serviços (logins, migrations automáticas).
- Provocar erro no backend e no frontend e mostrar os eventos no Sentry.

Boa apresentação! Qualquer ajuste no roteiro eu atualizo antes do dia 20/05. ola