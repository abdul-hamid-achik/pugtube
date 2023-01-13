#!/bin/sh

if [ "$MODE" = "agent" ]; then
  echo "Installing dependencies for Prefect Agent"
  pdm install -G agent
elif [ "$MODE" = "orion" ]; then
  echo "Installing dependencies for Prefect Orion"
  pdm install -G orion
else
  echo "Installing dependencies for Pugtube.dev"
  pdm install --prod --no-lock --no-editable
fi
