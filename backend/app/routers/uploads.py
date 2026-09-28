from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from typing import Optional
from pydantic import BaseModel

from app.models import User
from app.core.permissions import require_agent
from app.core.config import settings
from app.services.upload_service import upload_service

router = APIRouter(
    prefix="/upload",
    tags=["Uploads"],
)

class UploadResponse(BaseModel):
    url: str
    relative_path: str
    filename: Optional[str] = None
    subfolder: str

@router.post("", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
def upload_file(
    file: UploadFile = File(...),
    subfolder: str = Form("results"),
    current_user: User = Depends(require_agent),
):
    """
    Accepts multipart form-data image/document file, validates MIME type and size,
    and stores safely on server storage under /uploads/{subfolder}/.
    Returns direct URL and relative path.
    """
    # Form EC8A result sheets go through POST /results/{id}/ec8a-photo so they
    # are tied to a result and enter Situation Room review.
    allowed_subfolders = {"incidents", "evidence", "avatars"}
    clean_subfolder = subfolder.strip().lower()
    if clean_subfolder not in allowed_subfolders:
        clean_subfolder = "evidence"

    try:
        relative_path = upload_service.save_image(file, subfolder=clean_subfolder)
        url = f"{settings.API_V1_STR}/uploads/{relative_path}"
        return UploadResponse(
            url=url,
            relative_path=relative_path,
            filename=file.filename,
            subfolder=clean_subfolder,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}",
        )
