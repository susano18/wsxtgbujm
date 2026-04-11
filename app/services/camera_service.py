"""
Camera Service
Manages camera capture sessions with support for multiple cameras.
"""

import logging
import threading
import time

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class CameraManager:
    """Thread-safe manager for multiple camera instances."""

    def __init__(self):
        self._cameras = {}  # camera_id -> CameraStream
        self._lock = threading.Lock()

    def open_camera(self, camera_id="cam_0", source=0):
        """Open a camera stream."""
        with self._lock:
            if camera_id in self._cameras and self._cameras[camera_id].is_active:
                logger.info("Camera '%s' is already open.", camera_id)
                return True

            stream = CameraStream(camera_id, source)
            if stream.open():
                self._cameras[camera_id] = stream
                logger.info("Camera '%s' opened (source=%s).", camera_id, source)
                return True
            else:
                logger.error("Failed to open camera '%s' (source=%s).", camera_id, source)
                return False

    def close_camera(self, camera_id="cam_0"):
        """Close a specific camera stream."""
        with self._lock:
            if camera_id in self._cameras:
                self._cameras[camera_id].close()
                del self._cameras[camera_id]
                logger.info("Camera '%s' closed.", camera_id)

    def close_all(self):
        """Close all camera streams."""
        with self._lock:
            for cam_id, stream in self._cameras.items():
                stream.close()
                logger.info("Camera '%s' closed.", cam_id)
            self._cameras.clear()

    def capture_frame(self, camera_id="cam_0"):
        """
        Capture a single frame from the specified camera.
        Returns:
            (success: bool, frame: numpy array or None)
        """
        with self._lock:
            if camera_id not in self._cameras:
                logger.error("Camera '%s' is not open.", camera_id)
                return False, None
            return self._cameras[camera_id].read()

    def capture_rgb_frame(self, camera_id="cam_0"):
        """Capture a frame and convert BGR → RGB for face_recognition."""
        success, frame = self.capture_frame(camera_id)
        if success and frame is not None:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            return True, rgb_frame
        return False, None

    def list_cameras(self):
        """List all active camera IDs."""
        with self._lock:
            return {
                cam_id: {"active": stream.is_active, "source": stream.source}
                for cam_id, stream in self._cameras.items()
            }

    @staticmethod
    def detect_available_cameras(max_check=5):
        """Probe for available camera indices."""
        available = []
        for i in range(max_check):
            cap = cv2.VideoCapture(i)
            if cap.isOpened():
                ret, _ = cap.read()
                if ret:
                    available.append(i)
                cap.release()
        logger.info("Available cameras: %s", available)
        return available


class CameraStream:
    """Wraps cv2.VideoCapture for a single camera source."""

    def __init__(self, camera_id, source=0):
        self.camera_id = camera_id
        self.source = source
        self._capture = None
        self.is_active = False

    def open(self):
        """Open the video capture device."""
        try:
            self._capture = cv2.VideoCapture(self.source)
            if self._capture.isOpened():
                self.is_active = True
                return True
            return False
        except Exception as e:
            logger.error("Error opening camera %s: %s", self.camera_id, str(e))
            return False

    def read(self):
        """Read a single frame."""
        if self._capture and self.is_active:
            ret, frame = self._capture.read()
            if ret:
                return True, frame
            else:
                logger.warning("Failed to read frame from camera '%s'.", self.camera_id)
                return False, None
        return False, None

    def close(self):
        """Release the camera resource."""
        if self._capture:
            self._capture.release()
        self.is_active = False


# Global camera manager singleton
camera_manager = CameraManager()
