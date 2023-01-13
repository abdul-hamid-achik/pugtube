FROM python:3.11.1-alpine
RUN apk update && apk add --no-cache ffmpeg gcc g++ libstdc++ musl-dev cargo
RUN pip install -U pip setuptools wheel
RUN pip install pdm
RUN pdm plugin add pdm-django
ARG MODE=pugtube.dev
ENV MODE=${MODE}
ENV TZ UTC
RUN cp /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
WORKDIR /api
COPY . .
RUN ./scripts/install.sh
ENTRYPOINT ./scripts/entrypoint.sh