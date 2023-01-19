# build stage
FROM python:3.11-alpine AS builder

# install PDM
RUN pip install -U pip setuptools wheel
RUN pip install pdm

# copy files
COPY . /api

# install dependencies and project into the local packages directory
WORKDIR /api

RUN mkdir __pypackages__ && pdm install --prod --no-lock --no-editable

# run stage
FROM python:3.11-alpine AS runner

ENV PYTHONPATH=/pugtube/pkgs
ENV PATH=/pugtube/bin:$PATH
ENV MODE=api

RUN mkdir -p /pugtube

# retrieve packages from build stage
COPY --from=builder /api/__pypackages__/3.11/lib /pugtube/pkgs
COPY --from=builder /api/__pypackages__/3.11/bin /pugtube/bin
COPY . /api

WORKDIR /api
# set entrypoint
ENTRYPOINT /api/scripts/entrypoint.sh
