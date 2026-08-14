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

        # Seed all 27 Jigawa LGAs
        jigawa_lgas = [
            ("Dutse", "DUT"), ("Hadejia", "HAD"), ("Gumel", "GUM"), ("Kazaure", "KAZ"), 
            ("Ringim", "RIN"), ("Birnin Kudu", "BKU"), ("Babura", "BAB"), ("Jahun", "JAH"), 
            ("Guri", "GUR"), ("Kaugama", "KAU"), ("Kiyawa", "KIY"), ("Buji", "BUJ"), 
            ("Gwaram", "GWA"), ("Gwiwa", "GWI"), ("Yankwashi", "YAN"), ("Roni", "RON"), 
            ("Sule Tankarkar", "SUL"), ("Taura", "TAU"), ("Maigatari", "MAI"), ("Miga", "MIG"), 
            ("Malam Madori", "MAD"), ("Kafin Hausa", "KAF"), ("Kirikasamma", "KIR"), 
            ("Auyo", "AUY"), ("Birniwa", "BIR"), ("Gagarawa", "GAG"), ("Gwaram Central", "GWC")
        ]

        from app.models import LGA
        for name, code in jigawa_lgas:
            exists = db.query(LGA).filter(LGA.name == name).first()
            if not exists:
                lga_obj = LGA(name=name, code=code, registered_voters=25000, total_polling_units=180)
                db.add(lga_obj)
        db.commit()
        print("Seeded 27 Jigawa LGAs.")

        # Seed sample Wards & Polling Units
        from app.models import Ward, PollingUnit, Incident, VoteResult

        dutse_lga = db.query(LGA).filter(LGA.name == "Dutse").first()
        guri_lga = db.query(LGA).filter(LGA.name == "Guri").first()
        gumel_lga = db.query(LGA).filter(LGA.name == "Gumel").first()
        hadejia_lga = db.query(LGA).filter(LGA.name == "Hadejia").first()
        jahun_lga = db.query(LGA).filter(LGA.name == "Jahun").first()
        kazaure_lga = db.query(LGA).filter(LGA.name == "Kazaure").first()
        kaugama_lga = db.query(LGA).filter(LGA.name == "Kaugama").first()

        sample_wards_pus = [
            (guri_lga, "Guri Ward A", "PU 023", "PU 023 - Guri Ward A", "Attention", 650, 245, 198, 45, 12, "Agent Murtala"),
            (gumel_lga, "Gumel Central", "PU 078", "PU 078 - Gumel Central", "Normal", 580, 233, 176, 35, 10, "Agent Aisha"),
            (hadejia_lga, "Hadejia Ward B", "PU 105", "PU 105 - Hadejia Ward B", "Normal", 620, 198, 154, 28, 8, "Agent Sani"),
            (jahun_lga, "Jahun Ward A", "PU 002", "PU 002 - Jahun Ward A", "Critical", 710, 187, 143, 50, 15, "Agent Usman"),
            (kazaure_lga, "Kazaure Ward C", "PU 056", "PU 056 - Kazaure Ward C", "Normal", 520, 176, 132, 20, 5, "Agent Yusuf"),
            (kaugama_lga, "Kaugama Ward 1", "PU 012", "PU 012 - Kaugama Ward 1", "Normal", 600, 210, 160, 30, 7, "Agent Musa"),
            (dutse_lga, "Limawa Ward", "PU 001", "PU 001 - Limawa Ward", "Normal", 800, 310, 220, 40, 15, "Agent Ibrahim"),
        ]

        for lga, ward_name, pu_code, pu_name, status, registered, pdp, apc, nnpp, lp, agent_name in sample_wards_pus:
            if not lga:
                continue
            ward = db.query(Ward).filter(Ward.lga_id == lga.id, Ward.name == ward_name).first()
            if not ward:
                ward = Ward(lga_id=lga.id, name=ward_name, code=f"{lga.code}-W1")
                db.add(ward)
                db.commit()
                db.refresh(ward)

            pu = db.query(PollingUnit).filter(PollingUnit.code == pu_code).first()
            if not pu:
                pu = PollingUnit(
                    lga_id=lga.id,
                    ward_id=ward.id,
                    code=pu_code,
                    name=pu_name,
                    status=status,
                    registered_voters=registered,
                    latitude=11.7,
                    longitude=9.3
                )
                db.add(pu)
                db.commit()
                db.refresh(pu)

                # Seed Agent user
                agent = User(
                    full_name=agent_name,
                    username=f"agent_{pu_code.lower().replace(' ', '')}",
                    hashed_password=get_password_hash("agent123"),
                    role="Polling Unit Agent",
                    polling_unit_id=pu.id,
                    lga_id=lga.id,
                    ward_id=ward.id
                )
                db.add(agent)
                db.commit()
                db.refresh(agent)

                # Seed Vote Result (Form EC8A)
                total_valid = pdp + apc + nnpp + lp
                result = VoteResult(
                    polling_unit_id=pu.id,
                    agent_id=agent.id,
                    pdp_votes=pdp,
                    apc_votes=apc,
                    nnpp_votes=nnpp,
                    lp_votes=lp,
                    others_votes=5,
                    rejected_votes=10,
                    total_valid_votes=total_valid + 5,
                    total_votes_cast=total_valid + 15,
                    verification_status="VERIFIED" if status == "Normal" else "FLAGGED"
                )
                db.add(result)
                db.commit()

        # Seed sample incidents
        pu_critical = db.query(PollingUnit).filter(PollingUnit.code == "PU 002").first()
        admin_user = db.query(User).filter(User.username == "admin").first()

        if pu_critical and admin_user:
            existing_inc = db.query(Incident).filter(Incident.polling_unit_id == pu_critical.id).first()
            if not existing_inc:
                inc = Incident(
                    polling_unit_id=pu_critical.id,
                    reported_by=admin_user.id,
                    incident_type="Violence",
                    severity="CRITICAL",
                    description="Clash between party supporters near polling booth. Security intervention requested.",
                    status="REPORTED",
                    latitude=11.7,
                    longitude=9.3
                )
                db.add(inc)
                db.commit()

        print("Seeded sample Wards, Polling Units, Agents, Results, and Incidents successfully.")

    except Exception as e:
        db.rollback()
        print(f"Database seed failed: {e}")
        logger.error(e)

    finally:
        if close_session:
            db.close()


if __name__ == "__main__":
    seed_database()