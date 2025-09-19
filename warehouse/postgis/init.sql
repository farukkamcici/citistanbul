CREATE SCHEMA IF NOT EXISTS city;

-- 1. Districts
CREATE TABLE IF NOT EXISTS city.districts (
    district_id   INT PRIMARY KEY,
    district_name TEXT NOT NULL,
    geom          GEOMETRY(MULTIPOLYGON, 4326) NOT NULL
);

-- 2. POIs
CREATE TABLE IF NOT EXISTS city.pois (
    district_id   INT,
    poi_id        TEXT,
    name          TEXT,
    poi_type      TEXT,
    source        TEXT,
    district_name TEXT,
    address_text  TEXT,
    lon           DOUBLE PRECISION,
    lat           DOUBLE PRECISION,
    geom          GEOMETRY(POINT, 4326),
    subtype       TEXT
);

-- 3. Green Areas
CREATE TABLE IF NOT EXISTS city.green_areas (
    area_id      TEXT PRIMARY KEY,
    name          TEXT,
    subtype       TEXT,
    district_name TEXT,
    district_id   INT,
    area_m2       DOUBLE PRECISION,
    geom          GEOMETRY(MULTIPOLYGON, 4326),
    source        TEXT,
    poi_type      TEXT
);

-- 4. District Metrics (mart)
CREATE TABLE IF NOT EXISTS city.district_metrics (
    district_id          INT PRIMARY KEY,
    district_name        TEXT,
    population           DOUBLE PRECISION,
    household_size       DOUBLE PRECISION,
    avg_price_m2         BIGINT,
    avg_rent             DOUBLE PRECISION,
    green_area_m2        DOUBLE PRECISION,
    bike_lane_km         DOUBLE PRECISION,
    pedestrian_length_m  DOUBLE PRECISION,
    area_km2             DOUBLE PRECISION
);

-- 5. District Rankings (mart)
CREATE TABLE IF NOT EXISTS city.district_rankings (
    district_id                    INT PRIMARY KEY,
    district_name                  TEXT,
    rank_population                BIGINT,
    rank_household_size            BIGINT,
    rank_rent_affordability        BIGINT,
    rank_house_price_affordability BIGINT,
    rank_total_green_area          BIGINT,
    rank_total_bike_lane           BIGINT,
    rank_total_pedestrian          BIGINT,
    rank_green_per_capita          BIGINT,
    rank_bike_lane_density         BIGINT,
    rank_pedestrian_density        BIGINT,
    rank_poi_per_capita            BIGINT,
    rank_poi_density               BIGINT,
    rank_environment               BIGINT,
    rank_mobility                  BIGINT,
    rank_housing                   BIGINT,
    rank_overall                   BIGINT
);

-- 6. District Scores (mart)
CREATE TABLE IF NOT EXISTS city.district_scores (
    district_id               INT PRIMARY KEY,
    district_name             TEXT,
    green_per_capita_m2       DOUBLE PRECISION,
    bike_lane_density         DOUBLE PRECISION,
    pedestrian_length_density DOUBLE PRECISION,
    total_pois                BIGINT
);

-- 7. POI Summary (mart)
CREATE TABLE IF NOT EXISTS city.poi_summary (
    district_id                  INT PRIMARY KEY,
    district_name                TEXT,
    total_pois                   BIGINT,
    metro_station_count          BIGINT,
    bus_stop_count               BIGINT,
    tram_station_count           BIGINT,
    ev_charger_count             BIGINT,
    health_count                 BIGINT,
    kiosk_count                  BIGINT,
    bike_parking_count           BIGINT,
    micro_mobility_parking_count BIGINT,
    museum_count                 BIGINT,
    theater_count                BIGINT,
    toilet_count                 BIGINT
);
