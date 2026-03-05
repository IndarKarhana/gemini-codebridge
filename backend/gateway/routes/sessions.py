from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class CreateSessionRequest(BaseModel):
    creator_id: str
    creator_role: str  # "hearing" or "deaf"


class SessionResponse(BaseModel):
    session_id: str
    invite_link: str
    status: str


@router.post("/sessions", response_model=SessionResponse)
async def create_session(request: CreateSessionRequest) -> SessionResponse:
    # TODO: Create session in Firestore, generate LiveKit room token
    return SessionResponse(
        session_id="placeholder",
        invite_link="https://codebridge.app/join/placeholder",
        status="created",
    )


@router.get("/sessions/{session_id}")
async def get_session(session_id: str) -> dict:
    # TODO: Fetch from Firestore
    return {"session_id": session_id, "status": "active"}


@router.post("/sessions/{session_id}/end")
async def end_session(session_id: str) -> dict:
    # TODO: Trigger summary generation, clean up resources
    return {"session_id": session_id, "status": "ended"}
