"""
Export Controller
Generates attendance reports in CSV, Excel (.xlsx), and PDF formats.
"""

import os
import io
import logging
from datetime import date, datetime

import pandas as pd
from flask import current_app

from app.models.database import db
from app.models.student import Student
from app.models.attendance import AttendanceRecord

logger = logging.getLogger(__name__)


def _build_dataframe(date_from=None, date_to=None, student_id=None):
    """Build a pandas DataFrame from attendance records."""
    query = db.session.query(
        AttendanceRecord.id,
        Student.student_id.label("student_code"),
        Student.name.label("student_name"),
        Student.department,
        AttendanceRecord.date,
        AttendanceRecord.time_in,
        AttendanceRecord.time_out,
        AttendanceRecord.status,
        AttendanceRecord.confidence_score,
        AttendanceRecord.camera_id,
        AttendanceRecord.notes,
    ).join(Student, AttendanceRecord.student_id == Student.id)

    if date_from:
        query = query.filter(AttendanceRecord.date >= date_from)
    if date_to:
        query = query.filter(AttendanceRecord.date <= date_to)
    if student_id:
        query = query.filter(Student.student_id == student_id)

    query = query.order_by(AttendanceRecord.date.desc(), Student.name.asc())
    rows = query.all()

    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows, columns=[
        "Record ID", "Student ID", "Student Name", "Department",
        "Date", "Time In", "Time Out", "Status", "Confidence", "Camera", "Notes"
    ])

    # Format datetime columns
    df["Date"] = pd.to_datetime(df["Date"]).dt.strftime("%Y-%m-%d")
    df["Time In"] = pd.to_datetime(df["Time In"]).dt.strftime("%H:%M:%S")
    df["Time Out"] = pd.to_datetime(df["Time Out"]).dt.strftime("%H:%M:%S").replace("NaT", "")

    return df


def export_csv(date_from=None, date_to=None, student_id=None):
    """Export attendance records to CSV."""
    try:
        df = _build_dataframe(date_from, date_to, student_id)
        if df.empty:
            return False, {"error": "No records found for the given filters."}, 404

        buffer = io.StringIO()
        df.to_csv(buffer, index=False)
        csv_content = buffer.getvalue()

        # Also save to exports directory
        filename = f"attendance_{date.today().isoformat()}.csv"
        filepath = os.path.join(current_app.config["EXPORTS_DIR"], filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(csv_content)

        logger.info("CSV export generated: %s (%d records)", filename, len(df))
        return True, {
            "content": csv_content,
            "filename": filename,
            "filepath": filepath,
            "record_count": len(df),
        }, 200
    except Exception as e:
        logger.error("CSV export failed: %s", str(e))
        return False, {"error": f"Export failed: {str(e)}"}, 500


def export_excel(date_from=None, date_to=None, student_id=None):
    """Export attendance records to Excel (.xlsx)."""
    try:
        df = _build_dataframe(date_from, date_to, student_id)
        if df.empty:
            return False, {"error": "No records found for the given filters."}, 404

        filename = f"attendance_{date.today().isoformat()}.xlsx"
        filepath = os.path.join(current_app.config["EXPORTS_DIR"], filename)

        with pd.ExcelWriter(filepath, engine="openpyxl") as writer:
            df.to_excel(writer, sheet_name="Attendance", index=False)

            # Auto-adjust column widths
            worksheet = writer.sheets["Attendance"]
            for i, col in enumerate(df.columns):
                max_len = max(df[col].astype(str).map(len).max(), len(col)) + 2
                worksheet.column_dimensions[chr(65 + i)].width = min(max_len, 30)

        # Also create in-memory bytes for download
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
            df.to_excel(writer, sheet_name="Attendance", index=False)
        excel_bytes = buffer.getvalue()

        logger.info("Excel export generated: %s (%d records)", filename, len(df))
        return True, {
            "bytes": excel_bytes,
            "filename": filename,
            "filepath": filepath,
            "record_count": len(df),
        }, 200
    except Exception as e:
        logger.error("Excel export failed: %s", str(e))
        return False, {"error": f"Export failed: {str(e)}"}, 500


def export_pdf(date_from=None, date_to=None, student_id=None):
    """Export attendance records to PDF using ReportLab."""
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet

        df = _build_dataframe(date_from, date_to, student_id)
        if df.empty:
            return False, {"error": "No records found for the given filters."}, 404

        filename = f"attendance_{date.today().isoformat()}.pdf"
        filepath = os.path.join(current_app.config["EXPORTS_DIR"], filename)

        doc = SimpleDocTemplate(filepath, pagesize=landscape(A4))
        styles = getSampleStyleSheet()
        elements = []

        # Title
        title = Paragraph("Smart Attendance System — Report", styles["Title"])
        elements.append(title)

        subtitle_text = f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        if date_from or date_to:
            subtitle_text += f" | Period: {date_from or 'start'} to {date_to or 'today'}"
        subtitle = Paragraph(subtitle_text, styles["Normal"])
        elements.append(subtitle)
        elements.append(Spacer(1, 0.3 * inch))

        # Select columns for PDF (exclude Notes and Camera for space)
        pdf_cols = ["Student ID", "Student Name", "Department", "Date", "Time In", "Status", "Confidence"]
        pdf_df = df[pdf_cols].copy()

        # Build table data
        table_data = [pdf_cols]  # header
        for _, row in pdf_df.iterrows():
            table_data.append([str(v) if pd.notna(v) else "" for v in row])

        table = Table(table_data, repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c3e50")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("FONTSIZE", (0, 1), (-1, -1), 8),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 0.3 * inch))

        # Summary
        summary_text = f"Total Records: {len(df)}"
        elements.append(Paragraph(summary_text, styles["Normal"]))

        doc.build(elements)

        # Read bytes for download
        with open(filepath, "rb") as f:
            pdf_bytes = f.read()

        logger.info("PDF export generated: %s (%d records)", filename, len(df))
        return True, {
            "bytes": pdf_bytes,
            "filename": filename,
            "filepath": filepath,
            "record_count": len(df),
        }, 200
    except ImportError:
        return False, {"error": "reportlab is not installed. Install it via: pip install reportlab"}, 500
    except Exception as e:
        logger.error("PDF export failed: %s", str(e))
        return False, {"error": f"Export failed: {str(e)}"}, 500
