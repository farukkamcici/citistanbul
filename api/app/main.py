from fastapi import FastAPI, Query, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from psycopg2 import OperationalError
from psycopg2.extras import RealDictCursor
import json
import requests
from .db import get_connection
from .es import get_es_client
from .utils import success_response, error_response, parse_bbox, POI_LABELS
from .rag import run_rag_pipeline
from pathlib import Path
import os
import traceback
import sys


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
        # handle KEY=value style files too
        if "=" in raw:
            _, raw = raw.split("=", 1)
        return raw.strip()

    # 3️⃣ Fallback
    return default



app = FastAPI()


origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://citistanbul.vercel.app",
    "https://istanbul360.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Coordinate(BaseModel):
    lon: float
    lat: float


class DirectionsRequest(BaseModel):
    start: Coordinate
    end: Coordinate
    mode: str


PROFILE_MAP = {
    "walk": "foot-walking",
    "bike": "cycling-regular",
    "car": "driving-car",
}


def decode_polyline(polyline: str, precision: int = 5) -> list[list[float]]:
    coordinates: list[list[float]] = []
    index = 0
    lat = 0
    lon = 0
    factor = 10 ** precision

    while index < len(polyline):
        result = 0
        shift = 0

        while True:
            if index >= len(polyline):
                break
            b = ord(polyline[index]) - 63
            index += 1
            result |= (b & 0x1F) << shift
            shift += 5
            if b < 0x20:
                break

        delta_lat = ~(result >> 1) if (result & 1) else (result >> 1)
        lat += delta_lat

        result = 0
        shift = 0

        while True:
            if index >= len(polyline):
                break
            b = ord(polyline[index]) - 63
            index += 1
            result |= (b & 0x1F) << shift
            shift += 5
            if b < 0x20:
                break

        delta_lon = ~(result >> 1) if (result & 1) else (result >> 1)
        lon += delta_lon

        coordinates.append([lon / factor, lat / factor])

    return coordinates

# GLOBAL ERROR HANDLERS

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content=error_response(message="Validation error", code=422)
    )

@app.exception_handler(OperationalError)
async def db_exception_handler(request: Request, exc: OperationalError):
    return JSONResponse(
        status_code=500,
        content=error_response(message="Database connection error", code=500)
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    tb = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    print("---- EXCEPTION TRACE ----", file=sys.stderr)
    print(tb, file=sys.stderr)
    print("--------------------------", file=sys.stderr)
    return JSONResponse(
        status_code=500,
        content=error_response(message=str(exc), code=500)
    )


@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/districts")
def get_districts():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT
            district_id,
            district_name,
            ST_AsGeoJSON(geom) AS geometry
        FROM city.districts;
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    features = []
    for row in rows:
        features.append({
            "type": "Feature",
            "geometry": json.loads(row['geometry']),
            "properties": {
                "district_id": row['district_id'],
                "district_name": row['district_name']
            }
        })

    return success_response({"type": "FeatureCollection", "features": features})

@app.get("/metrics")
def get_district_metrics(district: str | None = Query(default=None, min_length=3, max_length=50)):
    conn = get_connection()
    cur = conn.cursor()

    if district:
        cur.execute("""
            SELECT 
               m.district_id,
               m.district_name,
               m.population,
               m.household_size,
               m.avg_price_m2,
               m.avg_rent,
               m.green_area_m2,
               m.bike_lane_km,
               m.pedestrian_length_m,
               m.area_km2,
               s.green_per_capita_m2,
               s.bike_lane_density,
               s.pedestrian_length_density,
               s.total_pois,
               r.rank_environment,
               r.rank_mobility,
               r.rank_housing,
               r.rank_overall
            FROM city.district_metrics m
            LEFT JOIN city.district_scores s ON m.district_id = s.district_id
            LEFT JOIN city.district_rankings r ON m.district_id = r.district_id
            WHERE LOWER(m.district_name) = LOWER(%s);
        """, (district,))
    else:
        cur.execute("""
            SELECT 
               m.district_id,
               m.district_name,
               m.population,
               m.household_size,
               m.avg_price_m2,
               m.avg_rent,
               m.green_area_m2,
               m.bike_lane_km,
               m.pedestrian_length_m,
               m.area_km2,
               s.green_per_capita_m2,
               s.bike_lane_density,
               s.pedestrian_length_density,
               s.total_pois,
               r.rank_environment,
               r.rank_mobility,
               r.rank_housing,
               r.rank_overall
            FROM city.district_metrics m
            LEFT JOIN city.district_scores s ON m.district_id = s.district_id
            LEFT JOIN city.district_rankings r ON m.district_id = r.district_id;
        """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    if district and not rows:
        return error_response(message=f"District '{district}' not found", code=404)

    return success_response({"districts": rows})

@app.get("/poi")
def get_pois(poi_type: str, bbox: str | None = None):
    conn = get_connection()
    cur = conn.cursor()

    if bbox:
        minx, miny, maxx, maxy = parse_bbox(bbox)
        cur.execute("""
            SELECT 
                poi_id,
                name,
                poi_type,
                subtype,
                district_name,
                address_text,
                ST_AsGeoJSON(geom) AS geometry
            FROM city.pois
            WHERE LOWER(poi_type) = LOWER(%s)
              AND geom && ST_MakeEnvelope(%s, %s, %s, %s, 4326);
        """, (poi_type, minx, miny, maxx, maxy))
    else:
        cur.execute("""
            SELECT 
                poi_id,
                name,
                poi_type,
                subtype,
                district_name,
                address_text,
                ST_AsGeoJSON(geom) AS geometry
            FROM city.pois
            WHERE LOWER(poi_type) = LOWER(%s);
        """, (poi_type,))

    rows = cur.fetchall()
    cur.close()
    conn.close()

    features = []
    for row in rows:
        features.append({
            "type": "Feature",
            "geometry": json.loads(row["geometry"]),
            "properties": {
                "poi_id": row["poi_id"],
                "name": row["name"],
                "poi_type": row["poi_type"],
                "subtype": row["subtype"],
                "district_name": row["district_name"],
                "address": row["address_text"]
            }
        })

    if not features:
        return error_response(message=f"No POIs found for type='{poi_type}'", code=404)

    print("Sample row:", rows[0] if rows else None)
    print("Geometry type:", type(rows[0]["geometry"]) if rows else None)

    return success_response({"type": "FeatureCollection", "features": features})

@app.get("/poi/nearby")
def get_pois_nearby(lon: float, lat: float, r: int = 500, poi_type: str | None = None):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute("""
        SELECT 
            poi_id, name, poi_type, subtype, district_name, address_text,
            ST_AsGeoJSON(geom) AS geometry,
            ROUND(
                ST_Distance(
                    geom::geography,
                    ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography
                )::numeric
            ) AS distance_m
        FROM city.pois
        WHERE ST_DWithin(
            geom::geography,
            ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
            %s
        )
        AND (%s IS NULL OR LOWER(poi_type) = LOWER(%s))
        ORDER BY distance_m
        LIMIT 100;
    """, (lon, lat, lon, lat, r, poi_type, poi_type))

    rows = cur.fetchall()
    cur.close()
    conn.close()

    features = [
        {
            "type": "Feature",
            "geometry": json.loads(r["geometry"]),
            "properties": {
                "poi_id": r["poi_id"],
                "name": r["name"],
                "poi_type": r["poi_type"],
                "poi_type_label": POI_LABELS.get(r["poi_type"], r["poi_type"]),  # ✅ Türkçe label
                "subtype": r["subtype"],
                "district_name": r["district_name"],
                "address_text": r["address_text"],
                "distance_m": r["distance_m"],
            },
        }
        for r in rows
    ]

    return success_response({"type": "FeatureCollection", "features": features})


@app.get("/search")
def search(q: str, size: int = 10, poi_type: str | None = None):
    es = get_es_client()

    # District araması
    district_body = {
        "query": {
            "match": {
                "district_name": {
                    "query": q,
                    "fuzziness": 1
                }
            }
        },
        "size": size
    }
    district_res = es.search(index="districts", body=district_body)
    district_hits = district_res["hits"]["hits"]

    # POI araması
    poi_query = {
        "bool": {
            "must": [
                {
                    "match": {
                        "search_all": {
                            "query": q,
                            "fuzziness": 1
                        }
                    }
                }
            ]
        }
    }

    if poi_type:
        poi_query["bool"]["filter"] = [{"term": {"poi_type": poi_type}}]

    poi_body = {
        "query": poi_query,
        "size": size
    }

    poi_res = es.search(index="pois", body=poi_body)
    poi_hits = poi_res["hits"]["hits"]

    results = []

    # District sonuçları
    for h in district_hits:
        source = h["_source"]
        results.append({
            "type": "district",
            "district_id": source["district_id"],
            "district_name": source["district_name"],
            "bbox": source.get("bbox"),          # <-- eklendi
            "score": h["_score"]
        })

    # POI sonuçları
    for h in poi_hits:
        source = h["_source"]
        results.append({
            "type": "poi",
            "poi_id": source["poi_id"],
            "name": source["name"],
            "poi_type": source["poi_type"],
            "poi_type_label": source.get("poi_type_label"),
            "subtype": source.get("subtype"),
            "district_name": source["district_name"],
            "address_text": source.get("address_text"),
            "lon": source.get("lon"),            # <-- eklendi
            "lat": source.get("lat"),            # <-- eklendi
            "score": h["_score"]
        })

    # Skorla sırala
    results = sorted(results, key=lambda x: x["score"], reverse=True)

    return success_response({"results": results})

@app.get("/green_areas")
def get_green_areas(bbox: str | None = None):
    conn = get_connection()
    cur = conn.cursor()

    if bbox:
        minx, miny, maxx, maxy = parse_bbox(bbox)
        cur.execute("""
            SELECT 
                area_id,
                name,
                district_name,
                district_id,
                area_m2,
                ST_AsGeoJSON(geom) AS geometry
            FROM city.green_areas
            WHERE geom && ST_MakeEnvelope(%s, %s, %s, %s, 4326);
        """, (minx, miny, maxx, maxy))
    else:
        cur.execute("""
            SELECT 
                area_id,
                name,
                district_name,
                district_id,
                area_m2,
                ST_AsGeoJSON(geom) AS geometry
            FROM city.green_areas
            ORDER BY area_m2 DESC
            LIMIT 70;
        """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    features = []
    for row in rows:
        features.append({
            "type": "Feature",
            "geometry": json.loads(row["geometry"]),
            "properties": {
                "area_id": row["area_id"],
                "name": row["name"],
                "district_name": row["district_name"],
                "district_id": row["district_id"],
                "area_m2": row["area_m2"]
            }
        })

    if not features:
        return error_response(message="No green areas found", code=404)

    return success_response({"type": "FeatureCollection", "features": features})


@app.post("/directions")
def get_directions(payload: DirectionsRequest):

    ors_key = get_secret("ORS_KEY")
    if not ors_key:
        return JSONResponse(
            status_code=500,
            content=error_response(message="ORS API key not configured", code=500)
        )

    profile = PROFILE_MAP.get(payload.mode)
    if not profile:
        return JSONResponse(
            status_code=400,
            content=error_response(message="Invalid travel mode", code=400)
        )

    coordinates = [
        [payload.start.lon, payload.start.lat],
        [payload.end.lon, payload.end.lat],
    ]

    try:
        response = requests.post(
            f"https://api.openrouteservice.org/v2/directions/{profile}",
            headers={
                "Authorization": ors_key,
                "Content-Type": "application/json",
            },
            json={
                "coordinates": coordinates,
                "format": "geojson",
                "instructions": False,
            },
            timeout=20,
        )
    except requests.RequestException:
        return JSONResponse(
            status_code=502,
            content=error_response(message="Routing service unavailable", code=502)
        )

    if not response.ok:
        message = "Routing request failed"
        try:
            error_body = response.json()
            message = (
                error_body.get("error", {}).get("message")
                or error_body.get("message")
                or message
            )
        except ValueError:
            if response.text:
                message = response.text

        return JSONResponse(
            status_code=response.status_code,
            content=error_response(message=message, code=response.status_code)
        )

    try:
        data = response.json()
    except ValueError:
        return JSONResponse(
            status_code=502,
            content=error_response(message="Invalid routing response", code=502)
        )

    if isinstance(data, dict) and "features" in data:
        return success_response(data)

    routes = data.get("routes") if isinstance(data, dict) else None
    if not routes:
        return success_response(data)

    route = routes[0]
    geometry = route.get("geometry") if isinstance(route, dict) else None

    coordinates: list[list[float]] | None = None

    if isinstance(geometry, dict) and geometry.get("type") == "LineString":
        coordinates = geometry.get("coordinates")
    elif isinstance(geometry, (list, tuple)):
        coordinates = list(geometry)
    elif isinstance(geometry, str):
        precision = 5
        query_meta = data.get("metadata", {}).get("query", {}) if isinstance(data, dict) else {}
        if isinstance(query_meta, dict):
            precision = int(query_meta.get("geometry_precision", precision))
        coordinates = decode_polyline(geometry, precision=precision)

    if not coordinates:
        return success_response(data)

    feature = {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": coordinates,
        },
        "properties": {
            "summary": route.get("summary"),
        },
    }

    if "bbox" in route:
        feature["bbox"] = route["bbox"]

    feature_collection = {
        "type": "FeatureCollection",
        "features": [feature],
    }

    bbox = data.get("bbox") if isinstance(data, dict) else None
    if bbox:
        feature_collection["bbox"] = bbox
    elif "bbox" in route:
        feature_collection["bbox"] = route["bbox"]

    return success_response(feature_collection)


class RAGRequest(BaseModel):
    question: str
    top_k: int = 7

@app.post("/rag/query")
def rag_query(req: RAGRequest):
    return run_rag_pipeline(req.question, req.top_k)
