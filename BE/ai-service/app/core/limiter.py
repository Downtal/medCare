from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request

def get_user_id_or_ip(request: Request):
    user_id = request.headers.get("X-User-Id")
    if user_id:
        return f"user:{user_id}"
    return get_remote_address(request)

limiter = Limiter(key_func=get_user_id_or_ip)
