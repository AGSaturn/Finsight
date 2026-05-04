import os
import uuid
from datetime import datetime, timedelta

from authlib.integrations.starlette_client import OAuth
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from jose import JWTError, jwt

from database import get_db

load_dotenv()

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
FRONTEND_URL = "http://localhost:3000"

oauth = OAuth()
oauth.register(
    name="google",
    client_id=os.environ["GOOGLE_CLIENT_ID"],
    client_secret=os.environ["GOOGLE_CLIENT_SECRET"],
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

router = APIRouter(prefix="/api")


def create_jwt(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_jwt(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_user_from_token(request: Request) -> dict:
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    return decode_jwt(auth.split("Bearer ")[1])


@router.get("/auth/google")
async def auth_google(request: Request):
    redirect_uri = "http://localhost:8000/api/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/auth/google/callback")
async def auth_google_callback(request: Request):
    if request.query_params.get("error"):
        return RedirectResponse(url=f"{FRONTEND_URL}/?error=access_denied")

    token = await oauth.google.authorize_access_token(request)
    userinfo = token.get("userinfo")
    if not userinfo:
        raise HTTPException(status_code=400, detail="Failed to get user info")

    async for db in get_db():
        cursor = await db.execute(
            "SELECT * FROM users WHERE google_id = ?", (userinfo["sub"],)
        )
        row = await cursor.fetchone()

        if row is None:
            user_id = str(uuid.uuid4())
            email = userinfo["email"]
            await db.execute(
                "INSERT INTO users (id, email, google_id, name, avatar_url) "
                "VALUES (?, ?, ?, ?, ?)",
                (
                    user_id,
                    email,
                    userinfo["sub"],
                    userinfo.get("name"),
                    userinfo.get("picture"),
                ),
            )
            await db.commit()
        else:
            user_id = row["id"]
            email = row["email"]

    jwt_token = create_jwt(user_id, email)
    return RedirectResponse(url=f"{FRONTEND_URL}/workbench?token={jwt_token}")


@router.get("/me")
async def me(request: Request):
    payload = await get_user_from_token(request)
    async for db in get_db():
        cursor = await db.execute(
            "SELECT id, email, name, avatar_url FROM users WHERE id = ?",
            (payload["sub"],),
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="User not found")
        return {
            "id": row["id"],
            "email": row["email"],
            "name": row["name"],
            "avatar_url": row["avatar_url"],
        }
