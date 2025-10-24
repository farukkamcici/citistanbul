from fastapi import HTTPException
from pathlib import Path
import os

def success_response(data, message = "ok", code = 200):
    return {
        "status": "success",
        "data": data,
        "message": message,
        "code": code
    }

def error_response(message = "error", code = 400):
    return {
        "status": "error",
        "code": code,
        "message": message,
        "data": None
    }

def parse_bbox(bbox: str):
    parts = bbox.split(',')
    if len(parts) != 4:
        raise HTTPException(status_code=400, detail="bbox must be 'minx,miny,maxx,maxy'")
    try:
        minx, miny, maxx, maxy = map(float, parts)
    except ValueError:
        raise HTTPException(status_code=400, detail="bbox values must be numbers")
    if not (minx < maxx and miny < maxy):
        raise HTTPException(status_code=400, detail="bbox must satisfy minx<maxx and miny<maxy")
    return minx, miny, maxx, maxy

POI_LABELS = {
    "bus_stop": "Otobüs Durağı",
    "metro_station": "Metro İstasyonu",
    "tram_station": "Tramvay İstasyonu",
    "ev_charger": "Elektrikli Araç Şarj",
    "toilet": "Tuvalet",
    "bike_parking": "Bisiklet Parkı",
    "micro_mobility_parking": "Mikro Mobilite Parkı",
    "museum": "Müze",
    "theater": "Tiyatro",
    "kiosk": "İHE Büfe",
    "health": "Sağlık Tesisi",
}

def get_secret(key_name: str, default: str | None = None) -> str | None:
    """
    Unified secret getter.
    Works with both environment variables (.env) and Docker secrets.

    Example:
        get_secret("ORS_KEY")
        get_secret("GEMINI_KEY")
    """
    # 1️⃣ Try environment variable first
    val = os.getenv(key_name)
    if val:
        return val.strip()

    # 2️⃣ Try Docker secret file (mounted at /run/secrets/<lowercase_key>)
    secret_path = Path(f"/run/secrets/{key_name.lower()}")
    if secret_path.exists():
        raw = secret_path.read_text().strip()
        return raw

    # 3️⃣ Fallback
    return default
