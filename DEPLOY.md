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
