import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

# Accepted evidence formats, keyed by extension, with the file signature
# ("magic bytes") the content must start with. Checking the signature stops
# arbitrary files being stored under an image extension.
SIGNATURES = {
    ".jpg": (b"\xff\xd8\xff",),
    ".jpeg": (b"\xff\xd8\xff",),
    ".png": (b"\x89PNG\r\n\x1a\n",),
    ".webp": (b"RIFF",),
}

CONTENT_TYPE_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


class UploadService:
    def __init__(self, upload_dir: str = settings.UPLOAD_DIR):
        self.upload_dir = Path(upload_dir)
        self.max_file_size = settings.MAX_UPLOAD_MB * 1024 * 1024

    def save_image(self, file: UploadFile, subfolder: str) -> str:
        """
        Validate and store an uploaded image under a random name.

        Returns the path relative to the upload directory,
        e.g. "results/3f2a....jpg".
        """
        ext = Path(file.filename or "").suffix.lower()
        if ext not in SIGNATURES:
            ext = CONTENT_TYPE_EXTENSIONS.get(file.content_type or "", "")
        if ext not in SIGNATURES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only JPEG, PNG or WEBP images are accepted.",
            )

        contents = file.file.read(self.max_file_size + 1)
        if len(contents) > self.max_file_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Image exceeds the {settings.MAX_UPLOAD_MB}MB limit.",
            )
        if not contents.startswith(SIGNATURES[ext]) or (
            ext == ".webp" and contents[8:12] != b"WEBP"
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File content is not a valid image.",
            )

        target_dir = self.upload_dir / subfolder
        target_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid.uuid4().hex}{ext}"

        try:
            (target_dir / filename).write_bytes(contents)
        except OSError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to store the uploaded image.",
            ) from e

        return f"{subfolder}/{filename}"


upload_service = UploadService()
