import unittest
import tests.mock_face_recognition
from app import create_app, db
from app.models.student import Student
from app.services.face_service import FaceService
import numpy as np

class TestIntegration(unittest.TestCase):
    def setUp(self):
        from app.config import TestingConfig
        self.app = create_app(TestingConfig)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_student_registration_and_cache(self):
        # Initial cache should be empty
        FaceService.clear_cache()
        encodings, students = FaceService.get_known_faces()
        self.assertEqual(len(encodings), 0)

        # Create a student
        s = Student(student_id="STU001", name="Test Student", email="test@test.com")
        mock_encoding = np.random.rand(128)
        s.set_encodings([mock_encoding])
        db.session.add(s)
        db.session.commit()

        # Cache should still be empty if not cleared (it has a timeout, but we manually clear in logic)
        # Testing if the clear_cache in controller (to be added) works
        FaceService.clear_cache()
        encs, studs = FaceService.get_known_faces()
        self.assertEqual(len(encs), 1)
        self.assertEqual(studs[0].student_id, "STU001")

if __name__ == "__main__":
    unittest.main()
