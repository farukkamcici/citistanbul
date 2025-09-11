LOAD spatial;

CREATE SCHEMA IF NOT EXISTS raw;
CREATE SCHEMA IF NOT EXISTS stg;

-- 1) MATERIALIZE: dosyadan tabloya yaz
CREATE OR REPLACE TABLE raw.public_toilets_src AS
SELECT * FROM ST_READ('data/raw/geojson_points/public_toilets.geojson');

CREATE OR REPLACE TABLE raw.micro_mobility_src AS
SELECT * FROM ST_READ('data/raw/geojson_points/scooter_parking.geojson');

CREATE OR REPLACE TABLE raw.metro_stations_src AS
SELECT * FROM ST_READ('data/raw/geojson_points/metro_stations.geojson');

CREATE OR REPLACE TABLE raw.ev_chargers_src AS
SELECT * FROM ST_READ('data/raw/geojson_points/ev_chargers.geojson');

CREATE OR REPLACE TABLE raw.kiosks_src AS
SELECT * FROM read_csv(
  'data/raw/csv_addresses/kiosks.csv',
  delim=',',
  header=true,
  all_varchar=true
);

CREATE OR REPLACE TABLE raw.theaters_src AS
SELECT * FROM read_csv(
  'data/raw/csv_addresses/theaters.csv',
  delim=',',
  header=true,
  all_varchar=true
);

CREATE OR REPLACE TABLE raw.health_src AS
SELECT * FROM read_csv('data/raw/csv_addresses/health_inst.csv');

CREATE OR REPLACE TABLE raw.museums_src AS
SELECT * FROM read_csv('data/raw/csv_addresses/museums_geocoded.csv');

CREATE OR REPLACE TABLE raw.green_areas_src AS
SELECT * FROM ST_READ('data/raw/geojson_polygons/green_areas.geojson');

CREATE OR REPLACE TABLE raw.pedest_areas_src AS
SELECT * FROM ST_READ('data/raw/geojson_polygons/pedestrian_areas.geojson');

CREATE OR REPLACE TABLE raw.bike_lanes_src AS
SELECT * FROM ST_READ('data/raw/geojson_lines/bike_lanes.geojson');

CREATE OR REPLACE TABLE raw.district_households AS
SELECT * FROM read_csv('data/interim/csv_district_metrics/district_households_pcd.csv');

CREATE OR REPLACE TABLE raw.district_housing AS
SELECT * FROM read_csv('data/interim/csv_district_metrics/district_housing_prices_pcd.csv');

CREATE OR REPLACE TABLE raw.district_population AS
SELECT * FROM read_csv('data/interim/csv_district_metrics/district_population_pcd.csv');