FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instala dependências do sistema em uma única camada
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev gcc build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copia apenas requirements primeiro para aproveitar cache de camadas
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Copia o código da aplicação
COPY reserveaqui /app
COPY entrypoint.sh /entrypoint.sh

# Cria usuário não-root e ajusta permissões
RUN adduser --disabled-password --gecos "" appuser \
    && chown -R appuser:appuser /app /entrypoint.sh \
    && chmod +x /entrypoint.sh

USER appuser

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
