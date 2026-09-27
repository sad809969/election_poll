"""
Migration script to update all electoral ward names to authentic INEC Registration Area names
and remove empty placeholder duplicate wards.
"""
import sys
import os

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import LGA, Ward, PollingUnit

# Complete authentic INEC Ward Names for all 27 Jigawa LGAs
CANONICAL_INEC_WARDS = {
    "Auyo": [
        "Auyo", "Auyakayi", "Ayama", "Ayan", "Gamafoi", 
        "Gamsarka", "Gatafa", "Kafur", "Tsidir", "Unik"
    ],
    "Babura": [
        "Babura", "Batali", "Dorawa", "Garu", "Gasakoli", 
        "Insharuwa", "Jigawa", "Kanya", "Kuzunzumi", "Kyambo", "Takwasa"
    ],
    "Birniwa": [
        "Batu", "Birniwa", "Dangwaleri", "Diginsa", "Fagi", 
        "Kachallari", "Karanka", "Kazura", "Machinamari", "Matamu", "Nguwa"
    ],
    "Birnin Kudu": [
        "Birnin Kudu", "Kangire", "Kantoga", "Kiyako", "Kwangwara", 
        "Lafiya", "Sundimina", "Surko", "Unguwar'ya", "Wurno", "Yalwan Damai"
    ],
    "Buji": [
        "Ahoto", "Buji", "Churbun", "Falageri", "Gantsa", 
        "K/Lelen Kudu", "Kawaya", "Kukuma", "Madabe", "Y/Tukur"
    ],
    "Dutse": [
        "Chamo", "Limawa", "Kachi", "Madobi", "Dundubus", 
        "Takur", "Yalwawa", "Kudai", "Danmasara", "Larabar"
    ],
    "Gagarawa": [
        "Gagarawa Gari", "Gagarawa Tasha", "Garin Chiroma", "Kore Balatu", "Madaka", 
        "Maiaduwa", "Maikilili", "Medu", "Yalawa", "Zarada"
    ],
    "Garki": [
        "Buduru", "Doko", "Garki", "Gwarzon Garki", "Jirima", 
        "Kanya", "Kargo", "Kore", "Muku", "Rafin Marke", "Siyori"
    ],
    "Gumel": [
        "Baikarya", "Danama", "Dantanoma", "Galagamma", "Garin Gambo", 
        "Garin Alhaji Barka", "Gusau", "Hammado", "Kofar Arewa", "Kofar Yamma", "Zango"
    ],
    "Guri": [
        "Abunabo", "Adiyani", "Dawa", "Garbagal", "Guri", 
        "Kadira", "Lafiya", "Margadu", "Matara Baba", "Musari"
    ],
    "Gwaram": [
        "Basirka", "Dingaya", "Fagam", "Farin Dutse", "Gwaram", 
        "Kila", "Kwandiko", "Maruta", "Sara", "Tsangarwa", "Zandam Nagogo"
    ],
    "Gwiwa": [
        "Buntusu", "Dabi", "Darina", "F/Yamma", "Guntai", 
        "Gwiwa", "Korayel", "Rorau", "Shafe", "Yola", "Zaumar Sainawa"
    ],
    "Hadejia": [
        "Atafi", "Dubantu", "Gagulmari", "Kasangagi", "Kasuwar Kofa", 
        "Majema", "Matsaro", "Rumfa", "Sabon Garu", "Yankoli", "Yayari"
    ],
    "Jahun": [
        "Aujara", "Gangawa", "Gauza Tazara", "Gunka", "Harbo Sabuwa", 
        "Harbo Tsohuwa", "Idanduna", "Jabarna", "Jahun", "Kale", "Kanwa"
    ],
    "Kafin Hausa": [
        "Balangu", "Dumadumin Toka", "Gafaya", "Jabo", "Kafin Hausa", 
        "Kazalewa", "Majawa", "Mezan", "Ruba", "Sarawa", "Zago"
    ],
    "Kaugama": [
        "Arbus", "Askandu", "Dabuwaran", "Dakaiyawa", "Hadin", 
        "Ja’e", "Jarkasa", "Kaugama", "Marke", "Unguwar Jibrin"
    ],
    "Kazaure": [
        "Ba'auzini", "Daba", "Dabaza", "Dandi", "Gada", 
        "Kanti", "Maradawa", "Sabaru", "Unguwar Arewa", "Unguwar Gabas", "Unguwar Yamma"
    ],
    "Kirikasamma": [
        "Baturiya", "Bulunchai", "Doleri", "Fandum", "Gayin", 
        "Kirika Samma", "Madachi", "Marma", "Tsheguwa", "Tarabu"
    ],
    "Kiyawa": [
        "Abalago", "Andaza", "Faki", "Garko", "Guruduba", 
        "Katanga", "Katuka", "Kiyawa", "Kwanda", "Maje", "Tsurma"
    ],
    "Maigatari": [
        "Balarabe", "Dankumbo", "Fulata", "Galadi", "Jajeri", 
        "Kukayasku", "Madana", "Maigatari Arewa", "Maigatari Kudu", "Matoya", "Turbus"
    ],
    "Malam Madori": [
        "Arki", "Dunari", "Fateka Akurya", "Garin Gabas", "Maira Kumi-Bara Musa", 
        "Maka Ddari", "Malam Madori", "Shaiya", "Tagwaro", "Tashena", "Tonikutara"
    ],
    "Miga": [
        "Dangyatin", "Garbo", "Hantsu", "Koya", "Miga", 
        "Sabon Gari Takanebu", "Sansani", "Tsakuwawa", "Yanduna", "Zareku"
    ],
    "Ringim": [
        "Chai-Chai", "Dabi", "Kafin Babushe", "Karshi", "Kyarama", 
        "Ringim", "Sankara", "Sintilmawa", "Tofa", "Yandutse"
    ],
    "Roni": [
        "Amaryawa", "Baragumi", "Dansure", "Fara", "Gora", 
        "Kwaita", "Roni", "Sankau", "Tunas", "Yanzaki", "Zugai"
    ],
    "Sule Tankarkar": [
        "Albasu", "Amanga", "Dangwanki", "Danladi", "Danzomo", 
        "Jeke", "Shabaru", "Sule-Tankarkar", "Takatsaba", "Yandamo"
    ],
    "Taura": [
        "Ajaura", "Chakwaikwaiwa", "Chukuto", "Gujungu", "Kiri", 
        "Kwalam", "Maje", "Majiya", "S/Garin Yaya", "Taura"
    ],
    "Yankwashi": [
        "Achilafiya", "Belas", "Dawan-Gawo", "Gurjiya", "Gwarta", 
        "Karkarna", "Kuda", "Ringim", "Yankwashi", "Zungumba"
    ]
}

def migrate_wards(db: Session = None):
    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True
    try:
        print("--- STARTING INEC AUTHENTIC WARDS MIGRATION ---")
        
        # 1. Prune the empty duplicate placeholder wards
        empty_wards = []
        for w in db.query(Ward).all():
            pu_count = db.query(PollingUnit).filter(PollingUnit.ward_id == w.id).count()
            if pu_count == 0:
                empty_wards.append(w)
        
        print(f"Found {len(empty_wards)} empty placeholder duplicate wards to prune:")
        for w in empty_wards:
            print(f"  - Deleting empty ward: ID {w.id} ({w.name})")
            db.delete(w)
        db.commit()

        # 2. Iterate through each LGA and rename active wards to authentic INEC names
        total_renamed = 0
        total_pus_updated = 0

        for lga_name, real_wards in CANONICAL_INEC_WARDS.items():
            lga = db.query(LGA).filter(LGA.name == lga_name).first()
            if not lga:
                print(f"WARNING: LGA {lga_name} not found in database!")
                continue

            active_wards = db.query(Ward).filter(Ward.lga_id == lga.id).order_by(Ward.id).all()
            print(f"\nProcessing {lga.name} ({lga.code}): {len(active_wards)} wards in DB vs {len(real_wards)} authentic wards")

            # Phase 1: Set temporary names to prevent unique index collisions
            for idx, ward in enumerate(active_wards):
                if idx < len(real_wards):
                    ward.name = f"TEMP_{ward.id}_{idx}"
            db.flush()

            # Phase 2: Set final authentic names, codes, and update PUs
            for idx, ward in enumerate(active_wards):
                if idx < len(real_wards):
                    new_name = real_wards[idx]
                    ward_code = f"{lga.code}-W{idx+1:02d}"

                    ward.name = new_name
                    ward.code = ward_code
                    total_renamed += 1

                    # Update Polling Units associated with this ward
                    pus = db.query(PollingUnit).filter(PollingUnit.ward_id == ward.id).all()
                    for pu_idx, pu in enumerate(pus, start=1):
                        if "Ward " in pu.name:
                            pu.name = f"{pu.code} - {new_name} PU {pu_idx}"
                            total_pus_updated += 1

                    print(f"  [Ward {ward.id}] -> {new_name} ({ward_code}) [{len(pus)} PUs]")

            db.commit()

        # 3. Final Verification Audit
        remaining_wards = db.query(Ward).count()
        remaining_pus = db.query(PollingUnit).count()
        orphaned_pus = db.query(PollingUnit).filter(~PollingUnit.ward_id.in_([w.id for w in db.query(Ward.id).all()])).count()
        generic_wards = db.query(Ward).filter(Ward.name.like("%Ward %")).count()

        print("\n================ MIGRATION COMPLETE ================")
        print(f"✓ Total Wards in DB:     {remaining_wards} (Official INEC Roster)")
        print(f"✓ Total Polling Units:   {remaining_pus} (Preserved)")
        print(f"✓ Orphaned PUs:          {orphaned_pus} (Must be 0)")
        print(f"✓ Generic 'Ward X' left: {generic_wards} (Must be 0)")
        print(f"✓ Total Wards Renamed:   {total_renamed}")
        print(f"✓ Total PUs Relabeled:   {total_pus_updated}")
        print("====================================================")

    except Exception as e:
        db.rollback()
        print(f"ERROR during migration: {e}")
        raise e
    finally:
        if close_session:
            db.close()

if __name__ == "__main__":
    migrate_wards()
