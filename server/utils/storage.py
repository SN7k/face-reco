from google.cloud import storage
from pathlib import Path
from config import settings
import uuid
import os

UPLOADS_DIR = settings.uploads_dir
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def _randomized_name(original: str) -> str:
	name, ext = os.path.splitext(original)
	return f"{name}_{uuid.uuid4().hex[:12]}{ext or '.jpg'}"


async def upload_bytes_to_gcp(filename: str, data: bytes) -> str:
	"""Upload to GCP when BUCKET_NAME configured, otherwise save locally under /uploads.

	Returns a public URL or local path served under /uploads.
	"""
	safe_name = _randomized_name(filename)
	if settings.gcp_bucket_name:
		try:
			client = storage.Client()
			bucket = client.bucket(settings.gcp_bucket_name)
			blob = bucket.blob(safe_name)
			blob.upload_from_string(data)
			return blob.public_url
		except Exception:
			pass
	# Local fallback
	local_path = UPLOADS_DIR / safe_name
	local_path.write_bytes(data)
	# This will be served by FastAPI StaticFiles mounted at /uploads
	return f"/uploads/{safe_name}"