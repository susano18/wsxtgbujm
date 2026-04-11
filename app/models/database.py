"""
Database initialization module.
Provides the shared SQLAlchemy instance used across the application.
"""

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
