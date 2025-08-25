import os
from pathlib import Path

class Settings:
    # Base directory
    base_dir: Path = Path(__file__).resolve().parent
    
    # Uploads directory
    uploads_dir: Path = base_dir / "uploads"
    
    # GCP Configuration
    gcp_project_id: str = os.getenv("GCP_PROJECT_ID", "")
    gcp_bucket_name: str = os.getenv("GCP_BUCKET_NAME", "face-attendance-123456-asia-south1")
    gcp_credentials_path: str = os.getenv("GCP_CREDENTIALS_PATH", "")
    
    # Face recognition settings
    match_threshold: float = float(os.getenv("MATCH_THRESHOLD", "0.6"))
    # Deduplicate attendance within this many seconds (e.g., 300 = 5 minutes)
    attendance_dedup_seconds: int = int(os.getenv("ATTENDANCE_DEDUP_SECONDS", "300"))
    
    # Database configuration
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./backend.db")

# Create settings instance
settings = Settings()

# Legacy variables for backward compatibility
DATABASE_URL = settings.database_url
GCP_BUCKET_NAME = settings.gcp_bucket_name
GCP_CREDENTIALS_FILE = settings.gcp_credentials_path