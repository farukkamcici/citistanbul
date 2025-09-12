WITH poi_count AS (
    SELECT
        district_id,
        COUNT(*) AS total_pois
    FROM {{ ref('stg_pois') }}
    GROUP BY district_id
)

SELECT
    m.district_id,
    m.district_name,
    ROUND(coalesce(m.green_area_m2,0) / nullif(coalesce(m.population,0),0), 3) AS green_per_capita_m2,
    ROUND(coalesce(m.bike_lane_km,0) / nullif(coalesce(m.area_km2,0),0), 3) AS bike_lane_density,
    ROUND((coalesce(m.pedestrian_length_m,0) / 1000.0) / nullif(coalesce(m.area_km2,0),0), 3) AS pedestrian_length_density,
    p.total_pois
FROM {{ ref('mart_district_metrics') }} m
JOIN poi_count p USING (district_id)
