LOAD spatial;

-- POI noktalarını geometriye çevir
CREATE OR REPLACE VIEW stg.pois_geom AS
SELECT p.*, ST_GeomFromText(geom_wkt) AS geom_point
FROM stg.pois p;

-- İlçe çokgenlerini düzelt + buffer
CREATE OR REPLACE VIEW stg.districts_fix AS
SELECT
  d.district_id,
  d.district_name_tr,
  ST_Buffer(ST_MakeValid(d.geom), 0.0003) AS geom
FROM stg.dim_district d;

-- Covers ile eşle
CREATE OR REPLACE TABLE stg.pois AS
SELECT
  p.poi_id, p.name, p.poi_type, p.source,
  dd.district_id,
  COALESCE(p.district_name, dd.district_name_tr) AS district_name,
  p.address_text, p.lon, p.lat, p.geom_wkt, p.geocode_confidence,
  p.updated_at, p.subtype
FROM stg.pois_geom p
LEFT JOIN stg.districts_fix dd
  ON ST_Covers(dd.geom, p.geom_point);
