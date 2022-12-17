FROM python:3.11.1 AS builder

RUN pip install -U pip setuptools wheel
RUN pip install pdm

COPY . /api
WORKDIR /api
RUN mkdir __pypackages__ && pdm install --prod --no-lock --no-editable

FROM python:3.11.1
ENV PYTHONPATH=/api/pkgs
ENV DEBUG=False
EXPOSE 8080
COPY --from=builder /api/__pypackages__/3.11/lib /api/pkgs
COPY --from=builder /api /api
WORKDIR /api
CMD ["python", "-m", "gunicorn", "--bind", ":8080", "pubtube.wsgi:application"]