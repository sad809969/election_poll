import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

# Allowed file formats for result sheets and incident evidence
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf", ".webp"}
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
}


class UploadService:
    def __init__(self, upload_dir: str = getattr(settings, "UPLOAD_DIR", "uploads")):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        # Default 5MB max file size
        self.max_file_size = getattr(settings, "MAX_FILE_SIZE_MB", 5) * 1024 * 1024

    async def save_uploaded_file(self, file: UploadFile, subfolder: str = "results") -> str:
        """
        Validates and saves an uploaded file safely.
        Returns the relative file path for storing in the database.
        """
        # 1. Validate File Extension
        file_ext = Path(file.filename or "").suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type '{file_ext}'. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # 2. Validate MIME Type
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid MIME type '{file.content_type}'."
            )

        # 3. Read & Validate File Size
        contents = await file.read()
        if len(contents) > self.max_file_size:
            max_mb = self.max_file_size / (1024 * 1024)
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum limit of {max_mb:.1f}MB."
            )

        # 4. Generate Unique Filename to prevent overwrite collisions
        unique_filename = f"{uuid.uuid4().hex}{file_ext}"
        target_dir = self.upload_dir / subfolder
        target_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = target_dir / unique_filename

        # 5. Save File to Disk
        try:
            with open(file_path, "wb") as f:
                f.write(contents)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to write file to storage."
            ) from e

        # Return relative path (e.g., 'uploads/results/a1b2c3d4.jpg')
        return str(Path(subfolder) / unique_filename)


upload_service = UploadService()