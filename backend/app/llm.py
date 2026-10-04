from functools import lru_cache

from openai import OpenAI

from .config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL


@lru_cache(maxsize=1)
def get_client():
    if not DEEPSEEK_API_KEY:
        raise RuntimeError("Set DEEPSEEK_API_KEY in backend/.env to enable chat.")
    return OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL, timeout=20.0, max_retries=0)
