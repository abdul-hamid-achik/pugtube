from prefect.deployments import Deployment
from prefect.filesystems import LocalFileSystem
from workflows.flows import seed


block_storage = LocalFileSystem(basepath="/tmp/prefect")
block_storage.save("local-storage", overwrite=True)

deployment = Deployment.build_from_flow(
    name="onboarding",
    flow=seed,
    storage=LocalFileSystem.load("local-storage"),
)
deployment.apply()
