LOAD spatial;

-- İlçe çokgenlerini düzelt + buffer
CREATE OR REPLACE VIEW raw.districts_fix AS
SELECT
  d.district_id,
  d.district_name_tr AS district_name,
  ST_Buffer(ST_MakeValid(d.geom), 0.0003) AS geom
FROM raw.dim_district d;

-- Covers ile eşle
CREATE OR REPLACE TABLE raw.pois_pcd AS
SELECT DISTINCT
  p.poi_id, p.name, p.poi_type, p.subtype, p.source,
  dd.district_id,
  COALESCE(p.district_name, dd.district_name_tr) AS district_name,
  p.address_text, p.lon, p.lat, p.geom,
  p.updated_at
FROM raw.pois_pcd p
LEFT JOIN raw.districts_fix dd
  ON ST_Covers(dd.geom, p.geom);
