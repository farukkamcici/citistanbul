CREATE OR REPLACE TABLE raw.pois_pcd AS
SELECT DISTINCT
  md5(COALESCE(name,'') || '|' || COALESCE(poi_type,'') || '|' || COALESCE(source,'') || '|' || CAST(lon AS VARCHAR) || '|' || CAST(lat AS VARCHAR)) AS poi_id,
  name,
  poi_type,
  source,
  address_text,
  district_name,
  lon, lat, geom,
  now()         AS updated_at,
  subtype
FROM raw.poi_points_raw;
