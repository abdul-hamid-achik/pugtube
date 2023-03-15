#!/bin/bash

set -e

# Load environment variables from .env file
while IFS='=' read -r key value; do
  if [[ ! ${key} =~ ^# ]] && [[ ! -z ${key} ]]; then
    export "$key=$value"
  fi
done < .env

# COMMIT_SHA=$(git rev-parse HEAD --short)

# Authenticate with GCP
# gcloud auth login # <-- This is not needed right now
gcloud config set project pugtube

# Build the Docker image and push it to Google Container Registry
gcloud builds submit --config cloudbuild.yml --substitutions=TAG_NAME="dev",_VERCEL_TOKEN=$VERCEL_TOKEN,_VERCEL_PROJECT_ID=$VERCEL_PROJECT_ID,_VERCEL_ORG_ID=$VERCEL_ORG_ID
