FROM python:3.11.1-alpine
RUN apk update && apk add --no-cache ffmpeg gcc g++ libstdc++ musl-dev cargo
RUN pip install -U pip setuptools wheel
RUN pip install pdm
RUN pdm plugin add pdm-django
ENV MODE=agent
ENV TZ UTC
RUN cp /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
WORKDIR /api
COPY . .
RUN pdm install --prod --no-lock --no-editable -G agent
ENTRYPOINT ./scripts/entrypoint.sh