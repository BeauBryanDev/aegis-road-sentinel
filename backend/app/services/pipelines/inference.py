
import os
import cv2
import numpy as np
import onnxruntime as ort
from typing import List, Tuple, Dict, Any


CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

# Navigate up to ml/ and then into ml_models/
MODELS_DIR = os.path.join(os.path.dirname(CURRENT_DIR), "ml_models")

#OCR_MODEL_PATH = os.path.join(MODELS_DIR, "plate_ocr.onnx")
VEHICLE_MODEL_PATH = os.path.join(MODELS_DIR, "vehicle_yolov8m.onnx")
PLATE_MODEL_PATH = os.path.join(MODELS_DIR, "colombian_license_plate_model.onnx")


class MLPipelineError(Exception):
    """Custom exception for ML pipeline failures."""
    pass

class VehicleDetectionPipeline: 
    """
    Orchestrates the ONNX models for full-frame vehicle detection 
    and cropped license plate detection.
    """
    
    def __init__(self,  use_gpu: bool = True):
        """
        Initializes the ONNX Runtime sessions for the required models.
        
        Args:
            use_gpu (bool): Whether to utilize the CUDAExecutionProvider.
        """
        self.providers = ['CUDAExecutionProvider'] if use_gpu else ['CPUExecutionProvider']
        
        if not os.path.exists(VEHICLE_MODEL_PATH) or not os.path.exists(PLATE_MODEL_PATH) :
            raise MLPipelineError("ONNX model files not found. Check the ml_models directory.")

        # Initialize ONNX Inference Sessions
        self.session_vehicle = ort.InferenceSession(VEHICLE_MODEL_PATH, providers=self.providers)
        self.session_plate = ort.InferenceSession(PLATE_MODEL_PATH, providers=self.providers)
        #self.session_ocr = ort.InferenceSession(OCR_MODEL_PATH, providers=self.providers)
        
        # Get input names dynamically from the ONNX computational graph
        self.input_name_vehicle = self.session_vehicle.get_inputs()[0].name
        self.input_name_plate = self.session_plate.get_inputs()[0].name
        #self.input_name_ocr = self.session_ocr.get_inputs()[0].name
        
        # Map class IDs to our VehicleType schema Enum strings
        self.class_map = {
            0: "bus",
            1: "car",
            2: "microbus",
            3: "motorbike",
            4: "pickup-van",
            5: "truck",
            # these are the six classes of the vehicle detector from the original
            # dataset from ROBOFLOW , this one : /vehicle-detection-by9xs-4wygy/settings
        }

    def _preprocess_image(self, img: np.ndarray, target_size: int = 640) -> Tuple[np.ndarray, float]:
        """
        Resizes and normalizes the image tensor for ONNX inference.
        
        Args:
            img (np.ndarray): The raw BGR OpenCV image.
            target_size (int): The expected static input size for the YOLO model.
            
        Returns:
            Tuple[np.ndarray, float]: The NCHW formatted tensor and the scale factor used.
        """
        # YOLO models exported from Ultralytics are trained on RGB; OpenCV loads BGR.
        # Convert so the channel order matches what the model expects.
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Calculate scale to maintain aspect ratio while fitting into target_size
        h, w = img.shape[:2]
        scale = target_size / max(h, w)

        # Resize image
        img_resized = cv2.resize(img, (int(w * scale), int(h * scale)))
        # Carefull with original image size, it can be bigger than target_size, so we need to scale it down to fit into the model's expected input size while maintaining aspect ratio.
        
        # Create a blank square canvas (padding) and place the resized image
        canvas = np.zeros((target_size, target_size, 3), dtype=np.float32)
        canvas[:img_resized.shape[0], :img_resized.shape[1], :] = img_resized
        # TENSOR R ^ C ^ H ^ W  [ 640 x 640 x 3 x 1 ]  (C=3 for BGR channels, H and W are the target_size, and batch size is 1)
        # Normalize pixel values to [0, 1] range
        canvas /= 255.0
        
        # Convert HWC (Height, Width, Channels) to NCHW (Batch, Channels, Height, Width)
        tensor = np.transpose(canvas, (2, 0, 1))
        tensor = np.expand_dims(tensor, axis=0)
        
        return tensor, scale

    def detect_vehicles(self, frame: np.ndarray, conf_threshold: float = 0.5) -> List[Dict[str, Any]]:
        """
        Runs the primary YOLOv8 model to detect vehicles in the main frame.
        
        Args:
            frame (np.ndarray): The original video frame.
            conf_threshold (float): Minimum confidence probability to keep a detection.
            
        Returns:
            List[Dict[str, Any]]: List of detected vehicles with bounding boxes and classes.
        """
        # The vehicle ONNX graph has a static [1, 3, 320, 320] input.
        tensor, scale = self._preprocess_image(frame, target_size=320)

        # Execute the computational graph on the GPU/CPU
        outputs = self.session_vehicle.run(None, {self.input_name_vehicle: tensor})
        predictions = outputs[0]  # Shape: (1, 4 + classes, 2100)

        # Transpose to (2100, 4 + classes) for easier per-anchor parsing
        predictions = np.squeeze(predictions).transpose()

        detections = []
        boxes_xyxy = []   # kept for cropping / output
        boxes_xywh = []   # required format for cv2.dnn.NMSBoxes
        scores = []
        class_ids = []

        # Parse the raw tensor
        for row in predictions:
            class_scores = row[4:]
            class_id = int(np.argmax(class_scores))
            max_score = float(class_scores[class_id])

            if max_score >= conf_threshold and class_id in self.class_map:
                # Extract center x, center y, width, height (in 320px input space)
                xc, yc, w, h = row[0], row[1], row[2], row[3]

                # Convert to x_min, y_min, x_max, y_max and reverse the scaling
                x_min = int((xc - w / 2) / scale)
                y_min = int((yc - h / 2) / scale)
                x_max = int((xc + w / 2) / scale)
                y_max = int((yc + h / 2) / scale)

                boxes_xyxy.append([x_min, y_min, x_max, y_max])
                boxes_xywh.append([x_min, y_min, x_max - x_min, y_max - y_min])
                scores.append(max_score)
                class_ids.append(class_id)

        # Apply OpenCV's built-in NMS to filter overlapping boxes (IoU logic).
        # NMSBoxes interprets boxes as [x, y, w, h], so we pass the xywh form.
        indices = cv2.dnn.NMSBoxes(boxes_xywh, scores, conf_threshold, nms_threshold=0.45)
        if len(indices) > 0:
            for i in indices.flatten():
                detections.append({
                    "bbox": boxes_xyxy[i],
                    "score": scores[i],
                    "class": self.class_map[class_ids[i]]
                })

        return detections

    def detect_plate(self, vehicle_crop: np.ndarray, conf_threshold: float = 0.45) -> Tuple[Any, float]:
        """
        Runs the secondary plate detector on a cropped vehicle image and returns the
        single highest-confidence plate box.

        Args:
            vehicle_crop (np.ndarray): BGR crop of one detected vehicle.
            conf_threshold (float): Minimum confidence to accept a plate.

        Returns:
            Tuple[Optional[List[int]], float]: ([x_min, y_min, x_max, y_max], conf) in
                the vehicle-crop coordinate space, or (None, 0.0) if no plate is found.
        """
        # The plate ONNX graph shares the static [1, 3, 320, 320] input.
        tensor, scale = self._preprocess_image(vehicle_crop, target_size=320)
        outputs = self.session_plate.run(None, {self.input_name_plate: tensor})

        # Output shape (1, 5, 2100) -> (2100, 5): [xc, yc, w, h, plate_conf]
        predictions = np.squeeze(outputs[0]).transpose()

        best_box = None
        best_conf = 0.0
        for row in predictions:
            conf = float(row[4])
            if conf >= conf_threshold and conf > best_conf:
                best_conf = conf
                xc, yc, w, h = row[0], row[1], row[2], row[3]
                best_box = [
                    int((xc - w / 2) / scale),
                    int((yc - h / 2) / scale),
                    int((xc + w / 2) / scale),
                    int((yc + h / 2) / scale),
                ]

        return best_box, best_conf
