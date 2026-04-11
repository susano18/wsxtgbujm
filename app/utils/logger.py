"""
Logging Configuration
Sets up structured logging with file rotation and console output.
"""

import os
import logging
from logging.handlers import RotatingFileHandler


def setup_logger(app):
    """Configure application-wide logging."""

    log_dir = app.config.get("LOGS_DIR", "logs")
    os.makedirs(log_dir, exist_ok=True)

    log_file = os.path.join(log_dir, "attendance_system.log")

    # Formatter
    formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)s in %(module)s (%(funcName)s:%(lineno)d): %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # File handler with rotation (5 MB max, keep 10 backups)
    file_handler = RotatingFileHandler(
        log_file, maxBytes=5 * 1024 * 1024, backupCount=10, encoding="utf-8"
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG if app.debug else logging.INFO)
    console_handler.setFormatter(formatter)

    # Apply to Flask logger
    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)
    app.logger.setLevel(logging.DEBUG if app.debug else logging.INFO)

    # Quiet down noisy libraries
    logging.getLogger("werkzeug").setLevel(logging.WARNING)

    app.logger.info("Logger initialized — log file: %s", log_file)
