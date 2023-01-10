#!/bin/sh

python manage.py migrate
python manage.py collectstatic --noinput

if [ "$DEBUG" = "true" ]; then
    python manage.py runserver 0.0.0.0:8000
else
    python -m gunicorn --bind 0.0.0.0:8080 pugtube.wsgi:application
fi
