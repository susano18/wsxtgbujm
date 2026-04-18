"""
Analytics Routes
Attendance statistics, summaries, and insights endpoints.
"""

from datetime import date, timedelta

from flask import Blueprint, request, jsonify
from sqlalchemy import func

from app.utils.auth import token_required
from app.models.database import db
from app.models.student import Student
from app.models.attendance import AttendanceRecord

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/dashboard", methods=["GET"])
@token_required
def dashboard():
    """
    Get a high-level dashboard summary.
    Returns total students, today's attendance, weekly trends, etc.
    """
    today = date.today()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    total_students = Student.query.filter_by(is_active=True).count()
    total_with_encodings = Student.query.filter(
        Student.is_active == True,
        Student.face_encodings.isnot(None),
    ).count()

    # Today's attendance
    today_present = AttendanceRecord.query.filter_by(date=today, status="present").count()
    today_late = AttendanceRecord.query.filter_by(date=today, status="late").count()
    today_total = today_present + today_late

    # This week
    week_records = AttendanceRecord.query.filter(
        AttendanceRecord.date >= week_ago
    ).count()

    # This month
    month_records = AttendanceRecord.query.filter(
        AttendanceRecord.date >= month_ago
    ).count()

    # Attendance rate (today)
    attendance_rate = round((today_total / total_students * 100), 1) if total_students > 0 else 0.0

    return jsonify({
        "date": today.isoformat(),
        "total_students": total_students,
        "students_with_face_data": total_with_encodings,
        "today": {
            "present": today_present,
            "late": today_late,
            "total_marked": today_total,
            "attendance_rate": attendance_rate,
        },
        "week": {
            "total_records": week_records,
        },
        "month": {
            "total_records": month_records,
        },
    }), 200


@analytics_bp.route("/daily", methods=["GET"])
@token_required
def daily_stats():
    """
    Get daily attendance breakdown.
    Query params: date_from, date_to (defaults to last 30 days)
    """
    date_to = request.args.get("date_to", date.today().isoformat())
    date_from = request.args.get("date_from", (date.today() - timedelta(days=30)).isoformat())

    try:
        d_from = date.fromisoformat(date_from)
        d_to = date.fromisoformat(date_to)
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    # Group by date and status
    results = (
        db.session.query(
            AttendanceRecord.date,
            AttendanceRecord.status,
            func.count(AttendanceRecord.id).label("count"),
        )
        .filter(AttendanceRecord.date >= d_from, AttendanceRecord.date <= d_to)
        .group_by(AttendanceRecord.date, AttendanceRecord.status)
        .order_by(AttendanceRecord.date.asc())
        .all()
    )

    # Build structured response
    daily_data = {}
    for record_date, status, count in results:
        day_str = record_date.isoformat()
        if day_str not in daily_data:
            daily_data[day_str] = {"date": day_str, "present": 0, "late": 0, "absent": 0, "excused": 0, "total": 0}
        daily_data[day_str][status] = count
        daily_data[day_str]["total"] += count

    return jsonify({
        "date_from": d_from.isoformat(),
        "date_to": d_to.isoformat(),
        "daily_stats": list(daily_data.values()),
    }), 200


@analytics_bp.route("/student/<int:student_db_id>/stats", methods=["GET"])
@token_required
def student_stats(student_db_id):
    """
    Get attendance statistics for a specific student.
    Returns total days present, absent, attendance percentage, streaks, etc.
    """
    student = Student.query.get(student_db_id)
    if not student:
        return jsonify({"error": "Student not found."}), 404

    # Overall counts
    total_present = AttendanceRecord.query.filter_by(
        student_db_id=student_db_id, status="present"
    ).count()
    total_late = AttendanceRecord.query.filter_by(
        student_db_id=student_db_id, status="late"
    ).count()
    total_excused = AttendanceRecord.query.filter_by(
        student_db_id=student_db_id, status="excused"
    ).count()
    total_records = AttendanceRecord.query.filter_by(student_db_id=student_db_id).count()

    # Attendance percentage
    attendance_pct = round(
        ((total_present + total_late) / total_records * 100), 1
    ) if total_records > 0 else 0.0

    # Average confidence
    avg_conf = (
        db.session.query(func.avg(AttendanceRecord.confidence_score))
        .filter_by(student_db_id=student_db_id)
        .scalar()
    )

    # Recent attendance (last 7 days)
    week_ago = date.today() - timedelta(days=7)
    recent = (
        AttendanceRecord.query
        .filter(
            AttendanceRecord.student_db_id == student_db_id,
            AttendanceRecord.date >= week_ago,
        )
        .order_by(AttendanceRecord.date.desc())
        .all()
    )

    # First and last attendance dates
    first_record = (
        AttendanceRecord.query
        .filter_by(student_db_id=student_db_id)
        .order_by(AttendanceRecord.date.asc())
        .first()
    )
    last_record = (
        AttendanceRecord.query
        .filter_by(student_db_id=student_db_id)
        .order_by(AttendanceRecord.date.desc())
        .first()
    )

    return jsonify({
        "student": student.to_dict(),
        "statistics": {
            "total_records": total_records,
            "present": total_present,
            "late": total_late,
            "excused": total_excused,
            "attendance_percentage": attendance_pct,
            "average_confidence": round(avg_conf, 4) if avg_conf else None,
            "first_attendance": first_record.date.isoformat() if first_record else None,
            "last_attendance": last_record.date.isoformat() if last_record else None,
        },
        "recent_7_days": [r.to_dict() for r in recent],
    }), 200


@analytics_bp.route("/top-attendees", methods=["GET"])
@token_required
def top_attendees():
    """
    Get students ranked by attendance count.
    Query params: limit (default 10), date_from, date_to
    """
    limit = request.args.get("limit", 10, type=int)
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")

    query = (
        db.session.query(
            Student.id,
            Student.student_id,
            Student.name,
            Student.department,
            func.count(AttendanceRecord.id).label("attendance_count"),
        )
        .join(AttendanceRecord, AttendanceRecord.student_db_id == Student.id)
        .filter(AttendanceRecord.status.in_(["present", "late"]))
    )

    if date_from:
        query = query.filter(AttendanceRecord.date >= date.fromisoformat(date_from))
    if date_to:
        query = query.filter(AttendanceRecord.date <= date.fromisoformat(date_to))

    results = (
        query.group_by(Student.id, Student.student_id, Student.name, Student.department)
        .order_by(func.count(AttendanceRecord.id).desc())
        .limit(limit)
        .all()
    )

    return jsonify({
        "top_attendees": [
            {
                "id": r.id,
                "student_id": r.student_id,
                "name": r.name,
                "department": r.department,
                "attendance_count": r.attendance_count,
            }
            for r in results
        ],
    }), 200


@analytics_bp.route("/cameras", methods=["GET"])
@token_required
def camera_status():
    """Get status of all connected cameras."""
    from app.services.camera_service import camera_manager

    available = camera_manager.detect_available_cameras()
    active = camera_manager.list_cameras()

    return jsonify({
        "available_indices": available,
        "active_cameras": active,
    }), 200
