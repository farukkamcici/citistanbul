WITH g AS (
    SELECT
        district_id,
        ROUND(SUM(area_m2), 2) AS green_area_m2
    FROM {{ ref('stg_green_areas') }}
    GROUP BY district_id
),

b AS (
    SELECT
        district_id,
        ROUND(SUM(length_km), 2) AS bike_lane_km
    FROM {{ ref('stg_bike_lanes') }}
    GROUP BY district_id
),

p AS (
    SELECT
        district_id,
        ROUND(SUM(length_m), 2) AS pedestrian_length_m
    FROM {{ ref('stg_pedestrian_areas') }}
    GROUP BY district_id
),

m AS (
    SELECT
        district_id,
        ROUND(
          ST_Area_Spheroid(geom) / 1e6,
          3
        ) AS area_km2
    FROM {{ ref('stg_districts') }}
)

SELECT
    d.*,
    g.green_area_m2,
    b.bike_lane_km,
    p.pedestrian_length_m,
    m.area_km2
FROM {{ ref('stg_district_metrics') }} d
LEFT JOIN g USING (district_id)
LEFT JOIN b USING (district_id)
LEFT JOIN p USING (district_id)
LEFT JOIN m USING (district_id)
