LOAD SPATIAL;

CREATE OR REPLACE TABLE raw.green_areas_pcd AS
SELECT
  md5(COALESCE(g.name,'') || '|' || COALESCE(g.poi_type,'') || '|' || COALESCE(g.source,'') || '|' || COALESCE(d.district_name,'')) AS area_id,
  g.name,
  g.subtype,
  d.district_name AS district_name,
  d.district_id AS district_id,
  ST_Area(ST_Transform(ST_Intersection(g.geom, d.geom), 'EPSG:4326', 'EPSG:3857')) AS area_m2,
  ST_Intersection(g.geom, d.geom) AS geom,
  g.source,
  g.poi_type
FROM raw.green_areas g
JOIN raw.districts_fix d
  ON ST_Intersects(g.geom, d.geom)
WHERE ST_Area(ST_Transform(ST_Intersection(g.geom, d.geom), 'EPSG:4326', 'EPSG:3857')) > 0;

CREATE OR REPLACE TABLE raw.bike_lanes_pcd AS
SELECT
  md5(COALESCE(b.name,'') || '|' || COALESCE(b.poi_type,'') || '|' || COALESCE(b.source,'') || '|' || COALESCE(d.district_name,'')) AS area_id,
  b.name,
  b.subtype,
  d.district_name AS district_name,
  d.district_id AS district_id,
  ST_Length(ST_Transform(ST_Intersection(b.geom, d.geom), 'EPSG:4326', 'EPSG:3857')) / 1000 AS length_km,
  ST_Intersection(b.geom, d.geom) AS geom,
  b.source,
  b.poi_type
FROM raw.bike_lanes b
JOIN raw.districts_fix d
  ON ST_Intersects(b.geom, d.geom)
WHERE ST_Length(ST_Transform(ST_Intersection(b.geom, d.geom), 'EPSG:4326', 'EPSG:3857')) > 0;

CREATE OR REPLACE TABLE raw.pedestrian_areas_pcd AS
SELECT
  md5(COALESCE(p.name,'') || '|' || COALESCE(p.poi_type,'') || '|' || COALESCE(p.source,'') || '|' || COALESCE(d.district_name,'')) AS area_id,
  p.name,
  p.subtype,
  d.district_name AS district_name,
  d.district_id AS district_id,
  ST_Length(ST_Transform(ST_Intersection(p.geom, d.geom), 'EPSG:4326', 'EPSG:3857')) AS length_m,
  ST_Intersection(p.geom, d.geom) AS geom,
  p.source,
  p.poi_type
FROM raw.pedestrian_areas p
JOIN raw.districts_fix d
  ON ST_Intersects(p.geom, d.geom)
WHERE ST_Length(ST_Transform(ST_Intersection(p.geom, d.geom), 'EPSG:4326', 'EPSG:3857')) > 0;
