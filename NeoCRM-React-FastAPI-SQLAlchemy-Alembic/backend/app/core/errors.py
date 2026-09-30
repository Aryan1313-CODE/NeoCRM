import logging

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


def error_code(status: int) -> str:
    return {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
    }.get(status, "REQUEST_ERROR" if status < 500 else "SERVER_ERROR")


async def http_error_handler(request: Request, exc: StarletteHTTPException):
    detail = exc.detail
    if isinstance(detail, dict):
        code = detail.get("code", error_code(exc.status_code))
        message = detail.get("message", "Request failed")
    else:
        code = error_code(exc.status_code)
        message = detail if isinstance(detail, str) else "Request failed"
    return JSONResponse(status_code=exc.status_code, content={"error": {"code": code, "message": message}})


async def validation_error_handler(request: Request, exc: RequestValidationError):
    fields = [
        {"field": ".".join(str(part) for part in error["loc"] if part != "body"), "message": error["msg"]}
        for error in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "VALIDATION_ERROR", "message": "Request validation failed", "fields": fields}},
    )


async def unexpected_error_handler(request: Request, exc: Exception):
    logger.exception("Unhandled API error for %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "SERVER_ERROR", "message": "The server encountered an error"}},
    )
import logging
