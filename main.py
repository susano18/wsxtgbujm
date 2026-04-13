"""
Smart Attendance System — Main Entry Point
Starts the Flask server with the configured environment.
"""

from app import create_app
import os

# If face_recognition is missing, use mock for development/verification
try:
    import face_recognition
except ImportError:
    from app.services.face_mock import mock_face_system
    mock_face_system()

app = create_app()

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=app.config.get("DEBUG", True),
    )
