LOAD spatial;

-- Null kalan POI’ler için nearest district hesapla
CREATE OR REPLACE TABLE stg.pois_snapped AS
WITH fixed AS (
  SELECT * FROM stg.districts_fix
)
SELECT
  p.poi_id,
  (
    SELECT d.district_id
    FROM fixed d
    ORDER BY ST_Distance(ST_GeomFromText(p.geom_wkt), d.geom)
    LIMIT 1
  ) AS snapped_district_id
FROM stg.pois p
WHERE p.district_id IS NULL;
