CREATE OR REPLACE TABLE stg.pois AS
SELECT
  md5(COALESCE(name,'') || '|' || COALESCE(poi_type,'') || '|' || COALESCE(source,'') || '|' || CAST(lon AS VARCHAR) || '|' || CAST(lat AS VARCHAR)) AS poi_id,
  name,
  poi_type,
  source,
  address_text,
  district_name,
  lon, lat, geom_wkt,
  NULL::DOUBLE  AS geocode_confidence,
  now()         AS updated_at,
  subtype
FROM stg.poi_points_raw;
