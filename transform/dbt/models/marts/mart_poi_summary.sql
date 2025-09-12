with poi_counts as (
    select
        district_id,
        district_name,
        poi_type,
        count(*) as poi_count
    from {{ ref('stg_pois') }}
    group by district_id, district_name, poi_type
)

select
    district_id,
    district_name,
    sum(poi_count) as total_pois,
    sum(case when poi_type = 'metro_station' then poi_count else 0 end) as metro_station_count,
    sum(case when poi_type = 'bus_stop' then poi_count else 0 end) as bus_stop_count,
    sum(case when poi_type = 'tram_station' then poi_count else 0 end) as tram_station_count,
    sum(case when poi_type = 'ev_charger' then poi_count else 0 end) as ev_charger_count,
    sum(case when poi_type = 'health' then poi_count else 0 end) as health_count,
    sum(case when poi_type = 'kiosk' then poi_count else 0 end) as kiosk_count,
    sum(case when poi_type = 'bike_parking' then poi_count else 0 end) as bike_parking_count,
    sum(case when poi_type = 'micro_mobility_parking' then poi_count else 0 end) as micro_mobility_parking_count,
    sum(case when poi_type = 'museum' then poi_count else 0 end) as museum_count,
    sum(case when poi_type = 'theater' then poi_count else 0 end) as theater_count,
    sum(case when poi_type = 'toilet' then poi_count else 0 end) as toilet_count,
from poi_counts
group by district_id, district_name
