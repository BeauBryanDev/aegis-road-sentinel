
import os
import cv2
import re
import numpy as np
import onnxruntime as ort
from typing import Tuple

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ML_DIR = os.path.dirname(CURRENT_DIR)
MODELS_DIR = os.path.join(ML_DIR, "ml_models")
OCR_MODEL_PATH = os.path.join(MODELS_DIR, "plate_ocr.onnx")
# Character dictionary the plate_ocr.onnx model was exported with (stock PP-OCRv4 English).
CHAR_DICT_PATH = os.path.join(ML_DIR, "en_dict.txt")


def _load_character_set(dict_path: str) -> list:
    """
    Builds the CTC index -> character map that matches the exported model.

    PP-OCRv4 export with use_space_char=True yields a label set of:
        ['blank'] + <entries in en_dict.txt> + [' ']
    which is exactly 97 classes for this model (blank + 95 dict entries + 1
    trailing space). Index 0 is the CTC blank.
    """
    with open(dict_path, "r", encoding="utf-8") as f:
        entries = [line.rstrip("\n").rstrip("\r") for line in f]
    # Drop a trailing empty line if the file ends with a newline.
    while entries and entries[-1] == "":
        entries.pop()
    return ["blank"] + entries + [" "]


class PlateOCRProcessor:
    """
    Handles the execution of the CRNN-based recognition model exported from PaddleOCR.
    Expects a cropped license-plate image (BGR or grayscale); preprocessing matches
    the standard PP-OCRv4 recognition pipeline.
    """
    
    def __init__(self, use_gpu: bool = True):
        """
        Initializes the ONNX Runtime session for the OCR model.
        
        Args:
            use_gpu (bool): Hardware acceleration flag.
        """
        self.providers = ['CUDAExecutionProvider'] if use_gpu else ['CPUExecutionProvider']
        
        if not os.path.exists(OCR_MODEL_PATH):
            raise FileNotFoundError(f"OCR ONNX model not found at {OCR_MODEL_PATH}")

        #self.session = ort.InferenceSession(OCR_MODEL_PATH, providers=self.providers)
        
        sess_options = ort.SessionOptions()
        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        sess_options.intra_op_num_threads = os.cpu_count()

        self.session = ort.InferenceSession(
            OCR_MODEL_PATH,
            sess_options=sess_options,
            providers=self.providers
        )
        
        self.input_name = self.session.get_inputs()[0].name

        # Load the exact label set the model was exported with (must equal the
        # model's output class count, here 97).
        if not os.path.exists(CHAR_DICT_PATH):
            raise FileNotFoundError(f"Character dictionary not found at {CHAR_DICT_PATH}")
        self.character_set = _load_character_set(CHAR_DICT_PATH)

        num_classes = self.session.get_outputs()[0].shape[-1]
        if isinstance(num_classes, int) and num_classes != len(self.character_set):
            raise ValueError(
                f"Dictionary size ({len(self.character_set)}) does not match model "
                f"output classes ({num_classes}). OCR decoding would be misaligned."
            )

    def _preprocess_for_crnn(self, plate_crop: np.ndarray) -> np.ndarray:
        """
        Resizes and zero-pads the plate crop to the static ONNX input [1, 3, 48, 320],
        following the standard PP-OCRv4 recognition preprocessing:
        keep aspect ratio at a fixed height of 48, normalize to [-1, 1], then
        right-pad the width to 320.

        Args:
            plate_crop (np.ndarray): The cropped license plate (BGR or grayscale).

        Returns:
            np.ndarray: NCHW float32 tensor ready for inference.
        """
        target_height = 48
        target_width = 320

        # Ensure a 3-channel image (PP-OCRv4 expects 3 channels).
        if plate_crop.ndim == 2:
            plate_crop = cv2.cvtColor(plate_crop, cv2.COLOR_GRAY2BGR)

        h, w = plate_crop.shape[:2]

        # Resize keeping aspect ratio, clipping the width to the static tensor size.
        ratio = w / float(h)
        resized_w = min(int(target_height * ratio), target_width)
        resized_w = max(resized_w, 1)
        resized = cv2.resize(plate_crop, (resized_w, target_height), interpolation=cv2.INTER_LINEAR)

        # Normalize to [-1, 1] (PP-OCR: img/255, then (x - 0.5) / 0.5) in CHW order.
        resized = resized.astype(np.float32).transpose(2, 0, 1) / 255.0
        resized = (resized - 0.5) / 0.5

        # Zero-pad the normalized image on the right up to the static width.
        canvas = np.zeros((3, target_height, target_width), dtype=np.float32)
        canvas[:, :, :resized_w] = resized

        return np.expand_dims(canvas, axis=0)


    def _ctc_decode(self, predictions: np.ndarray) -> Tuple[str, float]:
        """
        Decodes the raw Softmax probabilities using CTC Greedy Decoding:
        per timestep take the argmax, collapse consecutive duplicates, and drop
        the blank token (index 0). The collapsed string is then matched against
        the Colombian plate format; if no match is found the cleaned alphanumeric
        string is returned as a fallback.

        Args:
            predictions (np.ndarray): The raw output tensor from the CRNN, shape
                (batch, timesteps, num_classes).

        Returns:
            Tuple[str, float]: The decoded plate text and its average confidence.
        """
        sequence = predictions[0]

        raw_text = []
        confidences = []
        previous_idx = 0

        for step in sequence:
            char_idx = int(np.argmax(step))
            confidence = float(np.max(step))

            # CTC: skip blanks (index 0) and collapse repeated indices.
            if char_idx != 0 and char_idx != previous_idx:
                raw_text.append(self.character_set[char_idx])
                confidences.append(confidence)

            previous_idx = char_idx

        decoded = "".join(raw_text).upper()

        # Keep only plate-valid characters (Colombian plates are A-Z, 0-9).
        cleaned = re.sub(r"[^A-Z0-9]", "", decoded)

        # Prefer a strict Colombian plate match (e.g. ABC123 / ABC12D) if present.
        match = re.search(r"[A-Z]{3}[0-9]{2,3}[A-Z]?", cleaned)
        plate_text = match.group(0) if match else cleaned

        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

        return plate_text, avg_confidence


    def extract_text(self, processed_crop: np.ndarray) -> Tuple[str, float]:
        """
        End-to-end execution of the OCR model.
        
        Args:
            processed_crop (np.ndarray): The cropped license plate array.
            
        Returns:
            Tuple[str, float]: The license plate text and confidence.
        """
        tensor = self._preprocess_for_crnn(processed_crop)

        outputs = self.session.run(None, {self.input_name: tensor})
        raw_probabilities = outputs[0]

        if raw_probabilities.ndim == 4:
            # Collapse an extra channel dimension if the export carries one.
            raw_probabilities = raw_probabilities[:, 0, :, :]
        elif raw_probabilities.ndim != 3:
            raise ValueError(f"Unexpected OCR output shape: {raw_probabilities.shape}")

        return self._ctc_decode(raw_probabilities)
