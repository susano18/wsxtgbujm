"""
JWT Authentication Utilities
Provides token creation, verification, and route protection decorators.
"""

from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import request, jsonify, current_app

from app.models.user import User


def generate_token(user):
    """Generate a JWT access token for a user."""
    payload = {
        "user_id": user.id,
        "username": user.username,
        "role": user.role,
        "exp": datetime.now(timezone.utc)
        + timedelta(seconds=current_app.config["JWT_ACCESS_TOKEN_EXPIRES"]),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256")


def decode_token(token):
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(
            token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"]
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def token_required(f):
    """Decorator to protect routes — requires a valid JWT in the Authorization header."""

    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Extract token from header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

        if not token:
            return jsonify({"error": "Authentication token is missing."}), 401

        payload = decode_token(token)
        if payload is None:
            return jsonify({"error": "Token is invalid or expired."}), 401

        # Attach user info to request context
        user = User.query.get(payload["user_id"])
        if user is None or not user.is_active:
            return jsonify({"error": "User not found or deactivated."}), 401

        request.current_user = user
        return f(*args, **kwargs)

    return decorated


def admin_required(f):
    """Decorator to restrict routes to admin users only."""

    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if request.current_user.role != "admin":
            return jsonify({"error": "Admin privileges required."}), 403
        return f(*args, **kwargs)

    return decorated
