import httpx
import functools
from django.conf import settings
import logging

logger = logging.getLogger(__name__)
client = httpx.Client(base_url="https://api.pexels.com/videos/")


def cache_result(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        if not hasattr(wrapper, "result"):
            wrapper.result = func(*args, **kwargs)
        return wrapper.result

    return wrapper


@cache_result
def get_popular_videos(per_page=40, min_duration=60, max_duration=120):
    try:
        response = client.get(
            "popular",
            params={
                "per_page": per_page,
                "min_duration": min_duration,
                "max_duration": max_duration,
            },
            headers={"Authorization": settings.PEXELS_API_KEY},
        )

        response.raise_for_status()
        return response.json()
    except httpx.HTTPError as exc:
        logger.warning(f"HTTP Exception for {exc.request.url} - {exc}")
    finally:
        client.close()
