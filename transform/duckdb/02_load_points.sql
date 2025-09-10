LOAD spatial;

CREATE OR REPLACE VIEW raw.public_toilets AS
SELECT
  "MAHAL_ADI" AS name,
  "ILCE"      AS district_name,
  "TUVALET_TIP" AS subtype,
  ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_AsText(geom) AS geom_wkt,
  'ibb_public_toilets' AS source, 'toilet' AS poi_type
FROM raw.public_toilets_src;

CREATE OR REPLACE VIEW raw.micro_mobility AS
SELECT
  "Park_Alani" AS name,
  "Ilce"       AS district_name,
  "Park_Tipi"  AS subtype,
  ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_AsText(geom) AS geom_wkt,
  'ibb_micro_mobility' AS source,
  CASE
    WHEN lower("Park_Tipi") LIKE '%scooter%'  THEN 'scooter_parking'
    WHEN lower("Park_Tipi") LIKE '%bisiklet%' THEN 'bike_parking'
    ELSE 'micro_mobility_parking'
  END AS poi_type
FROM raw.micro_mobility_src;

CREATE OR REPLACE VIEW raw.metro_stations AS
SELECT
  "ISTASYON"  AS name,
  "HAT_TURU"  AS subtype,
  ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_AsText(geom) AS geom_wkt,
  'ibb_metro_stations' AS source,
  CASE WHEN lower("HAT_TURU") LIKE '%tram%' THEN 'tram_station'
       ELSE 'metro_station' END AS poi_type
FROM raw.metro_stations_src;

CREATE OR REPLACE VIEW raw.ev_chargers AS
SELECT
  "AD"     AS name,
  "ADRES"  AS address_text,
  ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_AsText(geom) AS geom_wkt,
  'ev_chargers' AS source, 'ev_charger' AS poi_type
FROM raw.ev_chargers_src;

CREATE OR REPLACE VIEW raw.bus_stops AS
SELECT
  "ADI" AS name,
  CAST("ILCEID" AS VARCHAR) AS district_id_raw,
  ST_X(geom) AS lon, ST_Y(geom) AS lat, ST_AsText(geom) AS geom_wkt,
  'iett_bus_stops' AS source, 'bus_stop' AS poi_type
FROM raw.bus_stops_src;

CREATE OR REPLACE VIEW raw.kiosks AS
SELECT
    bufe_ad AS name,
    CAST(longitude AS DOUBLE) AS lon,
    CAST(latitude AS DOUBLE) AS lat,
    ST_AsText(ST_Point(CAST(longitude AS DOUBLE), CAST(latitude AS DOUBLE))) AS geom_wkt,
    'kiosk' AS poi_type,
    'ihe' AS source,
FROM raw.kiosks_src;

CREATE OR REPLACE VIEW raw.theaters AS
SELECT DISTINCT
    THEATER_NAME AS name,
    CAST(LONGITUDE AS DOUBLE) AS lon,
    CAST(LATITUDE AS DOUBLE) AS lat,
    ST_AsText(ST_Point(CAST(LONGITUDE AS DOUBLE), CAST(LATITUDE AS DOUBLE))) AS geom_wkt,
    'theater' AS poi_type,
    'ibb_theater' AS source,
FROM raw.theaters_src;

CREATE OR REPLACE VIEW raw.health AS
SELECT DISTINCT
    "Saglik Tesisi Adi" AS name,
    "ADRES"  AS address_text,
    CAST(Longitude AS DOUBLE) AS lon,
    CAST(Latitude AS DOUBLE) AS lat,
    ST_AsText(ST_Point(CAST(Longitude AS DOUBLE), CAST(Latitude AS DOUBLE))) AS geom_wkt,
    'health' AS poi_type,
    'ibb_health' AS source,
    "Alt Kategori" AS subtype
FROM raw.health_src;


-- 3) Ham noktaları tek tabloda topla
CREATE OR REPLACE TABLE stg.poi_points_raw AS
SELECT name, NULL::VARCHAR AS district_name, NULL::VARCHAR AS address_text, NULL::VARCHAR AS subtype,
       lon, lat, geom_wkt, source, poi_type FROM raw.bus_stops
UNION ALL
SELECT name, district_name, NULL, subtype, lon, lat, geom_wkt, source, poi_type FROM raw.public_toilets
UNION ALL
SELECT name, district_name, NULL, subtype, lon, lat, geom_wkt, source, poi_type FROM raw.micro_mobility
UNION ALL
SELECT name, NULL, address_text, NULL, lon, lat, geom_wkt, source, poi_type FROM raw.ev_chargers
UNION ALL
SELECT name, NULL, NULL, subtype, lon, lat, geom_wkt, source, poi_type FROM raw.metro_stations
UNION ALL
SELECT name, NULL, NULL, NULL, lon, lat, geom_wkt, source, poi_type FROM raw.kiosks
UNION ALL
SELECT name, NULL, NULL, NULL, lon, lat, geom_wkt, source, poi_type FROM raw.theaters
UNION ALL
SELECT name, NULL, address_text, subtype, lon, lat, geom_wkt, source, poi_type FROM raw.health,

