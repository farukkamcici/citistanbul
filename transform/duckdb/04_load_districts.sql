LOAD spatial;

-- Kaynak: district_boundaries.geojson
CREATE OR REPLACE TABLE raw.districts_src AS
SELECT * FROM ST_READ('data/raw/geojson_polygons/district_boundaries.json');

-- Kanonik kimlik = osm_id, Ad = display_name'in ilk parçası
CREATE OR REPLACE VIEW raw.dim_district AS
SELECT
  CAST("osm_id" AS BIGINT)                 AS district_id,
  trim(split_part("display_name", ',', 1)) AS district_name_tr,     -- "Adalar" gibi
  geom,
  ST_AsText(geom)                          AS geom_wkt
FROM raw.districts_src;
