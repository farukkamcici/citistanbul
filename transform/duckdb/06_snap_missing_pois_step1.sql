LOAD spatial;

-- Null kalan POI’ler için nearest district hesapla
CREATE OR REPLACE TABLE raw.pois_snapped AS
WITH fixed AS (
  SELECT * FROM raw.districts_fix
)
SELECT
  p.poi_id,
  (
    SELECT d.district_id
    FROM fixed d
    ORDER BY ST_Distance(p.geom, d.geom)
    LIMIT 1
  ) AS snapped_district_id
FROM raw.pois_pcd p
WHERE p.district_id IS NULL;
