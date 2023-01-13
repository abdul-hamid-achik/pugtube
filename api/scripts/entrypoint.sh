#!/bin/sh

if [ "$MODE" = "agent" ]; then
  echo "Running Prefect Agent"
  pdm manage shell < workflows/deploy.py
  pdm run prefect agent start -q default
elif [ "$MODE" = "orion" ]; then
  echo "Running Prefect Orion"
  pdm run prefect orion start --host 0.0.0.0 --port 4200
else
  echo "Running Pugtube.dev"
  pdm manage migrate
  pdm manage collectstatic --noinput

  if [ "$DEBUG" = "true" ]; then
    echo "dev mode"
    pdm manage runserver 0.0.0.0:8000
  else
    echo "production mode"
    pdm run gunicorn --bind 0.0.0.0:8000 pugtube.wsgi:application
  fi
fi
