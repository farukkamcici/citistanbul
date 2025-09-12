with ranked as (
    select
        m.district_id,
        m.district_name,
        m.population,
        m.household_size,
        m.avg_price_m2,
        m.avg_rent,
        m.green_area_m2,
        m.bike_lane_km,
        m.pedestrian_length_m,
        m.area_km2,
        s.green_per_capita_m2,
        s.bike_lane_density,
        s.pedestrian_length_density,
        s.total_pois
    from {{ ref('mart_district_metrics') }} m
    join {{ ref('mart_district_scores') }} s using (district_id)
),

base_rankings as (
    select
        district_id,
        district_name,

        -- demografi & ekonomi
        dense_rank() over (order by population desc) as rank_population,
        dense_rank() over (order by household_size desc) as rank_household_size,
        dense_rank() over (order by avg_rent asc) as rank_rent_affordability,
        dense_rank() over (order by avg_price_m2 asc) as rank_house_price_affordability,

        -- çevre & altyapı (mutlak değerler)
        dense_rank() over (order by green_area_m2 desc) as rank_total_green_area,
        dense_rank() over (order by bike_lane_km desc) as rank_total_bike_lane,
        dense_rank() over (order by pedestrian_length_m desc) as rank_total_pedestrian,

        -- normalize edilmiş yoğunluklar
        dense_rank() over (order by green_per_capita_m2 desc) as rank_green_per_capita,
        dense_rank() over (order by bike_lane_density desc) as rank_bike_lane_density,
        dense_rank() over (order by pedestrian_length_density desc) as rank_pedestrian_density,
        dense_rank() over (order by (total_pois::double / nullif(population,0)) desc) as rank_poi_per_capita,
        dense_rank() over (order by (total_pois::double / nullif(area_km2,0)) desc) as rank_poi_density

    from ranked
)

, composite as (
    select
        *,
        (rank_green_per_capita + rank_pedestrian_density) / 2.0 as env_score,
        (rank_bike_lane_density + rank_poi_per_capita) / 2.0 as mobility_score,
        (rank_rent_affordability + rank_house_price_affordability) / 2.0 as housing_score
    from base_rankings
),

final as (
    select
        *,
        dense_rank() over (order by env_score asc) as rank_environment,
        dense_rank() over (order by mobility_score asc) as rank_mobility,
        dense_rank() over (order by housing_score asc) as rank_housing,
        dense_rank() over (
            order by (env_score + mobility_score + housing_score) / 3.0 asc
        ) as rank_overall
    from composite
)

select *
from final
