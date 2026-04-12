"""
Student Controller
Business logic for student registration, update, deletion, and face enrollment.
"""

import os
import logging
import uuid
from datetime import datetime

import cv2
import numpy as np
import face_recognition as fr
from flask import current_app
from werkzeug.utils import secure_filename

from app.models.database import db
from app.models.student import Student
from app.services.face_service import FaceService
from app.utils.validators import validate_student_data, sanitize_string

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}


def _allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def register_student(data, photo_file=None):
    """
    Register a new student with optional photo for face encoding.
    Returns (success, result_dict_or_error, status_code).
    """
    # Validate input
    is_valid, errors = validate_student_data(data)
    if not is_valid:
        return False, {"errors": errors}, 400

    student_id = sanitize_string(data["student_id"])
    name = sanitize_string(data["name"])
    email = sanitize_string(data["email"])
    department = sanitize_string(data.get("department"))
    year = data.get("year")

    # Check for duplicates
    if Student.query.filter_by(student_id=student_id).first():
        return False, {"error": f"Student ID '{student_id}' already exists."}, 409
    if Student.query.filter_by(email=email).first():
        return False, {"error": f"Email '{email}' is already registered."}, 409

    # Process photo
    photo_path = None
    face_encoding = None
    if photo_file and photo_file.filename:
        if not _allowed_file(photo_file.filename):
            return False, {"error": "Invalid file type. Allowed: png, jpg, jpeg, webp."}, 400

        # Save photo
        filename = f"{student_id}_{uuid.uuid4().hex[:8]}{os.path.splitext(photo_file.filename)[1]}"
        filename = secure_filename(filename)
        photos_dir = current_app.config["PHOTOS_DIR"]
        photo_path = os.path.join(photos_dir, filename)
        photo_file.save(photo_path)
        logger.info("Photo saved: %s", photo_path)

        # Extract face encoding
        encodings = FaceService.encode_from_file(photo_path)
        if not encodings:
            os.remove(photo_path)
            return False, {"error": "No face detected in the uploaded photo."}, 400
        face_encoding = encodings[0]

    # Create student record
    student = Student(
        student_id=student_id,
        name=name,
        email=email,
        department=department,
        year=int(year) if year else None,
        photo_path=photo_path,
    )
    if face_encoding is not None:
        student.set_encodings([face_encoding])

    db.session.add(student)
    db.session.commit()
    logger.info("Student registered: %s (%s)", name, student_id)

    return True, student.to_dict(), 201


def update_student(db_id, data):
    """Update student information (not face encodings)."""
    student = Student.query.get(db_id)
    if not student:
        return False, {"error": "Student not found."}, 404

    is_valid, errors = validate_student_data(data, require_all=False)
    if not is_valid:
        return False, {"errors": errors}, 400

    if "name" in data:
        student.name = sanitize_string(data["name"])
    if "email" in data:
        new_email = sanitize_string(data["email"])
        existing = Student.query.filter(Student.email == new_email, Student.id != db_id).first()
        if existing:
            return False, {"error": "Email already in use by another student."}, 409
        student.email = new_email
    if "department" in data:
        student.department = sanitize_string(data["department"])
    if "year" in data:
        student.year = int(data["year"]) if data["year"] else None
    if "is_active" in data:
        student.is_active = bool(data["is_active"])

    db.session.commit()
    logger.info("Student updated: %s", student.student_id)
    return True, student.to_dict(), 200


def delete_student(db_id):
    """Delete a student and their photo."""
    student = Student.query.get(db_id)
    if not student:
        return False, {"error": "Student not found."}, 404

    # Remove photo file
    if student.photo_path and os.path.exists(student.photo_path):
        os.remove(student.photo_path)
        logger.info("Photo deleted: %s", student.photo_path)

    name = student.name
    db.session.delete(student)
    db.session.commit()
    logger.info("Student deleted: %s", name)
    return True, {"message": f"Student '{name}' deleted successfully."}, 200


def add_face_encoding(db_id, photo_file):
    """Add an additional face encoding from a new photo."""
    student = Student.query.get(db_id)
    if not student:
        return False, {"error": "Student not found."}, 404

    if not photo_file or not photo_file.filename:
        return False, {"error": "Photo file is required."}, 400

    if not _allowed_file(photo_file.filename):
        return False, {"error": "Invalid file type."}, 400

    # Read image into memory
    file_bytes = np.frombuffer(photo_file.read(), np.uint8)
    image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    if image is None:
        return False, {"error": "Could not read image file."}, 400

    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Validate single face
    is_valid, message, encoding = FaceService.validate_face_image(rgb_image)
    if not is_valid:
        return False, {"error": message}, 400

    student.add_encoding(encoding)
    db.session.commit()

    count = len(student.get_encodings())
    logger.info("Added face encoding #%d for student %s", count, student.student_id)
    return True, {
        "message": f"Face encoding added. Total encodings: {count}.",
        "encoding_count": count,
    }, 200


def get_student(db_id):
    """Get a single student by database ID."""
    student = Student.query.get(db_id)
    if not student:
        return False, {"error": "Student not found."}, 404
    return True, student.to_dict(), 200


def list_students(page=1, per_page=20, search=None, active_only=True):
    """List students with pagination and optional search."""
    query = Student.query

    if active_only:
        query = query.filter_by(is_active=True)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            db.or_(
                Student.name.ilike(search_term),
                Student.student_id.ilike(search_term),
                Student.email.ilike(search_term),
            )
        )

    query = query.order_by(Student.name.asc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return True, {
        "students": [s.to_dict() for s in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
        "per_page": per_page,
    }, 200


def bulk_register_students(csv_file):
    """Register multiple students from a CSV file."""
    try:
        import pandas as pd
        df = pd.read_csv(csv_file)

        required_cols = ["student_id", "name", "email"]
        for col in required_cols:
            if col not in df.columns:
                return False, {"error": f"CSV must contain {col} column."}, 400

        success_count = 0
        errors = []

        for idx, row in df.iterrows():
            data = {
                "student_id": str(row["student_id"]),
                "name": str(row["name"]),
                "email": str(row["email"]),
                "department": str(row.get("department", "")),
                "year": row.get("year")
            }

            # Simple check for existing to avoid complete failure
            if Student.query.filter_by(student_id=data["student_id"]).first():
                errors.append(f"Row {idx+2}: Student ID {data['student_id']} already exists.")
                continue

            success, result, status = register_student(data)
            if success:
                success_count += 1
            else:
                errors.append(f"Row {idx+2}: {result.get('error') or result.get('errors')}")

        return True, {
            "message": f"Successfully registered {success_count} students.",
            "success_count": success_count,
            "errors": errors
        }, 201
    except Exception as e:
        logger.error("Bulk registration failed: %s", str(e))
        return False, {"error": f"Bulk registration failed: {str(e)}"}, 500
