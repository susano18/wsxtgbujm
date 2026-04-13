import unittest
import tests.mock_face_recognition
from app import create_app, db
from app.models.student import Student
from app.models.user import User
from app.models.attendance import AttendanceRecord
from datetime import date
import numpy as np

class TestModels(unittest.TestCase):
    def setUp(self):
        from app.config import TestingConfig
        self.app = create_app(TestingConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_student_model(self):
        student = Student(
            student_id="STU001",
            name="Alice Smith",
            email="alice@example.com",
            department="Physics",
            year=2
        )
        db.session.add(student)
        db.session.commit()

        saved_student = Student.query.filter_by(student_id="STU001").first()
        self.assertIsNotNone(saved_student)
        self.assertEqual(saved_student.name, "Alice Smith")

        # Test encodings
        mock_encoding = np.random.rand(128)
        saved_student.set_encodings([mock_encoding])
        db.session.commit()
        self.assertEqual(len(saved_student.get_encodings()), 1)

    def test_user_model(self):
        user = User(username="staff1", email="staff1@example.com", role="viewer")
        user.set_password("secret123")
        db.session.add(user)
        db.session.commit()

        saved_user = User.query.filter_by(username="staff1").first()
        self.assertIsNotNone(saved_user)
        self.assertTrue(saved_user.check_password("secret123"))
        self.assertFalse(saved_user.check_password("wrong"))

    def test_attendance_model_relationship(self):
        student = Student(student_id="STU002", name="Bob Jones", email="bob@example.com")
        db.session.add(student)
        db.session.commit()

        record = AttendanceRecord(
            student_db_id=student.id,
            status="present",
            confidence_score=0.95
        )
        db.session.add(record)
        db.session.commit()

        # Test relationship
        self.assertEqual(record.student.name, "Bob Jones")
        self.assertEqual(student.attendance_records.count(), 1)
        self.assertEqual(student.attendance_records.first().status, "present")

    def test_unique_constraint_attendance(self):
        student = Student(student_id="STU003", name="Charlie Brown", email="charlie@example.com")
        db.session.add(student)
        db.session.commit()

        record1 = AttendanceRecord(student_db_id=student.id, date=date.today())
        db.session.add(record1)
        db.session.commit()

        record2 = AttendanceRecord(student_db_id=student.id, date=date.today())
        db.session.add(record2)
        with self.assertRaises(Exception):
            db.session.commit()

if __name__ == "__main__":
    unittest.main()
