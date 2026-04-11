"""
Face Recognition Service
Core face detection and recognition logic using the face_recognition library.
"""

import logging
import numpy as np
import face_recognition
from flask import current_app

logger = logging.getLogger(__name__)


class FaceService:
    """Handles face detection, encoding, and comparison."""

    @staticmethod
    def detect_faces(image):
        """
        Detect faces in an image and return their locations.
        Args:
            image: numpy array (RGB format)
        Returns:
            list of face location tuples (top, right, bottom, left)
        """
        try:
            model = current_app.config.get("FACE_RECOGNITION_MODEL", "hog")
            locations = face_recognition.face_locations(image, model=model)
            logger.debug("Detected %d face(s) in image.", len(locations))
            return locations
        except Exception as e:
            logger.error("Face detection failed: %s", str(e))
            return []

    @staticmethod
    def encode_faces(image, face_locations=None):
        """
        Generate 128-dimensional face encodings for detected faces.
        Args:
            image: numpy array (RGB format)
            face_locations: optional pre-computed face locations
        Returns:
            list of face encoding numpy arrays
        """
        try:
            if face_locations is None:
                face_locations = FaceService.detect_faces(image)
            encodings = face_recognition.face_encodings(image, face_locations)
            logger.debug("Generated %d encoding(s).", len(encodings))
            return encodings
        except Exception as e:
            logger.error("Face encoding failed: %s", str(e))
            return []

    @staticmethod
    def compare_faces(known_encodings, unknown_encoding, tolerance=None):
        """
        Compare an unknown face encoding against a list of known encodings.
        Args:
            known_encodings: list of numpy arrays (known faces)
            unknown_encoding: numpy array (face to identify)
            tolerance: float, distance threshold (lower = stricter)
        Returns:
            dict with 'match': bool, 'index': int or None, 'confidence': float,
                 'distances': list of distances
        """
        if tolerance is None:
            try:
                tolerance = current_app.config.get("FACE_RECOGNITION_TOLERANCE", 0.5)
            except RuntimeError:
                tolerance = 0.5

        if not known_encodings:
            return {"match": False, "index": None, "confidence": 0.0, "distances": []}

        try:
            # Convert lists back to numpy arrays if needed
            known_np = [
                np.array(enc) if not isinstance(enc, np.ndarray) else enc
                for enc in known_encodings
            ]
            unknown_np = (
                np.array(unknown_encoding)
                if not isinstance(unknown_encoding, np.ndarray)
                else unknown_encoding
            )

            # Compute face distances
            distances = face_recognition.face_distance(known_np, unknown_np)
            distances_list = distances.tolist()

            # Find best match
            best_idx = int(np.argmin(distances))
            best_distance = distances[best_idx]

            if best_distance <= tolerance:
                # Convert distance to confidence (0-1 scale, 1 = perfect match)
                confidence = max(0.0, 1.0 - best_distance)
                return {
                    "match": True,
                    "index": best_idx,
                    "confidence": round(confidence, 4),
                    "distance": round(best_distance, 4),
                    "distances": [round(d, 4) for d in distances_list],
                }
            else:
                return {
                    "match": False,
                    "index": None,
                    "confidence": 0.0,
                    "distance": round(best_distance, 4),
                    "distances": [round(d, 4) for d in distances_list],
                }
        except Exception as e:
            logger.error("Face comparison failed: %s", str(e))
            return {"match": False, "index": None, "confidence": 0.0, "distances": []}

    @staticmethod
    def encode_from_file(image_path):
        """
        Load an image file and extract face encodings.
        Args:
            image_path: path to image file
        Returns:
            list of encoding arrays, or empty list on failure
        """
        try:
            image = face_recognition.load_image_file(image_path)
            encodings = face_recognition.face_encodings(image)
            if not encodings:
                logger.warning("No faces found in image: %s", image_path)
            return encodings
        except Exception as e:
            logger.error("Failed to encode from file %s: %s", image_path, str(e))
            return []

    @staticmethod
    def validate_face_image(image):
        """
        Validate that an image contains exactly one face.
        Returns:
            (is_valid, message, encoding_or_none)
        """
        locations = FaceService.detect_faces(image)
        if len(locations) == 0:
            return False, "No face detected in the image.", None
        if len(locations) > 1:
            return False, f"Multiple faces ({len(locations)}) detected. Please provide an image with a single face.", None

        encodings = face_recognition.face_encodings(image, locations)
        if not encodings:
            return False, "Could not generate face encoding.", None

        return True, "Face validated successfully.", encodings[0]
