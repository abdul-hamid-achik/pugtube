FROM prefecthq/prefect:2.7.7-python3.11
ENTRYPOINT ["prefect", "orion", "start", "--host", "0.0.0.0", "--port", "4200"]