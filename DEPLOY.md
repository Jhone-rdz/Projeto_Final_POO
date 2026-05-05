# Deploy em Producao com Docker

## Estrutura recomendada

```text
Projeto_Final_POO/
├── .env
├── .env.example
├── docker-compose.yml
├── DEPLOY.md
├── deploy/
│   └── nginx/
│       └── default.conf
├── Backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── entrypoint.sh
│   ├── requirements.txt
│   └── reserveaqui/
└── Frontend/
    └── ReserveAqui/
        ├── Dockerfile
        ├── .dockerignore
        └── src/
```

## Subir ambiente

1. Copie o arquivo de variaveis:

```bash
cp .env.example .env
```

2. Ajuste os valores de producao no arquivo .env.

3. Build dos servicos:

```bash
docker compose build
```

4. Subir os containers:

```bash
docker compose up -d
```

## Comandos operacionais

1. Rodar migrations:

```bash
docker compose exec backend python manage.py migrate
```

2. Criar superusuario:

```bash
docker compose exec backend python manage.py createsuperuser
```

3. Ver logs:

```bash
docker compose logs -f
```

4. Parar stack sem apagar volumes:

```bash
docker compose down
```

5. Parar stack e remover volumes (cuidado em producao):

```bash
docker compose down -v
```

## Boas praticas aplicadas

- DEBUG desabilitado por variavel de ambiente.
- Banco PostgreSQL com volume persistente (postgres_data).
- Arquivos estaticos do Django em volume dedicado (django_static).
- Build do frontend em volume dedicado (frontend_dist).
- Nginx como proxy reverso para API Django e servidor de arquivos React.
- Cabecalhos basicos de seguranca no Nginx.
- Cookies seguros e configuracoes de hardening no Django quando DEBUG=False.

## Observacoes de producao

- Em producao real, coloque HTTPS com certificado (ex.: Let's Encrypt) e habilite SECURE_SSL_REDIRECT=True.
- Configure ALLOWED_HOSTS e CSRF_TRUSTED_ORIGINS com os dominios reais.
- Restrinja CORS_ALLOWED_ORIGINS para os dominios que realmente acessam a API.

---

# Deploy no Render (Backend)

## Passo a Passo Visual

### 1. Criar Banco de Dados PostgreSQL

1. Acesse [render.com](https://render.com)
2. No dashboard, clique em **New** → **PostgreSQL**
3. Preencha:
   - **Name**: `reserveaqui-db`
   - **Database**: `reserveaqui`
   - **User**: `reserveaqui`
   - **Region**: Escolha a mais próxima
4. Clique em **Create Database**
5. Copie a connection string que aparece (DATABASE_URL)

### 2. Criar Web Service (Backend)

1. No dashboard, clique em **New** → **Web Service**
2. Conecte seu repositório GitHub
3. Preencha:
   - **Name**: `reserveaqui-api`
   - **Root Directory**: `Backend`
   - **Environment**: Docker
   - **Region**: Mesma do banco de dados
   - **Branch**: `main`
4. Clique em **Create Web Service**

### 3. Configurar Variáveis de Ambiente

Após criar o serviço, vá para a aba **Environment** e adicione:

```
# Django
SECRET_KEY=gere-uma-chave-segura-aqui-com-32-caracteres-random
DEBUG=False
ALLOWED_HOSTS=reserveaqui-api.onrender.com

# Database (copie do passo 1)
DATABASE_URL=postgresql://reserveaqui:SENHA@PORT5432/reserveaqui
POSTGRES_CONN_MAX_AGE=60
POSTGRES_SSL_REQUIRE=True

# CORS e CSRF (adicione o frontend do Netlify)
CSRF_TRUSTED_ORIGINS=https://seu-frontend.netlify.app
CORS_ALLOWED_ORIGINS=https://seu-frontend.netlify.app

# E-mail (opcional)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=seu-email@gmail.com
EMAIL_HOST_PASSWORD=sua-senha-app

# Frontend URL
FRONTEND_URL=https://seu-frontend.netlify.app

# Segurança
SECURE_SSL_REDIRECT=False
SECURE_PROXY_SSL_HEADER=HTTP_X_FORWARDED_PROTO https
```

### 4. Deploy

1. Digite **yes** no campo de confirmação
2. Clique em **Deploy**
3. Espere os logs do build. Procure por:
   ```
   Applying migrations...
   Collecting static files...
   Starting gunicorn...
   ```

### 5. Testar

Acesse:
- `https://reserveaqui-api.onrender.com/api/schema/` - Documentação da API
- `https://reserveaqui-api.onrender.com/admin/` - Admin Django
- `https://seu-frontend.netlify.app` - Frontend React

Se receber erro 404 no admin, confira se os estáticos foram servidos (WhiteNoise)

## Checklist de Variáveis (Copiar e Colar)

Substitua os valores em colchetes pelos seus reais:

```
SECRET_KEY=[GERE-UMA-CHAVE-COM-32-CHARS-RANDOM]
DEBUG=False
ALLOWED_HOSTS=reserveaqui-api.onrender.com
DATABASE_URL=[COLE-A-CONNECTION-STRING-DO-BANCO]
POSTGRES_CONN_MAX_AGE=60
POSTGRES_SSL_REQUIRE=True
CSRF_TRUSTED_ORIGINS=https://[SEU-FRONTEND].netlify.app
CORS_ALLOWED_ORIGINS=https://[SEU-FRONTEND].netlify.app
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=[SEU-EMAIL]@gmail.com
EMAIL_HOST_PASSWORD=[SENHA-APP-GOOGLE]
FRONTEND_URL=https://[SEU-FRONTEND].netlify.app
SECURE_SSL_REDIRECT=False
SECURE_PROXY_SSL_HEADER=HTTP_X_FORWARDED_PROTO https
SENTRY_DSN=[OPCIONAL-SE-USAR-SENTRY]
SENTRY_ENVIRONMENT=production
```

## O que já está pronto

O backend já foi preparado com:
- ✅ `dj-database-url` - Lê DATABASE_URL automaticamente
- ✅ `WhiteNoise` - Serve estáticos do /admin/ automaticamente
- ✅ `entrypoint.sh` - Roda migrate e collectstatic no start
- ✅ `Dockerfile` - Usa Python 3.12, gunicorn 3 workers, 120s timeout

Não precisa mexer em nenhum arquivo.
