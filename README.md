CitIstanbul

An interactive city analytics platform for Istanbul. It combines a FastAPI backend, a Next.js + MapLibre frontend, a PostGIS warehouse, Elasticsearch-powered search, and a lightweight DuckDB pipeline for transforming open datasets (POIs, districts, mobility, housing, and green areas).

Key components
- Backend: FastAPI service exposing districts, metrics, POIs, green areas, and search endpoints.
- Frontend: Next.js app rendering an interactive map with layers, search, and nearby POIs.
- Warehouse: PostgreSQL/PostGIS schema for geospatial data and aggregated metrics.
- Search: Elasticsearch indexes for fast fuzzy search of districts and POIs; optional Kibana.
- Transform: DuckDB SQL pipeline to ingest/normalize raw files into tabular and geospatial outputs.

Quick start
1) Start infra services
- Requirements: Docker, Docker Compose
- Run: `docker compose up -d db elasticsearch kibana`
- PostGIS: listening on `localhost:5432` with database/user/password `citistanbul`
- Elasticsearch: `http://localhost:9200` (no security), Kibana: `http://localhost:5601`

2) Prepare the PostGIS schema
- Create tables: `psql -h localhost -U citistanbul -d citistanbul -f warehouse/postgis/init.sql`
- Create indexes: `psql -h localhost -U citistanbul -d citistanbul -f warehouse/postgis/create_indexes.sql`

3) (Optional) Run DuckDB transform pipeline
- Requirement: DuckDB with the `spatial` extension
- Run: `bash scripts/refresh_duckdb.sh`
- Input files: under `data/raw/**` (GeoJSON/CSV) and `data/interim/**`
- Purpose: materialize raw sources, normalize POIs and areas, create per‑district aggregations
- Note: This repo does not include an automated step to load DuckDB outputs into PostGIS. Populate PostGIS tables (`city.districts`, `city.pois`, `city.green_areas`, `city.district_metrics`, `city.district_scores`, `city.district_rankings`) using your preferred approach (COPY from CSV, ogr2ogr, DB links, or ad‑hoc scripts). The DuckDB SQL under `transform/duckdb` documents expected shapes.

4) Seed Elasticsearch (optional but required for /search)
- Install Python deps: `pip install elasticsearch psycopg2-binary python-dotenv`
- Index districts: `python ingest/load/load_districts_es.py` (reads PostGIS and writes `districts` index with bbox)
- Index POIs: `python ingest/load/load_pois_es.py` (writes `pois` index with Turkish labels)

5) Run the API
- Requirements: Python 3.11+ (FastAPI, Uvicorn, psycopg2, python-dotenv, elasticsearch)
- Env: copy `api/.env` and set Postgres connection (defaults already match Docker Compose)
- Start: `cd api && uvicorn app.main:app --reload --port 8000`
- Docs: `http://localhost:8000/docs`

6) Run the frontend
- Requirements: Node 18+
- Env: set `frontend/.env.development`
  - `NEXT_PUBLIC_API_URL=http://localhost:8000` (or your deployed API)
  - `NEXT_PUBLIC_MAPTILER_KEY=<your_maptiler_key>`
- Start: `cd frontend && npm install && npm run dev`
- Open: `http://localhost:3000`

Environment variables
- API (api/.env)
  - `POSTGRES_HOST` (default `localhost`)
  - `POSTGRES_PORT` (default `5432`)
  - `POSTGRES_DB` (default `citistanbul`)
  - `POSTGRES_USER` (default `citistanbul`)
  - `POSTGRES_PASSWORD` (default `citistanbul`)
  - `ORS_API_KEY`: OpenRouteService key used for `/directions`
- Frontend (frontend/.env.*)
  - `NEXT_PUBLIC_API_URL`: Base URL of the FastAPI service
  - `NEXT_PUBLIC_MAPTILER_KEY`: Maptiler API key for the basemap style
- Root `.env`
  - May hold ad‑hoc keys used by data utilities (e.g., geocoding). Avoid committing real secrets.

API overview (FastAPI)
- `GET /health`: health check
- `GET /districts`: GeoJSON FeatureCollection of districts
- `GET /metrics?district=<name>`: aggregated metrics for all districts or a specific one
- `GET /poi?poi_type=<type>[&bbox=minx,miny,maxx,maxy]`: POIs by type; optional bbox filter (EPSG:4326)
- `GET /poi/nearby?lon=<lon>&lat=<lat>&r=<meters>[&poi_type=<type>]`: POIs near a point with optional type filter
- `GET /green_areas[?bbox=minx,miny,maxx,maxy]`: green area polygons (limited by bbox or top N by area)
- `GET /search?q=<q>[&size=<n>][&poi_type=<type>]`: fuzzy search across districts and POIs via Elasticsearch
- `POST /directions`: proxy to OpenRouteService returning GeoJSON routes for walk/bike/car profiles

Frontend overview (Next.js + MapLibre)
- Map and layers: `frontend/components/*`
  - `BaseMap.tsx`: main map shell with responsive layer toggles, mobile bottom sheets, and POI color legend chips
  - `DistrictLayer.tsx`: district polygons + choropleth by selected metric
  - `PoiLayer.tsx`: clustered point layers by POI type, popups, highlight selection
  - `GreenAreasLayer.tsx`: green areas fill/outline, auto‑refresh on move
  - `UserLocationLayer.tsx`: geolocation marker and permission handling
  - `SelectedPoiLayer.tsx`: emphasized marker + rich popup for a chosen POI
  - `NearbyPanel.tsx`: “near me” drawer that groups nearby POIs by category
  - `SearchBar.tsx`: ES‑backed search with district bbox zoom and POI fly‑to
  - `DirectionsSidebar.tsx`: responsive directions experience (desktop sidebar + mobile sheet with swipe/peek states)
  - `poi-config.ts`: shared POI labels/colors/categories reused across map layers and UI legends
- App shell: `frontend/app/*` (`layout.tsx`, `page.tsx`)
- UI primitives: `frontend/components/ui/*` (Radix wrappers and utilities)

Data and transforms (DuckDB)
- Entry script: `scripts/refresh_duckdb.sh` runs SQL in order
- SQL stages: `transform/duckdb/*.sql`
  - `01_setup.sql`: install/load spatial, create schemas
  - `01_1_materialize_data.sql`: read GeoJSON/CSV into raw tables
  - `02_load_points.sql`, `03_normalize_points.sql`: unify point POIs and de‑duplicate
  - `04_load_districts.sql`: load district boundaries
  - `05_pois_with_district.sql`: spatially assign POIs to districts
  - `07_normalize_areas_lines.sql`: intersect areas/lines with districts and compute area/length
  - `08_agg_metrics.sql`: join population, households, housing prices into metrics
- Intermediate/output data: `data/interim/**` (DuckDB file and CSVs)

Search indexing (Elasticsearch)
- `ingest/load/load_districts_es.py`: indexes district names + bbox to `districts`
- `ingest/load/load_pois_es.py`: indexes POIs with Turkish labels to `pois`
- Kibana is available at `http://localhost:5601` for ad‑hoc exploration

Makefile targets
- `refresh_duckdb`: run DuckDB pipeline
- `dbt_run`: placeholder to invoke dbt models under `transform/dbt`
- `api`: run API in dev mode
- `frontend`: run Next.js dev server
- `test`, `lint`, `clean`: standard local helpers (note: not all tools are configured)

Directory-by-directory
- `api/`: FastAPI app
  - `app/main.py`: endpoints, CORS, error handlers
  - `app/db.py`: Postgres connection (RealDictCursor)
  - `app/utils.py`: response helpers, bbox parsing, POI labels
  - `app/es.py`: Elasticsearch client
  - `README.md`: API quick start and endpoint docs
- `frontend/`: Next.js app (App Router)
  - `app/`: layout and entry page
  - `components/`: map layers, UI, and utilities (including shared POI config and responsive sheets)
  - `lib/utils.ts`: classnames merge util
  - `.env.development`: API URL and Maptiler key for dev
- `data/`: datasets
  - `raw/`: source files (GeoJSON/CSV) for points/lines/polygons and metrics
  - `interim/`: DuckDB database and derived CSVs for metrics and POI summaries
- `transform/`: pipelines
  - `duckdb/`: SQL stages described above
  - `dbt/`: dbt project scaffold and target artifacts
- `warehouse/`: database DDL and indexes for PostGIS
  - `postgis/init.sql`: create `city.*` tables (districts, pois, green_areas, metrics, scores, rankings, summaries)
  - `postgis/create_indexes.sql`: GIS and foreign key indexes
- `ingest/`: utilities for formatting, geocoding, and indexing
  - `format/`: small pandas scripts to clean raw metric CSVs
  - `geocoding/museums_geocoding.py`: optional geocoding utility for museums (uses Google Geocoding API)
  - `load/`: Elasticsearch loaders reading from PostGIS
- `scripts/`: helper scripts (e.g., `refresh_duckdb.sh`)
- `docker-compose.yml`: PostGIS, Elasticsearch, Kibana services
- `Makefile`: convenience commands

Notes and assumptions
- Populate PostGIS: API endpoints expect data in `city.*` tables. Use any ETL method to load from your processed outputs.
- Coordinate systems: All endpoints and bbox parameters assume EPSG:4326 (lon, lat).
- Secrets: Do not commit real API keys. Replace placeholders in env files with your own values.
- Production: Consider securing Elasticsearch, enabling CORS for your frontend origin, and using managed Postgres hosting.

Troubleshooting
- API cannot connect to DB: verify Docker Compose `db` is up and `api/.env` matches; try `psql -h localhost -U citistanbul -d citistanbul`.
- Empty search results: ensure ES is up (`curl :9200`), and run the two loader scripts to index `districts` and `pois`.
- Frontend map blank: make sure `NEXT_PUBLIC_MAPTILER_KEY` is valid and API URL is reachable from the browser.
