from prefect import flow

from .tasks import load_pexels_popular_videos


@flow
def seed():
    load_pexels_popular_videos()
