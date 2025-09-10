LOAD spatial;

-- Eski tabloyu güncelle: boş olanlara snapped_id yaz
CREATE OR REPLACE TABLE stg.pois_pcd AS
SELECT
  COALESCE(s.snapped_district_id, p.district_id) AS district_id,
  p.poi_id, p.name, p.poi_type, p.source,
  COALESCE(
    p.district_name,
    (SELECT d2.district_name_tr
     FROM stg.dim_district d2
     WHERE d2.district_id = COALESCE(s.snapped_district_id, p.district_id))
  ) AS district_name,
  p.address_text, p.lon, p.lat, p.geom,
  p.updated_at, p.subtype
FROM stg.pois_pcd p
LEFT JOIN stg.pois_snapped s USING (poi_id);
