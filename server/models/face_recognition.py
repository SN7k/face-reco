from deepface import DeepFace
import numpy as np
import tempfile
import os


def extract_face_embedding(image_bytes: bytes) -> np.ndarray:
    """Extract face embedding from raw image bytes using DeepFace (Facenet).

    Uses a Windows-safe temp file pattern (mkstemp) so the file can be read by OpenCV.
    """
    fd, path = tempfile.mkstemp(suffix=".jpg")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(image_bytes)
        analysis = DeepFace.represent(
            img_path=path,
            model_name="Facenet",
            enforce_detection=True,
        )
        if isinstance(analysis, list) and len(analysis) > 0 and "embedding" in analysis[0]:
            return np.asarray(analysis[0]["embedding"], dtype=np.float32)
        raise ValueError("No embedding found in the analysis output")
    finally:
        try:
            os.remove(path)
        except Exception:
            pass


def embedding_to_bytes(embedding: np.ndarray) -> bytes:
    return embedding.astype(np.float32).tobytes()


def bytes_to_embedding(blob: bytes) -> np.ndarray:
    return np.frombuffer(blob, dtype=np.float32)


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    a = a.astype(np.float32)
    b = b.astype(np.float32)
    na = np.linalg.norm(a)
    nb = np.linalg.norm(b)
    if na == 0 or nb == 0:
        return 0.0
    return float(np.dot(a, b) / (na * nb))


def match_faces(embedding1: np.ndarray, embedding2: np.ndarray, threshold: float = 0.8) -> bool:
    # Higher is better for cosine similarity
    return cosine_similarity(embedding1, embedding2) >= threshold