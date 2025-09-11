LOAD spatial;

-- İlçe çokgenlerini düzelt + buffer
CREATE OR REPLACE VIEW raw.districts_fix AS
SELECT
  d.district_id,
  d.district_name,
  geom
FROM raw.dim_district d;

-- Covers ile eşle
CREATE OR REPLACE TABLE raw.pois_pcd AS
SELECT DISTINCT
  p.poi_id, p.name, p.poi_type, p.subtype, p.source,
  dd.district_id,
  dd.district_name AS district_name,
  p.address_text, p.lon, p.lat, p.geom,
  p.updated_at
FROM raw.pois_pcd p
LEFT JOIN raw.districts_fix dd
  ON ST_Covers(dd.geom, p.geom);
