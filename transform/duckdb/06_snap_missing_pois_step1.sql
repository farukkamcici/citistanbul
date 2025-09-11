LOAD spatial;

-- Null kalan POI’ler için nearest district
CREATE OR REPLACE TABLE raw.pois_snapped AS
WITH fixed AS (
  SELECT district_id, geom FROM raw.districts_fix
)
SELECT
  p.poi_id,
  (
    SELECT d.district_id
    FROM fixed d
    ORDER BY ST_Distance(p.geom, d.geom)
    LIMIT 1
  ) AS snapped_district_id,
  (
    SELECT MIN(ST_Distance(p.geom, d.geom))
    FROM fixed d
  ) AS snap_dist_m
FROM raw.pois_pcd p
WHERE p.district_id IS NULL;
