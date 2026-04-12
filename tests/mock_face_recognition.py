import sys
from unittest.mock import MagicMock
import numpy as np

mock = MagicMock()
mock.face_locations.return_value = [(0, 10, 10, 0)]
mock.face_encodings.return_value = [np.random.rand(128)]
mock.face_distance.side_effect = lambda known, unknown: np.array([np.linalg.norm(k - unknown) for k in known])
mock.load_image_file.return_value = np.zeros((100, 100, 3), dtype=np.uint8)

sys.modules["face_recognition"] = mock
sys.modules["cv2"] = MagicMock()
