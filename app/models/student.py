"""
Student Model
Stores student information and their face encoding data.
"""

import json
from datetime import datetime, timezone

import bcrypt
from app.models.database import db


class Student(db.Model):
    """Represents a registered student in the system."""

    __tablename__ = "students"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(200), unique=True, nullable=False)
    department = db.Column(db.String(100), nullable=True)
    year = db.Column(db.Integer, nullable=True)
    photo_path = db.Column(db.String(500), nullable=True)
    password_hash = db.Column(db.String(255), nullable=True)
    face_encodings = db.Column(db.Text, nullable=True)  # JSON-serialized list of encodings
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    attendance_records = db.relationship(
        "AttendanceRecord", backref="student", lazy="dynamic", cascade="all, delete-orphan",
        foreign_keys="AttendanceRecord.student_db_id"
    )

    def set_encodings(self, encodings_list):
        """Store face encodings as JSON. Each encoding is a numpy array converted to list."""
        serializable = [enc.tolist() if hasattr(enc, "tolist") else enc for enc in encodings_list]
        self.face_encodings = json.dumps(serializable)

    def get_encodings(self):
        """Retrieve face encodings as a list of lists."""
        if not self.face_encodings:
            return []
        return json.loads(self.face_encodings)

    def add_encoding(self, encoding):
        """Append a single encoding to the existing list."""
        current = self.get_encodings()
        new_enc = encoding.tolist() if hasattr(encoding, "tolist") else encoding
        current.append(new_enc)
        self.face_encodings = json.dumps(current)

    def set_password(self, password):
        """Hash and store the password."""
        self.password_hash = bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

    def check_password(self, password):
        """Verify a password against the stored hash."""
        if not self.password_hash:
            return False
        try:
            return bcrypt.checkpw(
                password.encode("utf-8"), self.password_hash.encode("utf-8")
            )
        except (ValueError, TypeError):
            # Handle invalid hash format or encoding issues
            return False

    def to_dict(self, include_encodings=False):
        """Serialize student to dictionary."""
        data = {
            "id": self.id,
            "student_id": self.student_id,
            "username": self.student_id,
            "name": self.name,
            "email": self.email,
            "role": "student",
            "department": self.department,
            "year": self.year,
            "photo_path": self.photo_path,
            "is_active": self.is_active,
            "encoding_count": len(self.get_encodings()),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_encodings:
            data["face_encodings"] = self.get_encodings()
        return data

    @property
    def role(self):
        return "student"

    def __repr__(self):
        return f"<Student {self.student_id}: {self.name}>"
