from pymongo.errors import PyMongoError, ServerSelectionTimeoutError

from database.hospitals import get_hospitals_collection
from database.mongodb import MONGODB_UNAVAILABLE_MESSAGE
from database.mongodb import get_database
from routes.auth import _hash
import secrets
from models.hospital import HospitalSeed


SEED_HOSPITALS = [
    {
        "name": "CityCare General Hospital",
        "type": "hospital",
        "city": "Delhi",
        "facilities": ["Emergency", "ICU", "Oxygen", "Pharmacy"],
        "beds": {
            "general": {"total": 120, "available": 42},
            "icu": {"total": 24, "available": 6},
            "oxygen": {"total": 40, "available": 12},
            "emergency": {"total": 18, "available": 5},
        },
    },
    {
        "name": "Lotus Multispeciality Center",
        "type": "hospital",
        "city": "Mumbai",
        "facilities": ["Cardiology", "Emergency", "ICU", "Diagnostics"],
        "beds": {
            "general": {"total": 95, "available": 31},
            "icu": {"total": 18, "available": 4},
            "oxygen": {"total": 30, "available": 9},
            "emergency": {"total": 14, "available": 3},
        },
    },
    {
        "name": "Sunrise Trauma Institute",
        "type": "hospital",
        "city": "Bengaluru",
        "facilities": ["Trauma", "Emergency", "ICU", "Blood Bank"],
        "beds": {
            "general": {"total": 80, "available": 26},
            "icu": {"total": 20, "available": 7},
            "oxygen": {"total": 28, "available": 10},
            "emergency": {"total": 20, "available": 8},
        },
    },
    {
        "name": "Green Valley Women's Hospital",
        "type": "hospital",
        "city": "Pune",
        "facilities": ["Maternity", "Neonatal ICU", "Emergency", "Oxygen"],
        "beds": {
            "general": {"total": 70, "available": 22},
            "icu": {"total": 10, "available": 2},
            "oxygen": {"total": 24, "available": 11},
            "emergency": {"total": 8, "available": 2},
        },
    },
    {
        "name": "NorthStar Children's Medical",
        "type": "hospital",
        "city": "Chennai",
        "facilities": ["Pediatrics", "Emergency", "ICU", "Diagnostics"],
        "beds": {
            "general": {"total": 65, "available": 19},
            "icu": {"total": 12, "available": 3},
            "oxygen": {"total": 22, "available": 8},
            "emergency": {"total": 10, "available": 4},
        },
    },
    {
        "name": "CarePoint Family Clinic",
        "type": "clinic",
        "city": "Delhi",
        "facilities": ["General Practice", "Diagnostics", "Pharmacy"],
        "beds": {"general": {"total": 0, "available": 0}, "icu": {"total": 0, "available": 0}, "oxygen": {"total": 0, "available": 0}, "emergency": {"total": 0, "available": 0}},
    },
    {
        "name": "WellSpring Community Clinic",
        "type": "clinic",
        "city": "Bengaluru",
        "facilities": ["General Practice", "Vaccination", "Pharmacy"],
        "beds": {"general": {"total": 0, "available": 0}, "icu": {"total": 0, "available": 0}, "oxygen": {"total": 0, "available": 0}, "emergency": {"total": 0, "available": 0}},
    },
]


EXPANDED_MEDICINES = [
    # Analgesics & Anti-inflammatory
    {"name": "Paracetamol 650mg", "generic_name": "Acetaminophen", "sku": "MED-PCM-650", "description": "Effective for pain relief and reducing high fever", "quantity": 250, "unit": "tablets", "expiry_date": "2027-12-31", "reorder_threshold": 30, "price_per_unit": 32.0, "category": "Analgesic"},
    {"name": "Ibuprofen 400mg", "generic_name": "Ibuprofen", "sku": "MED-IBU-400", "description": "NSAID for inflammation, dental pain, and joint aches", "quantity": 180, "unit": "tablets", "expiry_date": "2027-09-30", "reorder_threshold": 20, "price_per_unit": 45.0, "category": "Analgesic"},
    {"name": "Aceclofenac + Paracetamol", "generic_name": "Aceclofenac 100mg + Paracetamol 325mg", "sku": "MED-ACP-001", "description": "Combination painkiller for acute musculoskeletal pain", "quantity": 140, "unit": "tablets", "expiry_date": "2027-10-15", "reorder_threshold": 25, "price_per_unit": 58.0, "category": "Analgesic"},
    {"name": "Tramadol 50mg", "generic_name": "Tramadol Hydrochloride", "sku": "MED-TRM-050", "description": "Opioid analgesic for moderate to severe post-operative pain", "quantity": 60, "unit": "capsules", "expiry_date": "2026-11-30", "reorder_threshold": 15, "price_per_unit": 110.0, "category": "Analgesic"},

    # Antibiotics & Anti-infectives
    {"name": "Amoxicillin + Clavulanate 625mg", "generic_name": "Amoxicillin 500mg + Clavulanic Acid 125mg", "sku": "MED-AUG-625", "description": "Broad-spectrum penicillin antibiotic for bacterial infections", "quantity": 120, "unit": "tablets", "expiry_date": "2027-08-30", "reorder_threshold": 20, "price_per_unit": 140.0, "category": "Antibiotic"},
    {"name": "Azithromycin 500mg", "generic_name": "Azithromycin", "sku": "MED-AZI-500", "description": "Macrolide antibiotic for upper respiratory tract and ENT infections", "quantity": 100, "unit": "strips", "expiry_date": "2027-11-15", "reorder_threshold": 15, "price_per_unit": 125.0, "category": "Antibiotic"},
    {"name": "Ciprofloxacin 500mg", "generic_name": "Ciprofloxacin HCl", "sku": "MED-CIP-500", "description": "Fluoroquinolone for urinary tract and abdominal infections", "quantity": 90, "unit": "tablets", "expiry_date": "2027-07-20", "reorder_threshold": 15, "price_per_unit": 75.0, "category": "Antibiotic"},
    {"name": "Cefixime 200mg", "generic_name": "Cefixime Trihydrate", "sku": "MED-CFX-200", "description": "Cephalosporin antibiotic for typhoid and respiratory infections", "quantity": 85, "unit": "tablets", "expiry_date": "2027-06-30", "reorder_threshold": 15, "price_per_unit": 95.0, "category": "Antibiotic"},
    {"name": "Doxycycline 100mg", "generic_name": "Doxycycline Hyclate", "sku": "MED-DOX-100", "description": "Tetracycline class antibiotic for skin, chest, and tick-borne infections", "quantity": 70, "unit": "capsules", "expiry_date": "2028-02-28", "reorder_threshold": 10, "price_per_unit": 65.0, "category": "Antibiotic"},

    # Antacids & Gastrointestinal
    {"name": "Pantoprazole 40mg", "generic_name": "Pantoprazole Sodium", "sku": "MED-PAN-040", "description": "Proton pump inhibitor for acid reflux, ulcers, and GERD", "quantity": 200, "unit": "tablets", "expiry_date": "2028-01-31", "reorder_threshold": 25, "price_per_unit": 65.0, "category": "Antacid"},
    {"name": "Omeprazole + Domperidone", "generic_name": "Omeprazole 20mg + Domperidone 10mg", "sku": "MED-OMD-030", "description": "Relief from nausea, heartburn, and gastric discomfort", "quantity": 110, "unit": "capsules", "expiry_date": "2027-12-15", "reorder_threshold": 20, "price_per_unit": 78.0, "category": "Antacid"},
    {"name": "Ondansetron 4mg", "generic_name": "Ondansetron HCl", "sku": "MED-OND-004", "description": "Antiemetic for preventing nausea and vomiting", "quantity": 130, "unit": "tablets", "expiry_date": "2028-03-31", "reorder_threshold": 20, "price_per_unit": 42.0, "category": "Gastrointestinal"},
    {"name": "Oral Rehydration Salts (ORS)", "generic_name": "WHO Formula ORS", "sku": "MED-ORS-001", "description": "Electrolyte replacement formula for dehydration and diarrhea", "quantity": 300, "unit": "sachets", "expiry_date": "2028-12-31", "reorder_threshold": 50, "price_per_unit": 22.0, "category": "Gastrointestinal"},

    # Antihistamines & Respiratory
    {"name": "Cetirizine 10mg", "generic_name": "Cetirizine Hydrochloride", "sku": "MED-CTZ-010", "description": "Non-sedating antihistamine for seasonal allergies, hives, and rhinitis", "quantity": 300, "unit": "tablets", "expiry_date": "2028-04-30", "reorder_threshold": 30, "price_per_unit": 28.0, "category": "Antihistamine"},
    {"name": "Montelukast + Levocetirizine", "generic_name": "Montelukast 10mg + Levocetirizine 5mg", "sku": "MED-MNL-015", "description": "Dual action for allergic asthma and chronic allergic rhinitis", "quantity": 160, "unit": "tablets", "expiry_date": "2027-10-31", "reorder_threshold": 25, "price_per_unit": 115.0, "category": "Antihistamine"},
    {"name": "Salbutamol Inhaler 100mcg", "generic_name": "Albuterol / Salbutamol", "sku": "MED-SAL-100", "description": "Bronchodilator for fast asthma symptom relief and wheezing", "quantity": 45, "unit": "inhalers", "expiry_date": "2027-05-31", "reorder_threshold": 10, "price_per_unit": 190.0, "category": "Respiratory"},

    # Cardiovascular & Antihypertensives
    {"name": "Amlodipine 5mg", "generic_name": "Amlodipine Besylate", "sku": "MED-AML-005", "description": "Calcium channel blocker for managing high blood pressure", "quantity": 220, "unit": "tablets", "expiry_date": "2028-06-30", "reorder_threshold": 30, "price_per_unit": 38.0, "category": "Cardiovascular"},
    {"name": "Telmisartan 40mg", "generic_name": "Telmisartan", "sku": "MED-TEL-040", "description": "Angiotensin receptor blocker for primary hypertension", "quantity": 190, "unit": "tablets", "expiry_date": "2028-01-31", "reorder_threshold": 25, "price_per_unit": 68.0, "category": "Cardiovascular"},
    {"name": "Atorvastatin 20mg", "generic_name": "Atorvastatin Calcium", "sku": "MED-ATV-020", "description": "Statin medication for lowering LDL cholesterol and heart protection", "quantity": 170, "unit": "tablets", "expiry_date": "2027-11-30", "reorder_threshold": 20, "price_per_unit": 88.0, "category": "Cardiovascular"},
    {"name": "Aspirin 75mg Gastro-resistant", "generic_name": "Acetylsalicylic Acid", "sku": "MED-ASP-075", "description": "Antiplatelet therapy for cardiovascular event prevention", "quantity": 240, "unit": "tablets", "expiry_date": "2028-05-31", "reorder_threshold": 30, "price_per_unit": 20.0, "category": "Cardiovascular"},

    # Diabetes Care
    {"name": "Metformin 500mg SR", "generic_name": "Metformin Hydrochloride Sustained Release", "sku": "MED-MET-500", "description": "First-line oral glycemic control for Type 2 Diabetes", "quantity": 280, "unit": "tablets", "expiry_date": "2028-07-31", "reorder_threshold": 40, "price_per_unit": 42.0, "category": "Antidiabetic"},
    {"name": "Glimepiride 2mg", "generic_name": "Glimepiride", "sku": "MED-GLM-002", "description": "Sulfonylurea to stimulate insulin secretion", "quantity": 150, "unit": "tablets", "expiry_date": "2027-08-31", "reorder_threshold": 20, "price_per_unit": 55.0, "category": "Antidiabetic"},
    {"name": "Human Insulin 100IU/ml", "generic_name": "Regular Recombinant Human Insulin", "sku": "MED-INS-100", "description": "Fast-acting insulin injection for glycemic management", "quantity": 35, "unit": "vials", "expiry_date": "2026-10-31", "reorder_threshold": 10, "price_per_unit": 280.0, "category": "Antidiabetic"},

    # Vitamins & Supplements
    {"name": "Vitamin D3 60,000 IU", "generic_name": "Cholecalciferol", "sku": "MED-VD3-60K", "description": "High-potency weekly supplement for Vitamin D deficiency and bone health", "quantity": 200, "unit": "capsules", "expiry_date": "2028-09-30", "reorder_threshold": 25, "price_per_unit": 60.0, "category": "Vitamins"},
    {"name": "Multivitamin & Minerals Complex", "generic_name": "Zinc, B-Complex, Vitamin C & E", "sku": "MED-MVT-001", "description": "Daily immunity booster and nutritional support", "quantity": 220, "unit": "tablets", "expiry_date": "2028-10-31", "reorder_threshold": 30, "price_per_unit": 48.0, "category": "Vitamins"},
    {"name": "Calcium Carbonate + Vitamin D3", "generic_name": "Calcium 500mg + Vit D3 250 IU", "sku": "MED-CAL-500", "description": "Bone mineral density support for osteoporosis and elderly care", "quantity": 180, "unit": "tablets", "expiry_date": "2028-03-31", "reorder_threshold": 25, "price_per_unit": 52.0, "category": "Vitamins"},
]


def seed_hospitals() -> int:
    db = get_database()
    collection = get_hospitals_collection()
    collection.create_index([("name", 1), ("city", 1)], unique=True)

    for hospital in SEED_HOSPITALS:
        validated_hospital = HospitalSeed(**hospital).model_dump()
        collection.update_one(
            {"name": validated_hospital["name"], "city": validated_hospital["city"]},
            {"$set": validated_hospital},
            upsert=True,
        )

        saved = collection.find_one({"name": validated_hospital["name"], "city": validated_hospital["city"]})
        hospital_id_str = str(saved["_id"])
        salt = secrets.token_hex(16)
        db.hospital_users.update_one(
            {"hospital_id": hospital_id_str},
            {"$setOnInsert": {"hospital_id": hospital_id_str, "hospital_object_id": saved["_id"],
                               "password_salt": salt, "password_hash": _hash("Hospital@123", salt)}},
            upsert=True,
        )

        # Seed default hospital_staff super admin
        slug = hospital["name"].lower().replace(" ", "").replace("'", "").replace("-", "")
        admin_email = f"admin@{slug}.com"
        admin_salt = secrets.token_hex(16)
        db.hospital_staff.update_one(
            {"email": admin_email},
            {"$setOnInsert": {
                "hospital_id": hospital_id_str,
                "name": f"{hospital['name']} Admin",
                "email": admin_email,
                "role": "super_admin",
                "permissions": [
                    "manage_beds", "manage_transfers", "view_patients",
                    "assign_doctors", "manage_inventory", "manage_billing"
                ],
                "password_salt": admin_salt,
                "password_hash": _hash("Hospital@123", admin_salt),
                "created_at": datetime.now(timezone.utc)
            }},
            upsert=True
        )

        # Seed initial medicines if hospital has none, or ensure medicines exist
        for med in EXPANDED_MEDICINES:
            med_doc = dict(med)
            med_doc["hospital_id"] = hospital_id_str
            # Upsert by name + hospital_id
            db.medicines.update_one(
                {"name": med_doc["name"], "hospital_id": hospital_id_str},
                {"$set": med_doc},
                upsert=True
            )

    return len(SEED_HOSPITALS)


if __name__ == "__main__":
    try:
        count = seed_hospitals()
    except ServerSelectionTimeoutError as exc:
        print(MONGODB_UNAVAILABLE_MESSAGE)
        raise SystemExit(1) from exc
    except PyMongoError as exc:
        print(f"MongoDB seed failed: {exc}")
        raise SystemExit(1) from exc

    print(f"Seeded {count} hospitals and full medicine catalog.")
