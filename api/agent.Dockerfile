# build stage
FROM python:3.11-alpine AS builder

# install PDM
RUN pip install -U pip setuptools wheel
RUN pip install pdm

# copy files
COPY . /agent

# install dependencies and project into the local packages directory
WORKDIR /agent
RUN apk add --no-cache cargo
RUN mkdir __pypackages__ && pdm install --prod --no-lock --no-editable -G agent

# run stage
FROM python:3.11-alpine AS runner

# retrieve packages from build stage
ENV PYTHONPATH=/pugtube/pkgs
ENV PATH=/pugtube/bin:$PATH
ENV MODE=agent
ENV TZ=UTC

RUN cp /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN apk update && apk add --no-cache ffmpeg gcc g++ libstdc++ musl-dev

RUN mkdir -p /pugtube

# retrieve packages from build stage
COPY --from=builder /agent/__pypackages__/3.11/lib /pugtube/pkgs
COPY --from=builder /agent/__pypackages__/3.11/bin /pugtube/bin
COPY . /agent

WORKDIR /agent
# set entrypoint
ENTRYPOINT /agent/scripts/entrypoint.sh
