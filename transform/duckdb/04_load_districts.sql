LOAD spatial;

CREATE OR REPLACE TABLE raw.districts_src AS
SELECT * FROM ST_READ('data/raw/geojson_polygons/district_boundaries.geojson');

CREATE OR REPLACE VIEW raw.dim_district AS
SELECT
  feature_id AS district_id,
  trim(feature_name) AS district_name,     -- "Adalar" gibi
  geom,
FROM raw.districts_src