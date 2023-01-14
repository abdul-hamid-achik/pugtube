FROM prefecthq/prefect:2.7.7-python3.11
RUN pip install psycopg2-binary
ENTRYPOINT ["prefect", "orion", "start", "--host", "0.0.0.0"]