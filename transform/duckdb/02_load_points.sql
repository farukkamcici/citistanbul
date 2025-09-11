LOAD spatial;

-- Public Toilets
CREATE OR REPLACE VIEW raw.public_toilets AS
SELECT
  "MAHAL_ADI"   AS name,
  "ILCE"        AS district_name,
  "TUVALET_TIP" AS subtype,
  ST_X(geom)    AS lon,
  ST_Y(geom)    AS lat,
  geom,
  'ibb_public_toilets' AS source,
  'toilet' AS poi_type
FROM raw.public_toilets_src;

-- Micro Mobility
CREATE OR REPLACE VIEW raw.micro_mobility AS
SELECT
  "Park_Alani" AS name,
  "Ilce"       AS district_name,
  "Park_Tipi"  AS subtype,
  ST_X(geom)   AS lon,
  ST_Y(geom)   AS lat,
  geom,
  'ibb_micro_mobility' AS source,
  CASE
    WHEN lower("Park_Tipi") LIKE '%scooter%'  THEN 'scooter_parking'
    WHEN lower("Park_Tipi") LIKE '%bisiklet%' THEN 'bike_parking'
    ELSE 'micro_mobility_parking'
  END AS poi_type
FROM raw.micro_mobility_src;

-- Metro Stations
CREATE OR REPLACE VIEW raw.metro_stations AS
SELECT
  "ISTASYON"  AS name,
  "HAT_TURU"  AS subtype,
  ST_X(geom)  AS lon,
  ST_Y(geom)  AS lat,
  geom,
  'ibb_metro_stations' AS source,
  CASE
    WHEN lower("HAT_TURU") LIKE '%tram%' THEN 'tram_station'
    ELSE 'metro_station'
  END AS poi_type
FROM raw.metro_stations_src;

-- EV Chargers
CREATE OR REPLACE VIEW raw.ev_chargers AS
SELECT
  "AD"    AS name,
  "ADRES" AS address_text,
  ST_X(geom) AS lon,
  ST_Y(geom) AS lat,
  geom,
  'ev_chargers' AS source,
  'ev_charger' AS poi_type
FROM raw.ev_chargers_src;

-- Bus Stops
CREATE OR REPLACE VIEW raw.bus_stops AS
SELECT
  "ADI" AS name,
  "YON_BILGIS" AS subtype,
  ST_X(geom) AS lon,
  ST_Y(geom) AS lat,
  geom,
  'iett_bus_stops' AS source,
  'bus_stop' AS poi_type
FROM raw.bus_stops_src;

-- Kiosks
CREATE OR REPLACE VIEW raw.kiosks AS
SELECT
  bufe_ad AS name,
  CAST(longitude AS DOUBLE) AS lon,
  CAST(latitude AS DOUBLE)  AS lat,
  ST_Point(CAST(longitude AS DOUBLE), CAST(latitude AS DOUBLE)) AS geom,
  'ihe'   AS source,
  'kiosk' AS poi_type
FROM raw.kiosks_src;

-- Theaters
CREATE OR REPLACE VIEW raw.theaters AS
SELECT DISTINCT
  THEATER_NAME AS name,
  CAST(LONGITUDE AS DOUBLE) AS lon,
  CAST(LATITUDE AS DOUBLE)  AS lat,
  ST_Point(CAST(LONGITUDE AS DOUBLE), CAST(LATITUDE AS DOUBLE)) AS geom,
  'ibb_theater' AS source,
  'theater' AS poi_type
FROM raw.theaters_src;

-- Health Inst
CREATE OR REPLACE VIEW raw.health AS
SELECT DISTINCT
  "Saglik Tesisi Adi" AS name,
  "ADRES"             AS address_text,
  CAST(Longitude AS DOUBLE) AS lon,
  CAST(Latitude  AS DOUBLE) AS lat,
  ST_Point(CAST(Longitude AS DOUBLE), CAST(Latitude AS DOUBLE)) AS geom,
  'ibb_health' AS source,
  'health'     AS poi_type,
  "Alt Kategori" AS subtype
FROM raw.health_src;

-- Museums
CREATE OR REPLACE VIEW raw.museums AS
SELECT DISTINCT
  "Muze Adi" AS name,
  "Adres"    AS address_text,
  lon,
  lat,
  ST_Point(CAST(lon AS DOUBLE), CAST(lat AS DOUBLE)) AS geom,
  'ibb_museum' AS source,
  'museum'     AS poi_type
FROM raw.museums_src;

-- Green Areas RAW
CREATE OR REPLACE VIEW raw.green_areas AS
SELECT
  MAHALLE AS name,
  ILCE    AS district_name,
  TUR    AS subtype,
  geom,
  'ibb_green_areas' AS source,
  'green_area'      AS poi_type
FROM raw.green_areas_src;

-- Bike Lanes RAW
CREATE OR REPLACE VIEW raw.bike_lanes AS
SELECT
  PROJE_ADI AS name,
  PRJ_ASAMA AS subtype,
  geom,
  'ibb_bike_lanes' AS source,
  'bike_lane'      AS poi_type
FROM raw.bike_lanes_src;

-- Pedestrian Areas RAW
CREATE OR REPLACE VIEW raw.pedestrian_areas AS
SELECT
  YOL_ISMI AS name,
  YOL_TURU AS subtype,
  geom,
  'ibb_pedestrian_areas' AS source,
  'pedestrian_area'      AS poi_type
FROM raw.pedest_areas_src
WHERE MEVCUT_DURUM <> 'YAYALAŞTIRMA YOK';

-- Collect all POI Points
CREATE OR REPLACE TABLE raw.poi_points_raw AS
SELECT name, NULL::VARCHAR AS district_name, NULL::VARCHAR AS address_text, subtype, lon, lat, geom, source, poi_type FROM raw.bus_stops
UNION ALL
SELECT name, district_name, NULL, subtype, lon, lat, geom, source, poi_type FROM raw.public_toilets
UNION ALL
SELECT name, district_name, NULL, subtype, lon, lat, geom, source, poi_type FROM raw.micro_mobility
UNION ALL
SELECT name, NULL, address_text, NULL, lon, lat, geom, source, poi_type FROM raw.ev_chargers
UNION ALL
SELECT name, NULL, NULL, subtype, lon, lat, geom, source, poi_type FROM raw.metro_stations
UNION ALL
SELECT name, NULL, NULL, NULL, lon, lat, geom, source, poi_type FROM raw.kiosks
UNION ALL
SELECT name, NULL, NULL, NULL, lon, lat, geom, source, poi_type FROM raw.theaters
UNION ALL
SELECT name, NULL, address_text, subtype, lon, lat, geom, source, poi_type FROM raw.health
UNION ALL
SELECT name, NULL, address_text, NULL, lon, lat, geom, source, poi_type FROM raw.museums;

-- Collect Green Areas
CREATE OR REPLACE TABLE raw.green_areas_raw AS
SELECT * FROM raw.green_areas;

-- Collect Bike Lanes
CREATE OR REPLACE TABLE raw.bike_lanes_raw AS
SELECT * FROM raw.bike_lanes;

-- Collect Pedestrian Areas
CREATE OR REPLACE TABLE raw.pedestrian_areas_raw AS
SELECT * FROM raw.pedestrian_areas;
