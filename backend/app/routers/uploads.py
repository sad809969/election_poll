from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from typing import Optional
from pydantic import BaseModel

from app.models import User
from app.core.permissions import require_agent
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
async def upload_file(
    file: UploadFile = File(...),
    subfolder: str = Form("results"),
    current_user: User = Depends(require_agent),
):
    """
    Accepts multipart form-data image/document file, validates MIME type and size,
    and stores safely on server storage under /uploads/{subfolder}/.
    Returns direct URL and relative path.
    """
    allowed_subfolders = {"results", "incidents", "evidence", "avatars"}
    clean_subfolder = subfolder.strip().lower()
    if clean_subfolder not in allowed_subfolders:
        clean_subfolder = "results"

    try:
        relative_path = await upload_service.save_uploaded_file(file, subfolder=clean_subfolder)
        url = f"/uploads/{relative_path}"
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
