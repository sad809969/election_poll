from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models import Result, PollingUnit  # Ensure models exist in your app/models.py


class VoteService:
    @staticmethod
    def submit_polling_unit_results(
        db: Session,
        polling_unit_id: int,
        agent_id: int,
        party_scores: dict,
        result_image_url: str = None
    ):
        """
        Validates and processes election result submissions from polling units.
        """
        # 1. Verify Polling Unit exists
        pu = db.query(PollingUnit).filter(PollingUnit.id == polling_unit_id).first()
        if not pu:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Polling unit ID {polling_unit_id} not found."
            )

        # 2. Check for duplicate submissions if single submission rule applies
        existing_result = db.query(Result).filter(Result.polling_unit_id == polling_unit_id).first()
        if existing_result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Results for this polling unit have already been submitted."
            )

        # 3. Create Result Record
        new_result = Result(
            polling_unit_id=polling_unit_id,
            submitted_by=agent_id,
            scores=party_scores,
            image_url=result_image_url,
            is_verified=False
        )

        db.add(new_result)
        db.commit()
        db.refresh(new_result)

        return new_result


vote_service = VoteService()