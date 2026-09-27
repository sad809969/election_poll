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
        # Create all tables on current session bind or engine
        Base.metadata.create_all(bind=db.get_bind() if db else engine)


        # Check if admin exists
        admin = db.query(User).filter(User.username == "admin").first()

        if admin:
            admin.full_name = "Super Administrator"
            admin.hashed_password = get_password_hash("PDP-ADMIN-2027")
            admin.role = "Super Admin"
            admin.is_active = True

            db.commit()

            print("Admin account updated.")
            logger.info("Admin account updated.")

        else:
            admin = User(
                full_name="Super Administrator",
                username="admin",
                hashed_password=get_password_hash("PDP-ADMIN-2027"),
                role="Super Admin",
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

        # Ensure friendly demo polling unit agent exists
        agent = db.query(User).filter(User.username == "agent").first()
        if not agent:
            agent = User(
                full_name="Ibrahim Suleiman (Agent)",
                username="agent",
                phone_number="08012345678",
                hashed_password=get_password_hash("agent123"),
                role="Polling Unit Agent",
                is_active=True,
                lga_id=1,
                ward_id=1,
                polling_unit_id=1,
            )
            db.add(agent)
            db.commit()
            db.refresh(agent)
            logger.info("Demo agent (agent/agent123) seeded.")
        else:
            agent.hashed_password = get_password_hash("agent123")
            agent.phone_number = "08012345678"
            agent.is_active = True
            db.commit()

        # Seed Situation Room & Field Coordinator Accounts
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
            else:
                u.hashed_password = get_password_hash(acc["password"])
                u.role = acc["role"]
                u.is_active = True
        db.commit()
        logger.info("Situation Room coordinator and analyst accounts seeded.")

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
        print("Seeded 27 Jigawa LGAs.")

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
                                hashed_password=get_password_hash("agent123"),
                                role="Polling Unit Agent",
                                polling_unit_id=pu.id,
                                lga_id=lga.id,
                                ward_id=ward.id
                            )
                            db.add(agent)
                            db.commit()
                            db.refresh(agent)

                        # Dummy VoteResult and Incident generation removed for real live operations.
                        pass

        print("Successfully seeded all 27 Jigawa State LGAs, Wards, and Polling Units (0 dummy results, 0 dummy incidents)!")

    except Exception as e:
        db.rollback()
        print(f"Database seed failed: {e}")
        logger.error(e)

    finally:
        if close_session:
            db.close()


if __name__ == "__main__":
    seed_database()