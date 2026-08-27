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

                        # Form EC8A Vote Results
                        pdp = 210 + ((index * 19 + w_idx * 11 + p_idx * 5) % 160)
                        apc = 160 + ((index * 13 + w_idx * 7 + p_idx * 3) % 110)
                        nnpp = 35 + ((index * 5 + w_idx * 3) % 45)
                        lp = 12 + ((index * 3) % 25)
                        rejected = 8 + (index % 10)

                        res_exist = db.query(VoteResult).filter(VoteResult.polling_unit_id == pu.id).first()
                        if not res_exist:
                            total_valid = pdp + apc + nnpp + lp
                            total_cast = total_valid + rejected
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
                                verification_status="VERIFIED" if status == "Normal" else ("FLAGGED" if status == "Critical" else "PENDING_PHOTO")
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

        print("Successfully seeded all 27 Jigawa State LGAs, Wards, Polling Units, Agents, Results, and Incidents!")

    except Exception as e:
        db.rollback()
        print(f"Database seed failed: {e}")
        logger.error(e)

    finally:
        if close_session:
            db.close()


if __name__ == "__main__":
    seed_database()