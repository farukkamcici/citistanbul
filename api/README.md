CitIstanbul API

Overview
- FastAPI backend exposing city data (district metrics, POIs, green areas, search).
- Depends on PostgreSQL/PostGIS and Elasticsearch.

Quick Start
- Start services: `docker compose up -d db elasticsearch kibana`
- Install deps: `pip install fastapi uvicorn psycopg2-binary python-dotenv elasticsearch`
- Run API (from `api` directory so `.env` loads): `cd api && uvicorn app.main:app --reload --port 8000`
- Open docs: `http://localhost:8000/docs`

Environment
- `POSTGRES_HOST`: PostgreSQL hostname (default `localhost`)
- `POSTGRES_PORT`: PostgreSQL port (default `5432`)
- `POSTGRES_DB`: Database name
- `POSTGRES_USER`: Database user
- `POSTGRES_PASSWORD`: Database password

Notes
- Run the server from inside `api/` so `python-dotenv` loads `api/.env`.
- Elasticsearch client points to `http://localhost:9200` (see `api/app/es.py`).
- Interactive docs available at `/docs` (Swagger) and `/redoc`.

Endpoints
- `GET /health`: Simple health check. Returns `{"status":"ok"}`.
- `GET /districts`: GeoJSON FeatureCollection of all districts.
- `GET /metrics?district=<name>`: Metrics for all districts or a single district if `district` provided.
- `GET /poi?poi_type=<type>[&bbox=minx,miny,maxx,maxy]`: POIs by type, optionally filtered by bounding box in EPSG:4326.
- `GET /poi/nearby?lon=<lon>&lat=<lat>&r=<meters>[&poi_type=<type>]`: POIs around a point within radius `r` meters.
- `GET /search?q=<query>[&size=<n>][&poi_type=<type>]`: Full‑text search across districts and POIs (Elasticsearch).
- `GET /green_areas[?bbox=minx,miny,maxx,maxy]`: GeoJSON FeatureCollection of green areas; optional bbox filter.

Examples
- Health: `curl http://localhost:8000/health`
- District metrics (single): `curl "http://localhost:8000/metrics?district=Beyoğlu"`
- POIs by type: `curl "http://localhost:8000/poi?poi_type=park"`
- POIs in bbox: `curl "http://localhost:8000/poi?poi_type=cafe&bbox=28.95,41.00,29.10,41.10"`
- Nearby POIs: `curl "http://localhost:8000/poi/nearby?lon=28.98&lat=41.04&r=750&poi_type=pharmacy"`
- Search: `curl "http://localhost:8000/search?q=besiktas&size=5"`
- Green areas: `curl http://localhost:8000/green_areas`

Responses
- Success: `{ "status": "success", "data": ..., "message": "ok", "code": 200 }`
- Error: `{ "status": "error", "code": <int>, "message": <string>, "data": null }`

Troubleshooting
- Connection errors: ensure `db` and `elasticsearch` containers are running and credentials in `api/.env` are correct.
- No data returned: verify the database is populated and ES indexes (`districts`, `pois`) exist.
- macOS psycopg build issues: use `psycopg2-binary` as above or install Postgres client headers.
