"""
Smart Attendance System — Main Entry Point
Starts the Flask server with the configured environment.
"""

from app import create_app
import os

app = create_app()

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=app.config.get("DEBUG", True),
    )
