"""
Input Validation Utilities
Provides validation helpers for student registration and attendance data.
"""

import re


def validate_email(email):
    """Validate email format."""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None


def validate_student_data(data, require_all=True):
    """
    Validate student registration data.
    Returns (is_valid: bool, errors: list).
    """
    errors = []

    if require_all:
        required_fields = ["student_id", "name", "email"]
        for field in required_fields:
            if field not in data or not str(data[field]).strip():
                errors.append(f"'{field}' is required and cannot be empty.")

    if "student_id" in data:
        sid = str(data["student_id"]).strip()
        if len(sid) < 2 or len(sid) > 50:
            errors.append("'student_id' must be between 2 and 50 characters.")
        if not re.match(r"^[a-zA-Z0-9_-]+$", sid):
            errors.append("'student_id' can only contain letters, numbers, hyphens, and underscores.")

    if "name" in data:
        name = str(data["name"]).strip()
        if len(name) < 2 or len(name) > 150:
            errors.append("'name' must be between 2 and 150 characters.")

    if "email" in data:
        if not validate_email(str(data["email"]).strip()):
            errors.append("Invalid email format.")

    if "year" in data and data["year"] is not None:
        try:
            year = int(data["year"])
            if year < 1 or year > 10:
                errors.append("'year' must be between 1 and 10.")
        except (ValueError, TypeError):
            errors.append("'year' must be a valid integer.")

    return len(errors) == 0, errors


def sanitize_string(value):
    """Basic sanitization — strip whitespace and remove control characters."""
    if value is None:
        return None
    value = str(value).strip()
    # Remove control characters except newlines
    value = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", value)
    return value
