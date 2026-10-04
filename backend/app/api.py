import logging

from fastapi import APIRouter, HTTPException, Request
from .services.chat_limits import usage
from openai import APIError, APIStatusError, APIConnectionError, APITimeoutError

from .schema import (
    ChatRequest,
    ChatResponse
)

from .services.chat import chat
from .config import MODEL


logger = logging.getLogger(__name__)
router = APIRouter()


def visitor_key(request: Request):
    host = request.client.host if request.client else "unknown"
    # Only the local Next.js proxy may supply an anonymous browser identity.
    visitor = request.headers.get("x-chat-visitor", "")
    if host in {"127.0.0.1", "::1"} and len(visitor) == 36:
        return visitor
    return host


@router.get("/chat/usage")
def chat_usage(request: Request):
    return usage(visitor_key(request))


@router.get("/")
def root():

    return {
        "message": "FlightAI backend is running"
    }


@router.get("/health")
def health():

    return {
        "status": "healthy"
    }


@router.post(
    "/chat",
    response_model=ChatResponse
)
def chat_endpoint(
    request: ChatRequest,
    http_request: Request,
):
    quota = usage(visitor_key(http_request), reserve=True)
    if not quota["allowed"]:
        raise HTTPException(status_code=429, detail="Today's chat limit has been reached. Please come back after midnight UTC.")
    try:
        response = chat(request.message, request.history)
    except APITimeoutError:
        raise HTTPException(status_code=504, detail="The assistant took too long. Please try again.") from None
    except APIStatusError as exc:
        logger.warning("DeepSeek rejected chat: status=%s model=%s", exc.status_code, MODEL)
        details = {
            400: "DeepSeek rejected the request. Check DEEPSEEK_MODEL and the chat configuration.",
            401: "DeepSeek rejected the API key. Check DEEPSEEK_API_KEY in backend/.env.",
            402: "Your DeepSeek account has insufficient balance. Add credits to continue.",
            403: "Your DeepSeek API key does not have access to this model.",
            404: "DeepSeek could not find the configured model. Check DEEPSEEK_MODEL in backend/.env.",
            429: "DeepSeek is rate limiting requests. Please wait and try again.",
        }
        raise HTTPException(status_code=502, detail=details.get(exc.status_code, "DeepSeek is temporarily unavailable. Please try again.")) from None
    except APIConnectionError:
        logger.warning("Could not connect to DeepSeek")
        raise HTTPException(status_code=502, detail="The backend could not connect to DeepSeek. Check the backend internet connection and DEEPSEEK_BASE_URL.") from None
    except APIError:
        raise HTTPException(status_code=502, detail="The AI provider is unavailable. Please try again.") from None
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from None
    except ValueError:
        raise HTTPException(status_code=502, detail="The assistant could not complete the answer. Please try again.") from None

    return {
        "response": response
    }
