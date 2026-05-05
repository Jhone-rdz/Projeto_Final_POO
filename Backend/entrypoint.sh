#!/bin/sh
set -e

python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Garantir que existe um admin (rodar sempre, é idempotente)
python manage.py ensure_admin

exec gunicorn reserveaqui.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 3 \
  --timeout 120
