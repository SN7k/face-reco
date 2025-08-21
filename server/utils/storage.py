from google.cloud import storage
from pathlib import Path
from config import settings

UPLOADS_DIR = settings.uploads_dir
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


async def upload_bytes_to_gcp(filename: str, data: bytes) -> str:
	"""Upload to GCP when BUCKET_NAME configured, otherwise save locally under /uploads.

	Returns a public URL or local path served under /uploads.
	"""
	if settings.gcp_bucket_name:
		try:
			client = storage.Client()
			bucket = client.bucket(settings.gcp_bucket_name)
			blob = bucket.blob(filename)
			blob.upload_from_string(data)
			return blob.public_url
		except Exception:
			pass
	# Local fallback
	local_path = UPLOADS_DIR / filename
	local_path.write_bytes(data)
	# This will be served by FastAPI StaticFiles mounted at /uploads
	return f"/uploads/{filename}"