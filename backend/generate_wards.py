from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import LGA, Ward

db: Session = SessionLocal()

wards = {
    "Gwaram": [
        "Basirka",
        "Dingaya",
        "Fagam",
        "Farin Dutse",
        "Gwaram",
        "Kila",
        "Kwandiko",
        "Maruta",
        "Sara",
        "Tsangarwa",
        "Zandam Nagogo"
    ],

    "Dutse": [
        "Chamo",
        "Limawa",
        "Kachi",
        "Madobi",
        "Dundubus",
        "Takur",
        "Yalwawa",
        "Kudai",
        "Danmasara",
        "Larabar"
    ],

    "Birnin Kudu": [
        "Birnin Kudu",
        "Kangire",
        "Surko",
        "Wurno",
        "Kiyako",
        "Sundimina",
        "Kantoga",
        "Lafiya",
        "Kwangwara",
        "Kiyawa"
    ]
}

for lga_name, ward_list in wards.items():

    lga = db.query(LGA).filter(LGA.name == lga_name).first()

    if not lga:
        print(f"{lga_name} not found")
        continue

    for index, ward_name in enumerate(ward_list, start=1):

        exists = (
            db.query(Ward)
            .filter(
                Ward.name == ward_name,
                Ward.lga_id == lga.id
            )
            .first()
        )

        if exists:
            continue

        db.add(
            Ward(
                lga_id=lga.id,
                name=ward_name,
                code=f"{lga.code}-{index:02d}",
                total_polling_units=0
            )
        )

db.commit()

print("Done!")