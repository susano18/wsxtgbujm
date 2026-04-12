"""
JWT Authentication Utilities
Provides token creation, verification, and route protection decorators.
"""

from datetime import datetime, timedelta, timezone
from functools import wraps
import time

import jwt
from flask import request, jsonify, current_app

from app.models.user import User
from app.models.student import Student


def generate_token(user):
    """Generate a JWT access token for a user."""
    # Determine the role and username based on the object type
    if isinstance(user, User):
        username = user.username
        role = user.role
        is_student = False
    else:
        username = user.student_id
        role = "student"
        is_student = True

    payload = {
        "user_id": user.id,
        "username": username,
        "role": role,
        "is_student": is_student,
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
        if payload.get("is_student"):
            user = Student.query.get(payload["user_id"])
        else:
            user = User.query.get(payload["user_id"])

        if user is None or not user.is_active:
            return jsonify({"error": "User not found or deactivated."}), 401

        request.current_user = user
        return f(*args, **kwargs)

    return decorated


# Simple in-memory rate limiting
_rate_limit_cache = {}


def rate_limit(limit=5, period=60):
    """
    Simple rate limiting decorator.
    limit: Number of requests allowed
    period: Time window in seconds
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            key = f"{request.remote_addr}:{f.__name__}"
            now = time.time()

            if key not in _rate_limit_cache:
                _rate_limit_cache[key] = []

            # Filter out timestamps outside the period
            _rate_limit_cache[key] = [t for t in _rate_limit_cache[key] if now - t < period]

            if len(_rate_limit_cache[key]) >= limit:
                return jsonify({"error": "Too many requests. Please try again later."}), 429

            _rate_limit_cache[key].append(now)
            return f(*args, **kwargs)
        return decorated
    return decorator


def admin_required(f):
    """Decorator to restrict routes to admin users only."""

    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if request.current_user.role != "admin":
            return jsonify({"error": "Admin privileges required."}), 403
        return f(*args, **kwargs)

    return decorated
