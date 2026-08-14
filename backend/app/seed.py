import logging
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine
from app.models import Base, User
from app.core.security import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_database(db: Session = None):
    close_session = False

    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)

        # Check if admin exists
        admin = db.query(User).filter(User.username == "admin").first()

        if admin:
            admin.full_name = "System Administrator"
            admin.hashed_password = get_password_hash("admin1283")
            admin.role = "SUPER_ADMIN"
            admin.is_active = True

            db.commit()

            print("Admin account updated.")
            logger.info("Admin account updated.")

        else:
            admin = User(
                full_name="System Administrator",
                username="admin",
                hashed_password=get_password_hash("admin1283"),
                role="SUPER_ADMIN",
                is_active=True,
                phone_number=None,
                lga_id=None,
                ward_id=None,
                polling_unit_id=None,
            )

            db.add(admin)
            db.commit()
            db.refresh(admin)

            print("Default admin created.")
            logger.info("Default admin created.")

    except Exception as e:
        db.rollback()
        print(f"Database seed failed: {e}")
        logger.error(e)

    finally:
        if close_session:
            db.close()


if __name__ == "__main__":
    seed_database()