"""
Attendance Routes
Endpoints for marking, querying, exporting, and managing attendance.
"""

from datetime import date, datetime

from flask import Blueprint, request, jsonify, send_file, Response
import io

from app.utils.auth import token_required, admin_required, rate_limit
from app.controllers import attendance_controller as att_ctrl
from app.controllers import export_controller as exp_ctrl

attendance_bp = Blueprint("attendance", __name__)


@attendance_bp.route("/mark", methods=["POST"])
@token_required
@rate_limit(limit=10, period=60)
def mark_attendance():
    """
    Mark attendance via image upload.
    File: image (required — photo with face(s) to recognize)
    Form data: camera_id (optional, defaults to 'cam_0')
    """
    image_file = request.files.get("image")
    if not image_file:
        return jsonify({"error": "Image file is required."}), 400

    camera_id = request.form.get("camera_id", "cam_0")
    image_bytes = image_file.read()

    success, result, status = att_ctrl.mark_attendance_from_image(image_bytes, camera_id)
    return jsonify(result), status


@attendance_bp.route("/mark/camera", methods=["POST"])
@token_required
def mark_attendance_camera():
    """
    Mark attendance by capturing from a connected camera.
    Body: { "camera_id": "cam_0" }
    """
    data = request.get_json() or {}
    camera_id = data.get("camera_id", "cam_0")

    success, result, status = att_ctrl.mark_attendance_from_camera(camera_id)
    return jsonify(result), status


@attendance_bp.route("", methods=["GET"])
@token_required
def get_attendance():
    """
    Get attendance records with filters.
    Query params: date_from, date_to, student_id, status, page, per_page
    """
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    student_id = request.args.get("student_id")
    status = request.args.get("status")
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 50, type=int)

    # Parse dates
    if date_from:
        try:
            date_from = date.fromisoformat(date_from)
        except ValueError:
            return jsonify({"error": "Invalid date_from format. Use YYYY-MM-DD."}), 400
    if date_to:
        try:
            date_to = date.fromisoformat(date_to)
        except ValueError:
            return jsonify({"error": "Invalid date_to format. Use YYYY-MM-DD."}), 400

    success, data, status_code = att_ctrl.get_attendance_records(
        date_from, date_to, student_id, status, page, per_page
    )
    return jsonify(data), status_code


@attendance_bp.route("/student/<int:student_db_id>", methods=["GET"])
@token_required
def get_student_attendance(student_db_id):
    """Get attendance records for a specific student."""
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")

    if date_from:
        date_from = date.fromisoformat(date_from)
    if date_to:
        date_to = date.fromisoformat(date_to)

    success, data, status_code = att_ctrl.get_student_attendance(
        student_db_id, date_from, date_to
    )
    return jsonify(data), status_code


@attendance_bp.route("/<int:record_id>", methods=["PUT", "PATCH"])
@admin_required
def update_attendance(record_id):
    """Update an attendance record."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required."}), 400

    success, result, status = att_ctrl.update_attendance(record_id, data)
    return jsonify(result), status


@attendance_bp.route("/<int:record_id>", methods=["DELETE"])
@admin_required
def delete_attendance(record_id):
    """Delete an attendance record."""
    success, result, status = att_ctrl.delete_attendance(record_id)
    return jsonify(result), status


# ── Export Endpoints ────────────────────────────────────────────


@attendance_bp.route("/export/csv", methods=["GET"])
@token_required
def export_csv():
    """Export attendance records as CSV download."""
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    student_id = request.args.get("student_id")

    success, result, status = exp_ctrl.export_csv(date_from, date_to, student_id)
    if not success:
        return jsonify(result), status

    return Response(
        result["content"],
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={result['filename']}"},
    )


@attendance_bp.route("/export/excel", methods=["GET"])
@token_required
def export_excel():
    """Export attendance records as Excel (.xlsx) download."""
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    student_id = request.args.get("student_id")

    success, result, status = exp_ctrl.export_excel(date_from, date_to, student_id)
    if not success:
        return jsonify(result), status

    return send_file(
        io.BytesIO(result["bytes"]),
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=result["filename"],
    )


@attendance_bp.route("/export/pdf", methods=["GET"])
@token_required
def export_pdf():
    """Export attendance records as PDF download."""
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    student_id = request.args.get("student_id")

    success, result, status = exp_ctrl.export_pdf(date_from, date_to, student_id)
    if not success:
        return jsonify(result), status

    return send_file(
        io.BytesIO(result["bytes"]),
        mimetype="application/pdf",
        as_attachment=True,
        download_name=result["filename"],
    )
