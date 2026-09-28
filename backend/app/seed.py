import logging
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import SessionLocal, engine
from app.models import Base, LGA, PollingUnit, User, Ward
from app.core.security import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Development-only credentials. Never created when ENVIRONMENT=production.
DEMO_ADMIN_PASSWORD = "PDP-ADMIN-2027"
DEMO_AGENT_PASSWORD = "agent123"


def seed_database(db: Session = None):
    """
    Idempotent startup seed.

    - Always ensures an "admin" account exists (created once, never reset).
    - Demo accounts and generated electoral data are only seeded when
      settings.seed_demo_data is on (development default, never production).

    Existing accounts are never modified, so passwords changed by an
    administrator survive restarts.
    """
    close_session = False

    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        Base.metadata.create_all(bind=db.get_bind() if db else engine)

        _ensure_admin(db)

        # LGAs and INEC wards are real reference data, seeded in every
        # environment. Polling units are generated placeholders (random
        # registered-voter counts and coordinates), so only in demo mode;
        # production must import the official INEC polling unit register.
        _seed_electoral_structure(db)

        if settings.seed_demo_data:
            # Polling units first: demo accounts are linked to them.
            _seed_demo_polling_units(db)
            _seed_demo_accounts(db)

        _refresh_polling_unit_counts(db)

    except Exception as e:
        db.rollback()
        logger.error("Database seed failed: %s", e)

    finally:
        if close_session:
            db.close()


def _ensure_admin(db: Session):
    if db.query(User).filter(User.username == "admin").first():
        return

    password = settings.ADMIN_INITIAL_PASSWORD
    if password is None and not settings.is_production:
        password = DEMO_ADMIN_PASSWORD
    if password is None:
        logger.warning(
            "No admin account exists. Set ADMIN_INITIAL_PASSWORD to create one."
        )
        return

    db.add(
        User(
            full_name="Super Administrator",
            username="admin",
            hashed_password=get_password_hash(password),
            role="Super Admin",
            is_active=True,
        )
    )
    db.commit()
    logger.info("Initial admin account created.")


def _seed_demo_accounts(db: Session):
    if not db.query(User).filter(User.username == "agent").first():
        db.add(
            User(
                full_name="Ibrahim Suleiman (Agent)",
                username="agent",
                phone_number="08012345678",
                hashed_password=get_password_hash(DEMO_AGENT_PASSWORD),
                role="Polling Unit Agent",
                is_active=True,
            )
        )
        db.commit()
        logger.info("Demo agent account seeded.")

    # Link the demo agent to the first polling unit if not yet assigned.
    first_pu = db.query(PollingUnit).order_by(PollingUnit.id).first()
    demo_agent = db.query(User).filter(User.username == "agent").first()
    if first_pu and demo_agent and not demo_agent.polling_unit_id:
        demo_agent.polling_unit_id = first_pu.id
        demo_agent.lga_id = first_pu.lga_id
        demo_agent.ward_id = first_pu.ward_id
        db.commit()

    coordinator_accounts = [
        {
            "full_name": "Engr. Kabir Dangalan (State Coordinator)",
            "username": "state_coord",
            "password": "coord123",
            "role": "State Coordinator",
            "phone_number": "08031112233",
        },
        {
            "full_name": "Hon. Mustapha Kiyawa (LGA Coordinator - Dutse)",
            "username": "lga_dutse",
            "password": "coord123",
            "role": "LGA Coordinator",
            "phone_number": "08032223344",
            "lga_id": 1,
        },
        {
            "full_name": "Malam Bello Danladi (Ward Coordinator - Dutse Central)",
            "username": "ward_dutse_1",
            "password": "coord123",
            "role": "Ward Coordinator",
            "phone_number": "08033334455",
            "lga_id": 1,
            "ward_id": 1,
        },
        {
            "full_name": "Dr. Aisha Garba (Data Analyst)",
            "username": "analyst",
            "password": "analyst123",
            "role": "Situation Room Officer",
            "phone_number": "08034445566",
        },
        {
            "full_name": "Alhaji Suleiman Observer (VIP Observer)",
            "username": "observer",
            "password": "observer123",
            "role": "Observer",
            "phone_number": "08035556677",
        },
    ]

    for acc in coordinator_accounts:
        u = db.query(User).filter(User.username == acc["username"]).first()
        if not u:
            u = User(
                full_name=acc["full_name"],
                username=acc["username"],
                phone_number=acc.get("phone_number"),
                hashed_password=get_password_hash(acc["password"]),
                role=acc["role"],
                is_active=True,
                lga_id=acc.get("lga_id"),
                ward_id=acc.get("ward_id"),
            )
            db.add(u)
    db.commit()
    logger.info("Situation Room coordinator and analyst accounts seeded.")



def _seed_electoral_structure(db: Session):
    """All 27 Jigawa LGAs and their authentic INEC electoral wards."""
    from app.seed_full import KNOWN_WARDS

    jigawa_lgas = [
        ("Dutse", "DUT"), ("Hadejia", "HAD"), ("Gumel", "GUM"), ("Kazaure", "KAZ"), 
        ("Ringim", "RIN"), ("Birnin Kudu", "BKU"), ("Babura", "BAB"), ("Jahun", "JAH"), 
        ("Guri", "GUR"), ("Kaugama", "KAU"), ("Kiyawa", "KIY"), ("Buji", "BUJ"), 
        ("Gwaram", "GWA"), ("Gwiwa", "GWI"), ("Yankwashi", "YAN"), ("Roni", "RON"), 
        ("Sule Tankarkar", "SUL"), ("Taura", "TAU"), ("Maigatari", "MAI"), ("Miga", "MIG"), 
        ("Malam Madori", "MAD"), ("Kafin Hausa", "KAF"), ("Kirikasamma", "KIR"), 
        ("Auyo", "AUY"), ("Birniwa", "BIR"), ("Gagarawa", "GAG"), ("Garki", "GAR")
    ]

    for name, code in jigawa_lgas:
        if not db.query(LGA).filter(LGA.name == name).first():
            db.add(LGA(name=name, code=code, registered_voters=25000, total_polling_units=180))
    db.commit()

    for lga in db.query(LGA).all():
        for w_idx, ward_name in enumerate(KNOWN_WARDS.get(lga.name, []), start=1):
            ward_code = f"{lga.code}-W{w_idx:02d}"
            existing = (
                db.query(Ward)
                .filter(
                    Ward.lga_id == lga.id,
                    (Ward.code == ward_code) | (Ward.name == ward_name),
                )
                .first()
            )
            if not existing:
                db.add(Ward(lga_id=lga.id, name=ward_name, code=ward_code))
    db.commit()


def _seed_demo_polling_units(db: Session):
    """
    Generate 4,827 placeholder polling units spread across the INEC wards.

    Codes, registered-voter counts and coordinates are generated, not
    official. No results or incidents are created.
    """
    if db.query(PollingUnit).count() > 0:
        return

    import random
    from app.seed_full import JIGAWA_LGAS

    lga_info_map = {l["name"]: l for l in JIGAWA_LGAS}
    all_wards = db.query(Ward).join(LGA).order_by(LGA.id, Ward.id).all()
    if not all_wards:
        return

    total_target_pus = 4827
    pus_per_ward = total_target_pus // len(all_wards)
    remainder = total_target_pus % len(all_wards)

    pu_counter = 0
    for idx, ward in enumerate(all_wards):
        lga_info = lga_info_map.get(ward.lga.name, {"code": ward.lga.code, "lat": 11.7594, "lon": 9.3390})
        num_pus = pus_per_ward + (1 if idx < remainder else 0)
        w_code = ward.code.split("-")[-1] if "-" in ward.code else f"W{idx+1:02d}"
        w_num = w_code.replace("W", "")

        for p_idx in range(1, num_pus + 1):
            pu_counter += 1
            pu_code = f"{lga_info['code']}-{w_num}{p_idx:02d}"
            lat = round(lga_info.get("lat", 11.7594) + random.gauss(0, 0.045), 6)
            lon = round(lga_info.get("lon", 9.3390) + random.gauss(0, 0.045), 6)

            db.add(
                PollingUnit(
                    lga_id=ward.lga_id,
                    ward_id=ward.id,
                    code=pu_code,
                    name=f"{pu_code} - {ward.name} Unit {p_idx}",
                    status="Normal",
                    registered_voters=random.randint(480, 850),
                    latitude=max(11.05, min(13.00, lat)),
                    longitude=max(8.05, min(10.55, lon)),
                )
            )

        if idx % 25 == 0:
            db.commit()

    db.commit()
    logger.info("Demo polling units seeded: %s (no results, no incidents).", pu_counter)


def _refresh_polling_unit_counts(db: Session):
    for lga in db.query(LGA).all():
        lga.total_polling_units = db.query(PollingUnit).filter(PollingUnit.lga_id == lga.id).count()
    for ward in db.query(Ward).all():
        ward.total_polling_units = db.query(PollingUnit).filter(PollingUnit.ward_id == ward.id).count()
    db.commit()


if __name__ == "__main__":
    seed_database()
