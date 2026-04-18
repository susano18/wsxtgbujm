"""
Authentication Routes
Login, token refresh, and user management endpoints.
"""

from datetime import datetime, timezone

from flask import Blueprint, request, jsonify

from app.models.database import db
from app.models.user import User
from app.models.student import Student
from app.utils.auth import generate_token, token_required, admin_required, rate_limit

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
@rate_limit(limit=5, period=60)
def login():
    """
    Authenticate user and return a JWT token.
    ---
    Body: { "username": "admin", "password": "admin123" }
    Returns: { "token": "...", "user": {...} }
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required."}), 400

    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400

    user = User.query.filter_by(username=username).first()
    if user is None or not user.check_password(password):
        return jsonify({"error": "Invalid username or password."}), 401

    if not user.is_active:
        return jsonify({"error": "Account is deactivated."}), 403

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    db.session.commit()

    token = generate_token(user)

    return jsonify({
        "message": "Login successful.",
        "token": token,
        "user": user.to_dict(),
    }), 200


@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user():
    """Get the currently authenticated user's profile."""
    return jsonify({"user": request.current_user.to_dict()}), 200


@auth_bp.route("/change-password", methods=["POST"])
@token_required
def change_password():
    """
    Change the current user's password.
    Body: { "current_password": "...", "new_password": "..." }
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required."}), 400

    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")

    if not current_password or not new_password:
        return jsonify({"error": "Both current and new passwords are required."}), 400

    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters."}), 400

    user = request.current_user
    if not user.check_password(current_password):
        return jsonify({"error": "Current password is incorrect."}), 401

    user.set_password(new_password)
    db.session.commit()

    return jsonify({"message": "Password changed successfully."}), 200


@auth_bp.route("/student/login", methods=["POST"])
@rate_limit(limit=5, period=60)
def student_login():
    """
    Authenticate student and return a JWT token.
    ---
    Body: { "student_id": "STU123", "password": "..." }
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required."}), 400

    student_id = data.get("student_id", "").strip()
    password = data.get("password", "")

    if not student_id or not password:
        return jsonify({"error": "Student ID and password are required."}), 400

    student = Student.query.filter_by(student_id=student_id).first()
    if student is None or not student.check_password(password):
        return jsonify({"error": "Invalid student ID or password."}), 401

    if not student.is_active:
        return jsonify({"error": "Student account is deactivated."}), 403

    token = generate_token(student)

    return jsonify({
        "message": "Login successful.",
        "token": token,
        "user": student.to_dict(),
    }), 200


@auth_bp.route("/register", methods=["POST"])
@admin_required
def register_user():
    """
    Register a new user (admin only).
    Body: { "username": "...", "email": "...", "password": "...", "role": "admin" }
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required."}), 400

    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")
    role = data.get("role", "viewer")

    if not all([username, email, password]):
        return jsonify({"error": "Username, email, and password are required."}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists."}), 409

    user = User(username=username, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "User created successfully.",
        "user": user.to_dict(),
    }), 201
