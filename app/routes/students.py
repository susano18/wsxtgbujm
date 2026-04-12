"""
Student Routes
CRUD endpoints for student management and face enrollment.
"""

from flask import Blueprint, request, jsonify

from app.utils.auth import token_required, admin_required
from app.controllers import student_controller as ctrl

students_bp = Blueprint("students", __name__)


@students_bp.route("", methods=["GET"])
@token_required
def list_students():
    """
    List all students with pagination and search.
    Query params: page, per_page, search, active_only
    """
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    search = request.args.get("search", None)
    active_only = request.args.get("active_only", "true").lower() == "true"

    success, data, status = ctrl.list_students(page, per_page, search, active_only)
    return jsonify(data), status


@students_bp.route("/<int:student_db_id>", methods=["GET"])
@token_required
def get_student(student_db_id):
    """Get a single student by database ID."""
    success, data, status = ctrl.get_student(student_db_id)
    return jsonify(data), status


@students_bp.route("", methods=["POST"])
@admin_required
def register_student():
    """
    Register a new student.
    Form data: student_id, name, email, department (opt), year (opt)
    File: photo (optional image file)
    """
    data = {
        "student_id": request.form.get("student_id"),
        "name": request.form.get("name"),
        "email": request.form.get("email"),
        "department": request.form.get("department"),
        "year": request.form.get("year"),
    }

    # Also accept JSON body (without file upload)
    if not data["student_id"] and request.is_json:
        json_data = request.get_json()
        data.update(json_data)

    photo_file = request.files.get("photo")

    success, result, status = ctrl.register_student(data, photo_file)
    return jsonify(result), status


@students_bp.route("/<int:student_db_id>", methods=["PUT", "PATCH"])
@admin_required
def update_student(student_db_id):
    """Update student information."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required."}), 400

    success, result, status = ctrl.update_student(student_db_id, data)
    return jsonify(result), status


@students_bp.route("/<int:student_db_id>", methods=["DELETE"])
@admin_required
def delete_student(student_db_id):
    """Delete a student and their associated data."""
    success, result, status = ctrl.delete_student(student_db_id)
    return jsonify(result), status


@students_bp.route("/<int:student_db_id>/encodings", methods=["POST"])
@admin_required
def add_face_encoding(student_db_id):
    """
    Add an additional face encoding for a student.
    File: photo (required image file)
    """
    photo_file = request.files.get("photo")
    if not photo_file:
        return jsonify({"error": "Photo file is required."}), 400

    success, result, status = ctrl.add_face_encoding(student_db_id, photo_file)
    return jsonify(result), status


@students_bp.route("/bulk", methods=["POST"])
@admin_required
def bulk_register_students():
    """
    Register multiple students from a CSV file.
    File: file (required CSV file)
    """
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded."}), 400

    csv_file = request.files["file"]
    if not csv_file.filename.endswith(".csv"):
        return jsonify({"error": "Only CSV files are allowed."}), 400

    success, result, status = ctrl.bulk_register_students(csv_file)
    return jsonify(result), status
