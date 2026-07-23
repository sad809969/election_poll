from datetime import datetime
from sqlalchemy.orm import Session
from app.database import sync_engine, Base, SyncSessionLocal
from app.models import User, LGA, Ward, PollingUnit, Incident, VoteResult, Announcement, UserRole, IncidentSeverity, IncidentStatus
from app.security import get_password_hash

JIGAWA_LGAS = [
    {"name": "Dutse", "code": "DT", "voters": 185000, "pus": 240},
    {"name": "Hadejia", "code": "HD", "voters": 162000, "pus": 210},
    {"name": "Gumel", "code": "GM", "voters": 140000, "pus": 180},
    {"name": "Kazaure", "code": "KZ", "voters": 155000, "pus": 195},
    {"name": "Ringim", "code": "RG", "voters": 138000, "pus": 175},
    {"name": "Birnin Kudu", "code": "BK", "voters": 172000, "pus": 225},
    {"name": "Babura", "code": "BB", "voters": 145000, "pus": 190},
    {"name": "Jahun", "code": "JH", "voters": 150000, "pus": 200},
    {"name": "Guri", "code": "GR", "voters": 110000, "pus": 145},
    {"name": "Kaugama", "code": "KG", "voters": 125000, "pus": 160},
    {"name": "Kiyawa", "code": "KY", "voters": 130000, "pus": 170},
    {"name": "Buji", "code": "BJ", "voters": 98000, "pus": 130},
    {"name": "Gwaram", "code": "GW", "voters": 165000, "pus": 215},
    {"name": "Gwiwa", "code": "GI", "voters": 92000, "pus": 120},
    {"name": "Yankwashi", "code": "YK", "voters": 78000, "pus": 105},
    {"name": "Roni", "code": "RN", "voters": 85000, "pus": 115},
    {"name": "Sule Tankarkar", "code": "ST", "voters": 120000, "pus": 155},
    {"name": "Taura", "code": "TR", "voters": 132000, "pus": 172},
    {"name": "Maigatari", "code": "MG", "voters": 115000, "pus": 150},
    {"name": "Miga", "code": "MI", "voters": 95000, "pus": 125},
    {"name": "Malam Madori", "code": "MM", "voters": 128000, "pus": 168},
    {"name": "Kafin Hausa", "code": "KH", "voters": 142000, "pus": 185},
    {"name": "Kirikasamma", "code": "KK", "voters": 105000, "pus": 140},
    {"name": "Auyo", "code": "AY", "voters": 112000, "pus": 148},
    {"name": "Birniwa", "code": "BW", "voters": 118000, "pus": 152},
    {"name": "Gagarawa", "code": "GG", "voters": 89000, "pus": 118},
    {"name": "Dutse Central", "code": "DC", "voters": 190000, "pus": 250},
]

def seed_database():
    Base.metadata.create_all(bind=sync_engine)
    db: Session = SyncSessionLocal()
    try:
        # Check if already seeded
        if db.query(LGA).count() > 0:
            print("Database already seeded.")
            return

        print("Seeding Jigawa State 27 LGAs...")
        lga_objects = []
        for item in JIGAWA_LGAS:
            lga = LGA(
                name=item["name"],
                code=item["code"],
                registered_voters=item["voters"],
                total_polling_units=item["pus"]
            )
            db.add(lga)
            lga_objects.append(lga)
        db.commit()

        # Seed sample Wards & Polling Units for key LGAs
        duts_lga = db.query(LGA).filter_by(name="Dutse").first()
        gumel_lga = db.query(LGA).filter_by(name="Gumel").first()
        hadejia_lga = db.query(LGA).filter_by(name="Hadejia").first()
        guri_lga = db.query(LGA).filter_by(name="Guri").first()
        kazaure_lga = db.query(LGA).filter_by(name="Kazaure").first()
        kaugama_lga = db.query(LGA).filter_by(name="Kaugama").first()
        jahun_lga = db.query(LGA).filter_by(name="Jahun").first()

        sample_wards = [
            (duts_lga.id, "Dutse Ward A", "DT-W1"),
            (duts_lga.id, "Dutse Ward B", "DT-W2"),
            (gumel_lga.id, "Gumel Central", "GM-W1"),
            (hadejia_lga.id, "Hadejia Ward B", "HD-W2"),
            (guri_lga.id, "Guri Ward A", "GR-W1"),
            (kazaure_lga.id, "Kazaure Ward C", "KZ-W3"),
            (kaugama_lga.id, "Kaugama Ward 1", "KG-W1"),
            (jahun_lga.id, "Jahun Ward A", "JH-W1"),
        ]

        ward_map = {}
        for lga_id, ward_name, ward_code in sample_wards:
            w = Ward(lga_id=lga_id, name=ward_name, code=ward_code, total_polling_units=15)
            db.add(w)
            db.flush()
            ward_map[ward_name] = w

        db.commit()

        # Seed Polling Units matching UI screenshots
        pus_data = [
            (guri_lga.id, ward_map["Guri Ward A"].id, "PU 023", "PU 023 - Guri Ward A", 27.02, 12.34, "Attention"),
            (gumel_lga.id, ward_map["Gumel Central"].id, "PU 078", "PU 078 - Gumel Central", 27.12, 12.45, "Normal"),
            (hadejia_lga.id, ward_map["Hadejia Ward B"].id, "PU 105", "PU 105 - Hadejia Ward B", 27.20, 12.50, "Normal"),
            (jahun_lga.id, ward_map["Jahun Ward A"].id, "PU 002", "PU 002 - Jahun Ward A", 27.05, 12.15, "Critical"),
            (kazaure_lga.id, ward_map["Kazaure Ward C"].id, "PU 056", "PU 056 - Kazaure Ward C", 27.30, 12.60, "Normal"),
            (kaugama_lga.id, ward_map["Kaugama Ward 1"].id, "PU 012", "PU 012 - Kaugama Ward 1", 27.40, 12.70, "Normal"),
        ]

        pu_objects = {}
        for lga_id, ward_id, code, name, lat, lng, status in pus_data:
            pu = PollingUnit(
                lga_id=lga_id,
                ward_id=ward_id,
                code=code,
                name=name,
                registered_voters=650,
                latitude=lat,
                longitude=lng,
                status=status
            )
            db.add(pu)
            db.flush()
            pu_objects[code] = pu
        db.commit()

        # Seed Default Users matching image 1 (Admin User Management)
        pass_hash = get_password_hash("password123")
        users_data = [
            ("Abdullahi Usman", "admin", UserRole.SUPER_ADMIN.value, "08031234567", None, None, None),
            ("Musa Kiyawa", "statechairman", UserRole.STATE_CHAIRMAN.value, "08029876543", None, None, None),
            ("Aliyu A. Babura", "dg", UserRole.DIRECTOR_GENERAL.value, "08065557788", None, None, None),
            ("Ibrahim B. Gumel", "lgacoord_gumel", UserRole.LGA_COORDINATOR.value, "07012345678", gumel_lga.id, None, None),
            ("Sani R. Hadejia", "wardcoord_02", UserRole.WARD_COORDINATOR.value, "08098765432", hadejia_lga.id, ward_map["Hadejia Ward B"].id, None),
            ("Murtala A.", "agent_pu_023", UserRole.POLLING_UNIT_AGENT.value, "08123456789", guri_lga.id, ward_map["Guri Ward A"].id, pu_objects["PU 023"].id),
            ("Aisha M.", "agent_pu_078", UserRole.POLLING_UNIT_AGENT.value, "08071112233", gumel_lga.id, ward_map["Gumel Central"].id, pu_objects["PU 078"].id),
            ("Yusuf Usman", "sroom_officer1", UserRole.SITUATION_ROOM_OFFICER.value, "08105551122", None, None, None),
        ]

        user_objs = {}
        for full_name, username, role, phone, lga_id, ward_id, pu_id in users_data:
            user = User(
                full_name=full_name,
                username=username,
                phone_number=phone,
                hashed_password=pass_hash,
                role=role,
                lga_id=lga_id,
                ward_id=ward_id,
                polling_unit_id=pu_id,
                last_login=datetime.utcnow()
            )
            db.add(user)
            db.flush()
            user_objs[username] = user
        db.commit()

        # Seed Sample Incidents
        incidents = [
            Incident(
                polling_unit_id=pu_objects["PU 002"].id,
                reported_by=user_objs["agent_pu_023"].id,
                incident_type="Violence",
                severity=IncidentSeverity.CRITICAL.value,
                description="Violence reported, situation tense near polling booth.",
                status=IncidentStatus.REPORTED.value,
                latitude=27.05,
                longitude=12.15
            ),
            Incident(
                polling_unit_id=pu_objects["PU 078"].id,
                reported_by=user_objs["agent_pu_078"].id,
                incident_type="BVAS Issues",
                severity=IncidentSeverity.MEDIUM.value,
                description="BVAS malfunction resolved by INEC technician.",
                status=IncidentStatus.RESOLVED.value,
                latitude=27.12,
                longitude=12.45
            ),
            Incident(
                polling_unit_id=pu_objects["PU 023"].id,
                reported_by=user_objs["agent_pu_023"].id,
                incident_type="Intimidation",
                severity=IncidentSeverity.HIGH.value,
                description="Minor crowd gathering at the unit perimeter.",
                status=IncidentStatus.INVESTIGATING.value,
                latitude=27.02,
                longitude=12.34
            )
        ]
        for inc in incidents:
            db.add(inc)
        db.commit()

        # Seed Sample Vote Results matching image 4 (Results Dashboard)
        results = [
            VoteResult(
                polling_unit_id=pu_objects["PU 023"].id,
                agent_id=user_objs["agent_pu_023"].id,
                pdp_votes=245,
                apc_votes=198,
                nnpp_votes=76,
                lp_votes=34,
                others_votes=12,
                total_valid_votes=565,
                rejected_votes=15,
                total_votes_cast=580,
                ec8a_photo_url="/uploads/ec8a_pu023.jpg",
                verification_status="VERIFIED"
            ),
            VoteResult(
                polling_unit_id=pu_objects["PU 078"].id,
                agent_id=user_objs["agent_pu_078"].id,
                pdp_votes=233,
                apc_votes=176,
                nnpp_votes=54,
                lp_votes=28,
                others_votes=9,
                total_valid_votes=500,
                rejected_votes=10,
                total_votes_cast=510,
                ec8a_photo_url="/uploads/ec8a_pu078.jpg",
                verification_status="VERIFIED"
            )
        ]
        for r in results:
            db.add(r)
        db.commit()

        # Seed Announcements matching image 3 (Communication Center)
        ann = Announcement(
            title="Election Day Guidelines",
            message="All agents must follow the guidelines and report every activity from accreditation to results collation.",
            sender_name="State Campaign Headquarters",
            urgency="Emergency",
            target_role="All",
            is_pinned=True
        )
        db.add(ann)
        db.commit()

        print("Jigawa PDP PollWatch seed complete!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
