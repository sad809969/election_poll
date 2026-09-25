import logging
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import SessionLocal, engine
from app.models import Base, User
from app.core.security import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Development-only credentials. Never created when ENVIRONMENT=production.
DEMO_ADMIN_PASSWORD = "admin1283"
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

        if settings.seed_demo_data:
            # Electoral data first: demo accounts reference LGA/ward/PU ids.
            _seed_demo_electoral_data(db)
            _seed_demo_accounts(db)

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
            full_name="System Administrator",
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
                lga_id=1,
                ward_id=1,
                polling_unit_id=1,
            )
        )
        db.commit()
        logger.info("Demo agent account seeded.")

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


def _seed_demo_electoral_data(db: Session):
    # Seed all 27 Jigawa LGAs
    jigawa_lgas = [
        ("Dutse", "DUT"), ("Hadejia", "HAD"), ("Gumel", "GUM"), ("Kazaure", "KAZ"), 
        ("Ringim", "RIN"), ("Birnin Kudu", "BKU"), ("Babura", "BAB"), ("Jahun", "JAH"), 
        ("Guri", "GUR"), ("Kaugama", "KAU"), ("Kiyawa", "KIY"), ("Buji", "BUJ"), 
        ("Gwaram", "GWA"), ("Gwiwa", "GWI"), ("Yankwashi", "YAN"), ("Roni", "RON"), 
        ("Sule Tankarkar", "SUL"), ("Taura", "TAU"), ("Maigatari", "MAI"), ("Miga", "MIG"), 
        ("Malam Madori", "MAD"), ("Kafin Hausa", "KAF"), ("Kirikasamma", "KIR"), 
        ("Auyo", "AUY"), ("Birniwa", "BIR"), ("Gagarawa", "GAG"), ("Garki", "GAR")
    ]

    from app.models import LGA
    for name, code in jigawa_lgas:
        exists = db.query(LGA).filter(LGA.name == name).first()
        if not exists:
            lga_obj = LGA(name=name, code=code, registered_voters=25000, total_polling_units=180)
            db.add(lga_obj)
    db.commit()

    # Comprehensive Seeding Across ALL 27 Jigawa LGAs
    from app.models import Ward, PollingUnit, Incident, VoteResult

    all_lgas = db.query(LGA).all()
    statuses = ["Normal", "Normal", "Normal", "Attention", "Normal", "Critical", "Normal"]
    categories = ["BVAS Issues", "Late Officials", "Minor Crowd", "Intimidation", "Vote Buying", "Ballot Shortage"]

    for index, lga in enumerate(all_lgas):
        for w_idx in [1, 2]:
            ward_name = f"{lga.name} Ward {w_idx}"
            ward = db.query(Ward).filter(Ward.lga_id == lga.id, Ward.name == ward_name).first()
            if not ward:
                ward = Ward(lga_id=lga.id, name=ward_name, code=f"{lga.code}-W{w_idx}")
                db.add(ward)
                db.commit()
                db.refresh(ward)

            for p_idx in [1, 2]:
                pu_code = f"{lga.code}-{w_idx:02d}{p_idx:02d}"
                pu_name = f"{pu_code} - {ward_name} Unit {p_idx}"
                status = statuses[(index + w_idx + p_idx) % len(statuses)]
                registered = 500 + ((index * 37 + w_idx * 13 + p_idx * 7) % 450)

                pu = db.query(PollingUnit).filter(PollingUnit.code == pu_code).first()
                if not pu:
                    pu = PollingUnit(
                        lga_id=lga.id,
                        ward_id=ward.id,
                        code=pu_code,
                        name=pu_name,
                        status=status,
                        registered_voters=registered,
                        latitude=11.7 + (index * 0.03),
                        longitude=9.3 + (w_idx * 0.02)
                    )
                    db.add(pu)
                    db.commit()
                    db.refresh(pu)

                    # Agent User
                    agent_uname = f"agent_{lga.code.lower()}_w{w_idx}_p{p_idx}"
                    agent = db.query(User).filter(User.username == agent_uname).first()
                    if not agent:
                        agent = User(
                            full_name=f"Agent {lga.name} W{w_idx}P{p_idx}",
                            username=agent_uname,
                            hashed_password=get_password_hash(DEMO_AGENT_PASSWORD),
                            role="Polling Unit Agent",
                            polling_unit_id=pu.id,
                            lga_id=lga.id,
                            ward_id=ward.id
                        )
                        db.add(agent)
                        db.commit()
                        db.refresh(agent)

                    # Form EC8A Vote Results
                    pdp = 210 + ((index * 19 + w_idx * 11 + p_idx * 5) % 160)
                    apc = 160 + ((index * 13 + w_idx * 7 + p_idx * 3) % 110)
                    nnpp = 35 + ((index * 5 + w_idx * 3) % 45)
                    lp = 12 + ((index * 3) % 25)
                    rejected = 8 + (index % 10)

                    res_exist = db.query(VoteResult).filter(VoteResult.polling_unit_id == pu.id).first()
                    if not res_exist:
                        total_valid = pdp + apc + nnpp + lp + 5
                        total_cast = total_valid + rejected
                        is_overvote = total_cast > pu.registered_voters
                        flagged_status = "FLAGGED" if (is_overvote or status == "Critical") else ("PENDING_PHOTO" if status == "Attention" else "VERIFIED")
                        result = VoteResult(
                            polling_unit_id=pu.id,
                            agent_id=agent.id,
                            pdp_votes=pdp,
                            apc_votes=apc,
                            nnpp_votes=nnpp,
                            lp_votes=lp,
                            others_votes=5,
                            rejected_votes=rejected,
                            total_valid_votes=total_valid,
                            total_votes_cast=total_cast,
                            verification_status=flagged_status,
                            notes=f"[ALERT] Over-voting: {total_cast} vs {pu.registered_voters}" if is_overvote else None
                        )
                        db.add(result)
                        db.commit()

                    # Seed Incidents for Attention/Critical PUs
                    if status in ["Attention", "Critical"]:
                        inc_exist = db.query(Incident).filter(Incident.polling_unit_id == pu.id).first()
                        if not inc_exist:
                            inc = Incident(
                                polling_unit_id=pu.id,
                                reported_by=agent.id,
                                incident_type=categories[index % len(categories)],
                                severity="CRITICAL" if status == "Critical" else "MEDIUM",
                                description=f"{categories[index % len(categories)]} reported at {pu_name}. Field intervention in progress.",
                                status="INVESTIGATING" if status == "Attention" else "REPORTED",
                                latitude=11.7 + (index * 0.03),
                                longitude=9.3 + (w_idx * 0.02)
                            )
                            db.add(inc)
                            db.commit()

    logger.info("Demo electoral data seeded.")


if __name__ == "__main__":
    seed_database()
