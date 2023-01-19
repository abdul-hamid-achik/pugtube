#!/bin/sh

echo "Starting the application..."
if [ "$MODE" = "agent" ]; then
  echo "Running Prefect Agent"
  python manage.py shell < workflows/deploy.py
  python -m prefect agent start -q default
elif [ "$MODE" = "orion" ]; then
  echo "Running Prefect Orion"
  python -m prefect orion start --host 0.0.0.0 --port 4200
else
  echo "Running migrations"
  python manage.py migrate
  echo "Collecting static files"
  python manage.py collectstatic --noinput

  echo "Running Pugtube.dev"
  if [ "$DEBUG" = "true" ]; then
    python manage.py runserver 0.0.0.0:8080
  else
    python -m gunicorn --bind 0.0.0.0:8080 pugtube.wsgi:application
  fi
fi
