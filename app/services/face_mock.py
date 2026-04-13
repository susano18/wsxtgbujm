from unittest.mock import MagicMock
import sys
import numpy as np

def mock_face_system():
    mock = MagicMock()
    mock.face_locations.return_value = []
    mock.face_encodings.return_value = []
    mock.face_distance.return_value = np.array([])
    mock.load_image_file.return_value = np.zeros((10, 10, 3), dtype=np.uint8)
    sys.modules["face_recognition"] = mock
