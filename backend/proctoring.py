import cv2
import numpy as np
import time

# Try to import MediaPipe, but handle gracefully if not available
try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False
    print("Warning: MediaPipe not available. Proctoring features will be limited.")


class Proctor:
    def __init__(self):
        self.mediapipe_available = MEDIAPIPE_AVAILABLE
        if MEDIAPIPE_AVAILABLE:
            self.mp_face_mesh = mp.solutions.face_mesh
            self.face_mesh = self.mp_face_mesh.FaceMesh(
                min_detection_confidence=0.5, 
                min_tracking_confidence=0.5,
                max_num_faces=1
            )
            self.mp_drawing = mp.solutions.drawing_utils
        else:
            # Fallback to basic OpenCV face detection
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            if self.face_cascade.empty():
                print("Warning: Could not load face cascade classifier")
        self.last_face_detected = time.time()
        self.alert_cooldown = 10.0  # Increased to 10 seconds before showing alert again
        self.last_alert_time = {}  # Track last alert time per type
        self.face_detection_count = 0  # Track successful face detections
        self.startup_time = time.time()  # Track when proctor was initialized
        self.startup_grace_period = 15.0  # Don't alert for first 15 seconds

    def analyze_frame(self, frame):
        alerts = []
        h, w, _ = frame.shape
        w_frame = w  # Store frame width for calculations
        current_time = time.time()
        
        # Don't alert during startup grace period
        if current_time - self.startup_time < self.startup_grace_period:
            return alerts
        
        if not self.mediapipe_available:
            # Fallback to basic OpenCV face detection with head movement detection
            try:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                # More lenient parameters: scaleFactor=1.2 (less sensitive), minNeighbors=3 (fewer neighbors required)
                # This makes detection more forgiving
                faces = self.face_cascade.detectMultiScale(
                    gray, 
                    scaleFactor=1.2,  # Increased from 1.1 - less sensitive to scale changes
                    minNeighbors=3,   # Decreased from 4 - requires fewer neighbors
                    minSize=(30, 30), # Minimum face size
                    flags=cv2.CASCADE_SCALE_IMAGE
                )
                
                if len(faces) == 0:
                    # Only alert if no face detected for more than cooldown period
                    # And only if we've had successful detections before (to avoid false alerts on startup)
                    if self.face_detection_count > 5 and current_time - self.last_face_detected > self.alert_cooldown:
                        alert_key = "no_face"
                        if alert_key not in self.last_alert_time or (current_time - self.last_alert_time[alert_key]) > self.alert_cooldown:
                            alerts.append("ALERT: No Face Detected!")
                            self.last_alert_time[alert_key] = current_time
                    return alerts
                
                # Face detected - update counters
                self.last_face_detected = current_time
                self.face_detection_count += 1
            except Exception as e:
                print(f"Error in OpenCV face detection: {e}")
                # Don't alert on errors, just return empty
                return alerts
            
            self.last_face_detected = time.time()
            
            # Only alert for multiple faces if there are clearly 2+ distinct faces
            # OpenCV can sometimes detect the same face multiple times, so be lenient
            if len(faces) > 2:  # Changed from > 1 to > 2 to reduce false positives
                alert_key = "multiple_faces"
                if alert_key not in self.last_alert_time or (current_time - self.last_alert_time[alert_key]) > self.alert_cooldown:
                    alerts.append("ALERT: Multiple Faces Detected!")
                    self.last_alert_time[alert_key] = current_time
            
            # Basic head movement detection using face position
            if len(faces) > 0:
                (x, y, w, h) = faces[0]
                face_center_x = x + w / 2
                frame_center_x = w_frame / 2
                
                # Calculate deviation from center
                deviation_ratio = abs(face_center_x - frame_center_x) / (w_frame / 2)
                
                # Increased threshold from 0.3 to 0.5 to reduce false positives
                # Only alert if face is very far off-center
                if deviation_ratio > 0.5:
                    alert_key = "head_away"
                    if alert_key not in self.last_alert_time or (current_time - self.last_alert_time[alert_key]) > self.alert_cooldown:
                        alerts.append("WARNING: Head position suggests looking away")
                        self.last_alert_time[alert_key] = current_time
            
            return alerts
        
        # MediaPipe-based detection
        try:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.face_mesh.process(rgb_frame)

            if not results.multi_face_landmarks:
                # Only alert if no face detected for more than cooldown period
                # And only if we've had successful detections before (to avoid false alerts on startup)
                if self.face_detection_count > 5 and current_time - self.last_face_detected > self.alert_cooldown:
                    alert_key = "no_face"
                    if alert_key not in self.last_alert_time or (current_time - self.last_alert_time[alert_key]) > self.alert_cooldown:
                        alerts.append("ALERT: No Face Detected!")
                        self.last_alert_time[alert_key] = current_time
                return alerts
            
            # Face detected - update counters
            self.last_face_detected = current_time
            self.face_detection_count += 1
        except Exception as e:
            print(f"Error in MediaPipe face detection: {e}")
            # Don't alert on errors, just return empty
            return alerts
        
        self.last_face_detected = time.time()

        # Only alert for multiple faces if there are clearly 2+ distinct faces
        if len(results.multi_face_landmarks) > 2:  # Changed from > 1 to > 2
            alert_key = "multiple_faces"
            if alert_key not in self.last_alert_time or (current_time - self.last_alert_time[alert_key]) > self.alert_cooldown:
                alerts.append("ALERT: Multiple Faces Detected!")
                self.last_alert_time[alert_key] = current_time

        for face_landmarks in results.multi_face_landmarks:
            # 1. Gaze/Head Pose Estimation (Simplified)
            # Nose tip is index 1, Left eye outer 33, Right eye outer 263
            nose_tip = face_landmarks.landmark[1]
            left_eye = face_landmarks.landmark[33]
            right_eye = face_landmarks.landmark[263]

            # Check if nose is too far left or right relative to eyes
            face_center_x = (left_eye.x + right_eye.x) / 2
            deviation = nose_tip.x - face_center_x
            
            # Increased threshold from 0.05 to 0.15 to reduce false positives
            # Only alert if head is significantly turned
            if abs(deviation) > 0.15:
                alert_key = "head_turned"
                if alert_key not in self.last_alert_time or (current_time - self.last_alert_time[alert_key]) > self.alert_cooldown:
                    alerts.append("WARNING: Head turned away")
                    self.last_alert_time[alert_key] = current_time

            # 2. Eye Aspect Ratio (Liveness/Sleeping check)
            # Left eye landmarks
            left_upper = face_landmarks.landmark[159].y
            left_lower = face_landmarks.landmark[145].y
            left_eye_open = abs(left_lower - left_upper)
            
            # Right eye landmarks
            right_upper = face_landmarks.landmark[386].y
            right_lower = face_landmarks.landmark[374].y
            right_eye_open = abs(right_lower - right_upper)
            
            # Check if eyes are closed (with cooldown and higher threshold)
            # Increased threshold from 0.002 to 0.005 to reduce false positives
            if (left_eye_open < 0.005 or right_eye_open < 0.005):
                alert_key = "eyes_closed"
                if alert_key not in self.last_alert_time or (current_time - self.last_alert_time[alert_key]) > self.alert_cooldown:
                    alerts.append("WARNING: Eyes closed")
                    self.last_alert_time[alert_key] = current_time

            # 3. Face distance check (too close or too far)
            # Use face bounding box size as proxy for distance
            face_landmarks_array = np.array([
                [lm.x * w, lm.y * h] for lm in face_landmarks.landmark
            ])
            face_width = np.max(face_landmarks_array[:, 0]) - np.min(face_landmarks_array[:, 0])
            face_height = np.max(face_landmarks_array[:, 1]) - np.min(face_landmarks_array[:, 1])
            face_size = (face_width + face_height) / 2
            
            # Normalize by frame size (with cooldown and adjusted thresholds)
            normalized_size = face_size / max(w, h)
            if normalized_size < 0.10:  # More lenient - only alert if very far
                alert_key = "face_too_far"
                if alert_key not in self.last_alert_time or (current_time - self.last_alert_time[alert_key]) > self.alert_cooldown:
                    alerts.append("WARNING: Face too far from camera")
                    self.last_alert_time[alert_key] = current_time
            elif normalized_size > 0.6:  # More lenient - only alert if very close
                alert_key = "face_too_close"
                if alert_key not in self.last_alert_time or (current_time - self.last_alert_time[alert_key]) > self.alert_cooldown:
                    alerts.append("WARNING: Face too close to camera")
                    self.last_alert_time[alert_key] = current_time

        return alerts

