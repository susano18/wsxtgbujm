"""
Attendance Record Model
Tracks daily attendance with timestamps and confidence scores.
"""

from datetime import datetime, timezone, date

from app.models.database import db


class AttendanceRecord(db.Model):
    """Represents a single attendance entry."""

    __tablename__ = "attendance_records"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(
        db.Integer, db.ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True
    )
    date = db.Column(db.Date, nullable=False, default=lambda: date.today(), index=True)
    time_in = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    time_out = db.Column(db.DateTime, nullable=True)
    status = db.Column(
        db.String(20), nullable=False, default="present"
    )  # present, late, absent, excused
    confidence_score = db.Column(db.Float, nullable=True)
    camera_id = db.Column(db.String(50), nullable=True, default="cam_0")
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Composite unique constraint: one attendance per student per day
    __table_args__ = (
        db.UniqueConstraint("student_id", "date", name="uq_student_date"),
    )

    def to_dict(self):
        """Serialize record to dictionary."""
        return {
            "id": self.id,
            "student_id": self.student_id,
            "student_name": self.student.name if self.student else None,
            "student_code": self.student.student_id if self.student else None,
            "date": self.date.isoformat() if self.date else None,
            "time_in": self.time_in.isoformat() if self.time_in else None,
            "time_out": self.time_out.isoformat() if self.time_out else None,
            "status": self.status,
            "confidence_score": round(self.confidence_score, 4) if self.confidence_score else None,
            "camera_id": self.camera_id,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Attendance {self.student_id} on {self.date} - {self.status}>"
