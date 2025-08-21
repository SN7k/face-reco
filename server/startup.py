#!/usr/bin/env python3
"""
Startup script for the Face Recognition Attendance System
Handles initialization and startup gracefully for container environments
"""

import os
import time
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def ensure_directories():
    """Ensure required directories exist"""
    try:
        # Create uploads directory
        uploads_dir = Path("uploads")
        uploads_dir.mkdir(exist_ok=True)
        logger.info(f"Uploads directory ready: {uploads_dir.absolute()}")
        
        # Create logs directory if needed
        logs_dir = Path("logs")
        logs_dir.mkdir(exist_ok=True)
        logger.info(f"Logs directory ready: {logs_dir.absolute()}")
        
    except Exception as e:
        logger.error(f"Failed to create directories: {e}")
        raise

def wait_for_dependencies():
    """Wait for any external dependencies to be ready"""
    # Add any dependency checks here if needed
    # For now, just a small delay to ensure system is ready
    time.sleep(1)
    logger.info("Dependencies check completed")

def main():
    """Main startup function"""
    try:
        logger.info("Starting Face Recognition Attendance System...")
        
        # Ensure directories exist
        ensure_directories()
        
        # Wait for dependencies
        wait_for_dependencies()
        
        # Import and initialize database
        from db import init_db
        init_db()
        logger.info("Database initialized successfully")
        
        # Import and initialize face recognition
        try:
            from models.face_recognition import FaceRecognitionModel
            model = FaceRecognitionModel()
            logger.info("Face recognition model loaded successfully")
        except Exception as e:
            logger.warning(f"Face recognition model not loaded: {e}")
        
        logger.info("Startup completed successfully")
        
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise

if __name__ == "__main__":
    main()
