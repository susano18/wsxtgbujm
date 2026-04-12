"""
Attendance Controller
Business logic for marking, querying, and managing attendance records.
"""

import logging
from datetime import datetime, date, timezone

import cv2
import numpy as np
from flask import current_app

from app.models.database import db
from app.models.student import Student
from app.models.attendance import AttendanceRecord
from app.services.face_service import FaceService
from app.services.camera_service import camera_manager
from app.utils.email_service import send_attendance_notification

logger = logging.getLogger(__name__)


def mark_attendance_from_image(image_data, camera_id="cam_0"):
    """
    Process an uploaded image, recognize faces, and mark attendance.
    Args:
        image_data: numpy array (RGB) or raw file bytes
        camera_id: identifier for the camera source
    Returns:
        (success, result, status_code)
    """
    # Decode image if raw bytes
    if isinstance(image_data, bytes):
        nparr = np.frombuffer(image_data, np.uint8)
        bgr_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if bgr_image is None:
            return False, {"error": "Could not decode image."}, 400
        rgb_image = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
    elif isinstance(image_data, np.ndarray):
        rgb_image = image_data
    else:
        return False, {"error": "Invalid image data."}, 400

    # Detect and encode faces in the image
    face_locations = FaceService.detect_faces(rgb_image)
    if not face_locations:
        return False, {"error": "No faces detected in the image."}, 400

    face_encodings = FaceService.encode_faces(rgb_image, face_locations)

    # Load known faces from cache
    known_encodings, encoding_to_student = FaceService.get_known_faces()

    if not known_encodings:
        return False, {"error": "No registered students with face data found."}, 404

    # Match each detected face
    results = []
    today = date.today()
    now = datetime.now(timezone.utc)

    for i, face_encoding in enumerate(face_encodings):
        match_result = FaceService.compare_faces(known_encodings, face_encoding)

        if match_result["match"]:
            matched_student = encoding_to_student[match_result["index"]]

            # Check duplicate attendance for today
            existing = AttendanceRecord.query.filter_by(
                student_db_id=matched_student.id, date=today
            ).first()

            if existing:
                results.append({
                    "face_index": i,
                    "student": matched_student.to_dict(),
                    "confidence": match_result["confidence"],
                    "status": "already_marked",
                    "message": f"Attendance already recorded for {matched_student.name} today.",
                })
                continue

            # Determine status based on time (configurable)
            status = "present"

            # Create attendance record
            record = AttendanceRecord(
                student_db_id=matched_student.id,
                date=today,
                time_in=now,
                status=status,
                confidence_score=match_result["confidence"],
                camera_id=camera_id,
            )
            db.session.add(record)
            db.session.commit()

            logger.info(
                "Attendance marked: %s (confidence: %.4f)",
                matched_student.name,
                match_result["confidence"],
            )

            # Send email notification (best-effort)
            try:
                send_attendance_notification(
                    matched_student.name,
                    matched_student.email,
                    today.isoformat(),
                    now.strftime("%H:%M:%S"),
                )
            except Exception:
                pass  # Email is optional

            results.append({
                "face_index": i,
                "student": matched_student.to_dict(),
                "confidence": match_result["confidence"],
                "status": "marked",
                "attendance_id": record.id,
                "message": f"Attendance marked for {matched_student.name}.",
            })
        else:
            results.append({
                "face_index": i,
                "student": None,
                "confidence": 0.0,
                "status": "unknown",
                "message": "Face not recognized.",
            })

    return True, {
        "faces_detected": len(face_encodings),
        "results": results,
    }, 200


def mark_attendance_from_camera(camera_id="cam_0"):
    """Capture a frame from the camera and process attendance."""
    success, rgb_frame = camera_manager.capture_rgb_frame(camera_id)
    if not success:
        return False, {"error": f"Failed to capture frame from camera '{camera_id}'."}, 500
    return mark_attendance_from_image(rgb_frame, camera_id=camera_id)


def get_attendance_records(
    date_from=None, date_to=None, student_id=None, status=None,
    page=1, per_page=50
):
    """Query attendance records with filters and pagination."""
    query = AttendanceRecord.query.join(Student)

    if date_from:
        query = query.filter(AttendanceRecord.date >= date_from)
    if date_to:
        query = query.filter(AttendanceRecord.date <= date_to)
    if student_id:
        query = query.filter(Student.student_id == student_id)
    if status:
        query = query.filter(AttendanceRecord.status == status)

    query = query.order_by(AttendanceRecord.date.desc(), AttendanceRecord.time_in.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return True, {
        "records": [r.to_dict() for r in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
        "per_page": per_page,
    }, 200


def get_student_attendance(db_id, date_from=None, date_to=None):
    """Get all attendance records for a specific student."""
    student = Student.query.get(db_id)
    if not student:
        return False, {"error": "Student not found."}, 404

    query = AttendanceRecord.query.filter_by(student_db_id=db_id)
    if date_from:
        query = query.filter(AttendanceRecord.date >= date_from)
    if date_to:
        query = query.filter(AttendanceRecord.date <= date_to)

    records = query.order_by(AttendanceRecord.date.desc()).all()

    return True, {
        "student": student.to_dict(),
        "records": [r.to_dict() for r in records],
        "total_records": len(records),
    }, 200


def update_attendance(record_id, data):
    """Update an attendance record (e.g., mark time_out, change status)."""
    record = AttendanceRecord.query.get(record_id)
    if not record:
        return False, {"error": "Attendance record not found."}, 404

    if "status" in data:
        record.status = data["status"]
    if "time_out" in data:
        record.time_out = datetime.fromisoformat(data["time_out"])
    if "notes" in data:
        record.notes = data["notes"]

    db.session.commit()
    logger.info("Attendance record %d updated.", record_id)
    return True, record.to_dict(), 200


def delete_attendance(record_id):
    """Delete an attendance record."""
    record = AttendanceRecord.query.get(record_id)
    if not record:
        return False, {"error": "Attendance record not found."}, 404

    db.session.delete(record)
    db.session.commit()
    logger.info("Attendance record %d deleted.", record_id)
    return True, {"message": "Attendance record deleted."}, 200
