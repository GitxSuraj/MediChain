"""
patch_hospital_locations.py
Adds latitude/longitude coordinates to all seeded hospitals that don't have them yet.
Run once:  python scripts/patch_hospital_locations.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database.mongodb import get_database

LOCATION_MAP = {
    "CityCare General Hospital":     {"latitude": 28.6304, "longitude": 77.2177},   # Connaught Place, Delhi
    "Lotus Multispeciality Center":  {"latitude": 19.0596, "longitude": 72.8295},   # Bandra, Mumbai
    "Sunrise Trauma Institute":      {"latitude": 12.9716, "longitude": 77.5946},   # Indiranagar, Bengaluru
    "Green Valley Women's Hospital": {"latitude": 18.5204, "longitude": 73.8567},   # Shivajinagar, Pune
    "NorthStar Children's Medical":  {"latitude": 13.0827, "longitude": 80.2707},   # Anna Salai, Chennai
    "CarePoint Family Clinic":       {"latitude": 28.7041, "longitude": 77.1025},   # Rohini, Delhi
    "WellSpring Community Clinic":   {"latitude": 12.9279, "longitude": 77.6271},   # Koramangala, Bengaluru
}

def patch():
    db = get_database()
    patched = 0
    for name, coords in LOCATION_MAP.items():
        result = db.hospitals.update_many(
            {"name": name, "latitude": {"$exists": False}},
            {"$set": coords}
        )
        if result.modified_count:
            print(f"  ✅ {name}: {coords}")
            patched += result.modified_count
        else:
            # Also update if latitude is None/null
            result2 = db.hospitals.update_many(
                {"name": name, "$or": [{"latitude": None}, {"latitude": 0}]},
                {"$set": coords}
            )
            if result2.modified_count:
                print(f"  ✅ {name} (was null): {coords}")
                patched += result2.modified_count
            else:
                print(f"  ⏭  {name}: already has coordinates")
    print(f"\nDone — patched {patched} hospital(s).")

if __name__ == "__main__":
    patch()
