#!/bin/bash
set -e

echo "Running Django migrations..."
python manage.py migrate --noinput

echo "Starting Django server..."
exec "$@"
