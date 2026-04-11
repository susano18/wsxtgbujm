"""
Email Notification Service
Sends attendance alerts and reports via email (optional feature).
"""

import logging
from flask import current_app
from flask_mail import Mail, Message

mail = Mail()
logger = logging.getLogger(__name__)


def init_mail(app):
    """Initialize Flask-Mail with the app. Call from app factory if email is configured."""
    if app.config.get("MAIL_USERNAME"):
        mail.init_app(app)
        logger.info("Email service initialized.")
    else:
        logger.warning("Email not configured — MAIL_USERNAME is not set.")


def send_attendance_notification(student_name, student_email, date_str, time_str):
    """Send an attendance confirmation email to a student."""
    try:
        if not current_app.config.get("MAIL_USERNAME"):
            logger.debug("Email skipped — not configured.")
            return False

        msg = Message(
            subject=f"Attendance Confirmed — {date_str}",
            recipients=[student_email],
            body=(
                f"Hello {student_name},\n\n"
                f"Your attendance has been recorded:\n"
                f"  Date: {date_str}\n"
                f"  Time: {time_str}\n\n"
                f"Thank you,\n"
                f"Smart Attendance System"
            ),
        )
        mail.send(msg)
        logger.info("Attendance email sent to %s", student_email)
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", student_email, str(e))
        return False


def send_daily_report(admin_email, date_str, total_present, total_absent, total_late):
    """Send a daily attendance summary to an admin."""
    try:
        if not current_app.config.get("MAIL_USERNAME"):
            return False

        msg = Message(
            subject=f"Daily Attendance Report — {date_str}",
            recipients=[admin_email],
            body=(
                f"Daily Attendance Report for {date_str}\n"
                f"{'=' * 40}\n\n"
                f"  Present: {total_present}\n"
                f"  Late:    {total_late}\n"
                f"  Absent:  {total_absent}\n\n"
                f"— Smart Attendance System"
            ),
        )
        mail.send(msg)
        logger.info("Daily report sent to %s", admin_email)
        return True
    except Exception as e:
        logger.error("Failed to send daily report: %s", str(e))
        return False
