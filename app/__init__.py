"""
Smart Attendance System - Application Factory
"""

import os
from flask import Flask
from flask_cors import CORS

from app.config import get_config
from app.models.database import db
from app.utils.logger import setup_logger


def create_app(config_class=None):
    """Create and configure the Flask application."""

    app = Flask(
        __name__,
        static_folder=os.path.join(os.path.dirname(__file__), "..", "static"),
    )

    # Load configuration
    if config_class is None:
        config_class = get_config()
    app.config.from_object(config_class)

    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize extensions
    db.init_app(app)

    # Setup logging
    setup_logger(app)

    # Ensure required directories exist
    for directory in [
        app.config["PHOTOS_DIR"],
        app.config["EXPORTS_DIR"],
        app.config["LOGS_DIR"],
    ]:
        os.makedirs(directory, exist_ok=True)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.students import students_bp
    from app.routes.attendance import attendance_bp
    from app.routes.analytics import analytics_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(students_bp, url_prefix="/api/students")
    app.register_blueprint(attendance_bp, url_prefix="/api/attendance")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")

    # Create tables and seed admin user
    with app.app_context():
        from app.models.student import Student  # noqa: F401
        from app.models.attendance import AttendanceRecord  # noqa: F401
        from app.models.user import User  # noqa: F401

        db.create_all()
        _seed_admin(app)

    app.logger.info("Smart Attendance System initialized successfully.")
    return app


def _seed_admin(app):
    """Create default admin user if none exists."""
    from app.models.user import User

    if User.query.filter_by(role="admin").first() is None:
        admin = User(
            username=app.config["ADMIN_USERNAME"],
            email=app.config["ADMIN_EMAIL"],
            role="admin",
        )
        admin.set_password(app.config["ADMIN_PASSWORD"])
        db.session.add(admin)
        db.session.commit()
        app.logger.info("Default admin user created.")
