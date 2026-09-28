import logging
from sqlalchemy.orm import Session
from app.database import SessionLocal, init_db
from app.models import LGA, Ward, PollingUnit, User, Party, Incident, ElectionResult, ElectionResultVote, VoteResult, Election
from app.security import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_live")

OFFICIAL_PARTIES = [
    {
        "name": "Peoples Democratic Party",
        "abbreviation": "PDP",
        "color": "#008751",
        "logo_url": "/parties/pdp.png",
        "is_active": True,
    },
    {
        "name": "All Progressives Congress",
        "abbreviation": "APC",
        "color": "#3B82F6",
        "logo_url": "/parties/apc.png",
        "is_active": True,
    },
    {
        "name": "New Nigeria Peoples Party",
        "abbreviation": "NNPP",
        "color": "#EF4444",
        "logo_url": "/parties/nnpp.png",
        "is_active": True,
    },
    {
        "name": "Labour Party",
        "abbreviation": "LP",
        "color": "#8B5CF6",
        "logo_url": "/parties/lp.png",
        "is_active": True,
    },
    {
        "name": "African Democratic Congress",
        "abbreviation": "ADC",
        "color": "#F59E0B",
        "logo_url": "/parties/adc.png",
        "is_active": True,
    },
    {
        "name": "All Progressives Grand Alliance",
        "abbreviation": "APGA",
        "color": "#10B981",
        "logo_url": "/parties/apga.png",
        "is_active": True,
    },
    {
        "name": "Social Democratic Party",
        "abbreviation": "SDP",
        "color": "#EC4899",
        "logo_url": "/parties/sdp.png",
        "is_active": True,
    },
]

def clean_and_seed_live_database():
    init_db()
    db: Session = SessionLocal()
    try:
        # 1. Purge simulated mock results
        logger.info("Purging simulated results...")
        db.query(ElectionResultVote).delete()
        db.query(ElectionResult).delete()
        db.query(VoteResult).delete()
        
        # 2. Purge simulated incidents
        logger.info("Purging simulated field incidents...")
        db.query(Incident).delete()
        
        # 3. Purge dummy auto-generated test agents (agent_1_1_1, etc.)
        logger.info("Purging auto-generated dummy agents...")
        db.query(User).filter(User.username.like("agent_%_%")).delete(synchronize_session=False)

        # 4. Ensure Super Admin user exists with correct PDP-ADMIN-2027 password
        admin = db.query(User).filter(User.username == "admin").first()
        admin_pass_hash = get_password_hash("PDP-ADMIN-2027")
        if admin:
            admin.full_name = "Super Administrator"
            admin.role = "Super Admin"
            admin.hashed_password = admin_pass_hash
            admin.is_active = True
            logger.info("Updated existing admin user credentials to PDP-ADMIN-2027")
        else:
            admin = User(
                full_name="Super Administrator",
                username="admin",
                hashed_password=admin_pass_hash,
                role="Super Admin",
                is_active=True,
            )
            db.add(admin)
            logger.info("Created primary Super Admin user (admin / PDP-ADMIN-2027)")

        # 5. Ensure all wards are authentic INEC wards and no duplicates exist
        from app.migrate_real_wards import migrate_wards
        migrate_wards(db=db)

        # 6. Seed official political parties
        logger.info("Seeding official INEC registered political parties...")
        for p_data in OFFICIAL_PARTIES:
            existing = db.query(Party).filter(
                (Party.abbreviation == p_data["abbreviation"]) | (Party.name == p_data["name"])
            ).first()
            if not existing:
                party = Party(
                    name=p_data["name"],
                    abbreviation=p_data["abbreviation"],
                    color=p_data["color"],
                    logo_url=p_data["logo_url"],
                    is_active=p_data["is_active"]
                )
                db.add(party)
            else:
                existing.color = p_data["color"]
                existing.is_active = p_data["is_active"]

        db.commit()

        # 6. Report live database summary
        lgas_count = db.query(LGA).count()
        wards_count = db.query(Ward).count()
        pus_count = db.query(PollingUnit).count()
        parties_count = db.query(Party).count()
        users_count = db.query(User).count()
        results_count = db.query(ElectionResult).count()
        incidents_count = db.query(Incident).count()

        print("\n================ LIVE DATABASE AUDIT ================")
        print(f"✓ Real LGAs:           {lgas_count} (All Jigawa LGAs)")
        print(f"✓ Real Wards:          {wards_count} (All Electoral Wards)")
        print(f"✓ Real Polling Units:  {pus_count} (Official PU Inventory)")
        print(f"✓ Official Parties:    {parties_count} (PDP, APC, NNPP, LP, etc.)")
        print(f"✓ Active Users:        {users_count} (Administrative & Staff)")
        print(f"✓ Real Live Results:   {results_count} (Awaiting Live Collation)")
        print(f"✓ Real Live Incidents: {incidents_count} (Awaiting Live Field Reports)")
        print("✓ Super Admin Login:   username='admin', password='PDP-ADMIN-2027'")
        print("=====================================================\n")

    except Exception as e:
        db.rollback()
        logger.error(f"Error during clean slate initialization: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    clean_and_seed_live_database()
