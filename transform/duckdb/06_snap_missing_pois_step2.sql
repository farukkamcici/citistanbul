LOAD spatial;

CREATE OR REPLACE TABLE raw.pois_pcd AS
SELECT
  COALESCE(s.snapped_district_id, p.district_id) AS district_id,
  p.poi_id, p.name, p.poi_type, p.source,
  COALESCE(p.district_name, d2.district_name) AS district_name,
  p.address_text, p.lon, p.lat, p.geom,
  p.updated_at, p.subtype
FROM raw.pois_pcd p
LEFT JOIN raw.pois_snapped s USING (poi_id)
LEFT JOIN raw.dim_district d2
  ON d2.district_id = COALESCE(s.snapped_district_id, p.district_id)
WHERE COALESCE(s.snap_dist_m, 0) < 500  -- 2 km tolerans, uzak olanları hariç tut
;
