import logging
from app_factory import TAgenticApp

app = TAgenticApp.get_app()
logger = logging.getLogger(__name__)


def _parse_cors_origins(config_value: str) -> list[str]:
    """Parse comma-separated origins from config"""
    origins = [origin.strip() for origin in config_value.split(",") if origin.strip()]
    return origins


def _is_origin_allowed(request_origin: str, allowed_origins: list[str]) -> bool:
    """Check if request origin is in allowed list (exact match)"""
    if not request_origin:
        return False
    return request_origin in allowed_origins


@app.middleware("request")
async def cors_preflight(request):
    """Handle CORS preflight (OPTIONS) requests"""
    if request.method == "OPTIONS":
        cors_origins = _parse_cors_origins(app.config.CORS_ORIGINS)
        request_origin = request.headers.get("Origin", "")
        
        logger.info(f"[CORS] Preflight request from origin: {request_origin}, allowed: {cors_origins}")
        
        if cors_origins and _is_origin_allowed(request_origin, cors_origins):
            # Create empty response with CORS headers
            from sanic.response import text
            response = text("", status=204)
            response.headers["Access-Control-Allow-Origin"] = request_origin
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD"
            response.headers["Access-Control-Allow-Headers"] = request.headers.get("Access-Control-Request-Headers", "Content-Type, Authorization")
            response.headers["Access-Control-Max-Age"] = "3600"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            logger.info(f"[CORS] Preflight allowed for {request_origin}")
            return response
        else:
            logger.warning(f"[CORS] Preflight rejected for {request_origin}")


@app.middleware("response")
async def cors_headers(request, response):
    """Add CORS headers to all responses"""
    cors_origins = _parse_cors_origins(app.config.CORS_ORIGINS)
    request_origin = request.headers.get("Origin", "")
    
    if cors_origins and _is_origin_allowed(request_origin, cors_origins):
        response.headers["Access-Control-Allow-Origin"] = request_origin
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Credentials"] = "true"
