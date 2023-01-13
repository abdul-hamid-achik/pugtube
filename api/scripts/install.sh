#!/bin/sh

if [ "$MODE" = "agent" ]; then
  echo "Installing dependencies for Prefect Agent"
  pdm install -G agent
elif [ "$MODE" = "orion" ]; then
  echo "Installing dependencies for Prefect Orion"
  pdm install -G orion
elif [ "$MODE" = "api" ]; then
  echo "Installing dependencies for Pugtube.dev"
  pdm install --prod --no-lock --no-editable
else
  echo "Installing all dependencies for Pugtube.dev"
  pdm install --prod --no-lock --no-editable -G agent -G orion
fi
