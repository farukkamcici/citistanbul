{{ config(materialized='table') }}

WITH population AS (
    SELECT
        district_id,
        district_name,
        'district_metric' AS doc_type,
        'population' AS metric_key,
        CONCAT(district_name, ' ilçesinin toplam nüfusu ',
               CAST(population AS INT), ' kişidir.') AS text
    FROM {{ ref('mart_district_metrics') }}
),

household_size AS (
    SELECT
        district_id,
        district_name,
        'district_metric' AS doc_type,
        'household_size' AS metric_key,
        CONCAT(district_name, ' ilçesinin ortalama hane büyüklüğü ',
               CAST(household_size AS FLOAT), ' kişidir.') AS text
    FROM {{ ref('mart_district_metrics') }}
),

avg_price_m2 AS (
    SELECT
        district_id,
        district_name,
        'district_metric' AS doc_type,
        'avg_price_m2' AS metric_key,
        CONCAT(district_name, ' ilçesinde evlerin ortalama metrekare fiyatı ',
               CAST(avg_price_m2 AS INT), ' ₺’dir.') AS text
    FROM {{ ref('mart_district_metrics') }}
),

avg_rent AS (
    SELECT
        district_id,
        district_name,
        'district_metric' AS doc_type,
        'avg_rent' AS metric_key,
        CONCAT(district_name, ' ilçesinde evlerin ortalama kira fiyatı ',
               CAST(avg_rent AS INT), ' ₺’dir.') AS text
    FROM {{ ref('mart_district_metrics') }}
),

green_area_m2 AS (
    SELECT
        district_id,
        district_name,
        'district_metric' AS doc_type,
        'green_area_m2' AS metric_key,
        CONCAT(district_name, ' ilçesindeki toplam yeşil alan ',
               CAST(green_area_m2 AS INT), ' metrekaredir.') AS text
    FROM {{ ref('mart_district_metrics') }}
),

bike_lane_km AS (
    SELECT
        district_id,
        district_name,
        'district_metric' AS doc_type,
        'bike_lane_km' AS metric_key,
        CONCAT(district_name, ' ilçesinde toplam bisiklet yolu uzunluğu ',
               ROUND(bike_lane_km, 2), ' km’dir.') AS text
    FROM {{ ref('mart_district_metrics') }}
),

pedestrian_length_m AS (
    SELECT
        district_id,
        district_name,
        'district_metric' AS doc_type,
        'pedestrian_length_m' AS metric_key,
        CONCAT(district_name, ' ilçesindeki toplam yaya yolu uzunluğu ',
               ROUND(pedestrian_length_m, 0), ' metredir.') AS text
    FROM {{ ref('mart_district_metrics') }}
),

area_km2 AS (
    SELECT
        district_id,
        district_name,
        'district_metric' AS doc_type,
        'area_km2' AS metric_key,
        CONCAT(district_name, ' ilçesinin yüzölçümü ',
               ROUND(area_km2, 2), ' km²’dir.') AS text
    FROM {{ ref('mart_district_metrics') }}
),

rank_population AS (
    SELECT
        district_id,
        district_name,
        'district_ranking' AS doc_type,
        'rank_population' AS metric_key,
        CONCAT(district_name, ' ilçesi nüfus toplamında ',
               CAST(rank_population AS INT), '. sıradadır.') AS text
    FROM {{ ref('mart_district_rankings') }}
),

rank_household_size AS (
    SELECT
        district_id,
        district_name,
        'district_ranking' AS doc_type,
        'rank_household_size' AS metric_key,
        CONCAT(district_name, ' ilçesi ortalama hane halkı büyüklüğünde ',
               CAST(rank_household_size AS INT), '. sıradadır.') AS text
    FROM {{ ref('mart_district_rankings') }}
),

rank_rent_affordability AS (
    SELECT
        district_id,
        district_name,
        'district_ranking' AS doc_type,
        'rank_rent_affordability' AS metric_key,
        CONCAT(district_name, ' ilçesi kira karşılanabilirliğinde ',
               CAST(rank_rent_affordability AS INT), '. sıradadır.') AS text
    FROM {{ ref('mart_district_rankings') }}
),

rank_house_price_affordability AS (
    SELECT
        district_id,
        district_name,
        'district_ranking' AS doc_type,
        'rank_house_price_affordability' AS metric_key,
        CONCAT(district_name, ' ilçesi konut fiyatı karşılanabilirliğinde ',
               CAST(rank_house_price_affordability AS INT), '. sıradadır.') AS text
    FROM {{ ref('mart_district_rankings') }}
),

rank_total_green_area AS (
    SELECT
        district_id,
        district_name,
        'district_ranking' AS doc_type,
        'rank_total_green_area' AS metric_key,
        CONCAT(district_name, ' ilçesi toplam yeşil alan büyüklüğünde ',
               CAST(rank_total_green_area AS INT), '. sıradadır.') AS text
    FROM {{ ref('mart_district_rankings') }}
),

rank_total_bike_lane AS (
    SELECT
        district_id,
        district_name,
        'district_ranking' AS doc_type,
        'rank_total_bike_lane' AS metric_key,
        CONCAT(district_name, ' ilçesi toplam bisiklet yolu uzunluğunda ',
               CAST(rank_total_bike_lane AS INT), '. sıradadır.') AS text
    FROM {{ ref('mart_district_rankings') }}
),

rank_total_pedestrian AS (
    SELECT
        district_id,
        district_name,
        'district_ranking' AS doc_type,
        'rank_total_pedestrian' AS metric_key,
        CONCAT(district_name, ' ilçesi toplam yaya yolu uzunluğunda ',
               CAST(rank_total_pedestrian AS INT), '. sıradadır.') AS text
    FROM {{ ref('mart_district_rankings') }}
),

rank_green_per_capita AS (
    SELECT
        district_id,
        district_name,
        'district_ranking' AS doc_type,
        'rank_green_per_capita' AS metric_key,
        CONCAT(district_name, ' ilçesi kişi başına düşen yeşil alanda ',
               CAST(rank_green_per_capita AS INT), '. sıradadır.') AS text
    FROM {{ ref('mart_district_rankings') }}
),

rank_bike_lane_density AS (
    SELECT
        district_id,
        district_name,
        'district_ranking' AS doc_type,
        'rank_bike_lane_density' AS metric_key,
        CONCAT(district_name, ' ilçesi bisiklet yolu yoğunluğunda ',
               CAST(rank_bike_lane_density AS INT), '. sıradadır.') AS text
    FROM {{ ref('mart_district_rankings') }}
),

rank_pedestrian_density AS (
    SELECT
        district_id,
        district_name,
        'district_ranking' AS doc_type,
        'rank_pedestrian_density' AS metric_key,
        CONCAT(district_name, ' ilçesi yaya yolu yoğunluğunda ',
               CAST(rank_pedestrian_density AS INT), '. sıradadır.') AS text
    FROM {{ ref('mart_district_rankings') }}
),

rank_poi_per_capita AS (
    SELECT
        district_id,
        district_name,
        'district_ranking' AS doc_type,
        'rank_poi_per_capita' AS metric_key,
        CONCAT(district_name, ' ilçesi kişi başına düşen hizmet noktası/mekan sayısında ',
               CAST(rank_poi_per_capita AS INT), '. sıradadır.') AS text
    FROM {{ ref('mart_district_rankings') }}
),

rank_poi_density AS (
    SELECT
        district_id,
        district_name,
        'district_ranking' AS doc_type,
        'rank_poi_density' AS metric_key,
        CONCAT(district_name, ' ilçesi hizmet noktası/mekan yoğunluğunda ',
               CAST(rank_poi_density AS INT), '. sıradadır.') AS text
    FROM {{ ref('mart_district_rankings') }}
),

rank_environment AS (
    SELECT
        district_id,
        district_name,
        'district_ranking' AS doc_type,
        'rank_environment' AS metric_key,
        CONCAT(district_name, ' ilçesi çevre skorunda ',
               CAST(rank_environment AS INT), '. sıradadır.') AS text
    FROM {{ ref('mart_district_rankings') }}
),

rank_mobility AS (
    SELECT
        district_id,
        district_name,
        'district_ranking' AS doc_type,
        'rank_mobility' AS metric_key,
        CONCAT(district_name, ' ilçesi ulaşım/mobilite skorunda ',
               CAST(rank_mobility AS INT), '. sıradadır.') AS text
    FROM {{ ref('mart_district_rankings') }}
),

rank_housing AS (
    SELECT
        district_id,
        district_name,
        'district_ranking' AS doc_type,
        'rank_housing' AS metric_key,
        CONCAT(district_name, ' ilçesi konut skorunda ',
               CAST(rank_housing AS INT), '. sıradadır.') AS text
    FROM {{ ref('mart_district_rankings') }}
),

rank_overall AS (
    SELECT
        district_id,
        district_name,
        'district_ranking' AS doc_type,
        'rank_overall' AS metric_key,
        CONCAT(district_name, ' ilçesi genel sıralamada ',
               CAST(rank_overall AS INT), '. sıradadır.') AS text
    FROM {{ ref('mart_district_rankings') }}
),

green_per_capita_m2 AS (
    SELECT
        district_id,
        district_name,
        'district_score' AS doc_type,
        'green_per_capita_m2' AS metric_key,
        CONCAT(district_name, ' ilçesinde kişi başına düşen yeşil alan ',
               CAST(green_per_capita_m2 AS FLOAT), ' metrekaredir.') AS text
    FROM {{ ref('mart_district_scores') }}
),

total_pois AS (
    SELECT
        district_id,
        district_name,
        'district_score' AS doc_type,
        'total_pois' AS metric_key,
        CONCAT(district_name, ' ilçesinde toplam ',
               CAST(total_pois AS INT), ' hizmet noktası/mekan bulunmaktadır.') AS text
    FROM {{ ref('mart_district_scores') }}
),

metro_station_count AS (
    SELECT
        district_id,
        district_name,
        'district_poi' AS doc_type,
        'metro_station_count' AS metric_key,
        CONCAT(district_name, ' ilçesinde toplam ',
               CAST(metro_station_count AS INT), ' metro istasyonu bulunmaktadır.') AS text
    FROM {{ ref('mart_poi_summary') }}
),

bus_stop_count AS (
    SELECT
        district_id,
        district_name,
        'district_poi' AS doc_type,
        'bus_stop_count' AS metric_key,
        CONCAT(district_name, ' ilçesinde toplam ',
               CAST(bus_stop_count AS INT), ' otobüs durağı bulunmaktadır.') AS text
    FROM {{ ref('mart_poi_summary') }}
),

tram_station_count AS (
    SELECT
        district_id,
        district_name,
        'district_poi' AS doc_type,
        'tram_station_count' AS metric_key,
        CONCAT(district_name, ' ilçesinde toplam ',
               CAST(tram_station_count AS INT), ' tramvay istasyonu bulunmaktadır.') AS text
    FROM {{ ref('mart_poi_summary') }}
),

ev_charger_count AS (
    SELECT
        district_id,
        district_name,
        'district_poi' AS doc_type,
        'ev_charger_count' AS metric_key,
        CONCAT(district_name, ' ilçesinde toplam ',
               CAST(ev_charger_count AS INT), ' elektrikli araç şarj istasyonu bulunmaktadır.') AS text
    FROM {{ ref('mart_poi_summary') }}
),

health_count AS (
    SELECT
        district_id,
        district_name,
        'district_poi' AS doc_type,
        'health_count' AS metric_key,
        CONCAT(district_name, ' ilçesinde toplam ',
               CAST(health_count AS INT), ' sağlık tesisi bulunmaktadır.') AS text
    FROM {{ ref('mart_poi_summary') }}
),

kiosk_count AS (
    SELECT
        district_id,
        district_name,
        'district_poi' AS doc_type,
        'kiosk_count' AS metric_key,
        CONCAT(district_name, ' ilçesinde toplam ',
               CAST(kiosk_count AS INT), ' büfe bulunmaktadır.') AS text
    FROM {{ ref('mart_poi_summary') }}
),

bike_parking_count AS (
    SELECT
        district_id,
        district_name,
        'district_poi' AS doc_type,
        'bike_parking_count' AS metric_key,
        CONCAT(district_name, ' ilçesinde toplam ',
               CAST(bike_parking_count AS INT), ' bisiklet park yeri bulunmaktadır.') AS text
    FROM {{ ref('mart_poi_summary') }}
),

micro_mobility_parking_count AS (
    SELECT
        district_id,
        district_name,
        'district_poi' AS doc_type,
        'micro_mobility_parking_count' AS metric_key,
        CONCAT(district_name, ' ilçesinde toplam ',
               CAST(micro_mobility_parking_count AS INT), ' mikromobilite park alanı bulunmaktadır.') AS text
    FROM {{ ref('mart_poi_summary') }}
),

museum_count AS (
    SELECT
        district_id,
        district_name,
        'district_poi' AS doc_type,
        'museum_count' AS metric_key,
        CONCAT(district_name, ' ilçesinde toplam ',
               CAST(museum_count AS INT), ' müze bulunmaktadır.') AS text
    FROM {{ ref('mart_poi_summary') }}
),

theater_count AS (
    SELECT
        district_id,
        district_name,
        'district_poi' AS doc_type,
        'theater_count' AS metric_key,
        CONCAT(district_name, ' ilçesinde toplam ',
               CAST(theater_count AS INT), ' tiyatro bulunmaktadır.') AS text
    FROM {{ ref('mart_poi_summary') }}
),

toilet_count AS (
    SELECT
        district_id,
        district_name,
        'district_poi' AS doc_type,
        'toilet_count' AS metric_key,
        CONCAT(district_name, ' ilçesinde toplam ',
               CAST(toilet_count AS INT), ' umumi tuvalet bulunmaktadır.') AS text
    FROM {{ ref('mart_poi_summary') }}
),

faq AS (
    SELECT NULL AS district_id, NULL AS district_name,
           'faq' AS doc_type, 'year' AS metric_key,
           'Bu sistemde kullanılan tüm veriler 2024 yılına aittir.' AS text
    UNION ALL
    SELECT NULL, NULL, 'faq', 'source',
           'Mekânsal veriler İstanbul Büyükşehir Belediyesi (İBB) açık veri portalından alınmıştır.' AS text
    UNION ALL
    SELECT NULL, NULL, 'faq', 'source',
           'Demografik ve konut verileri resmi istatistik kurumlarının 2024 yılı verilerine dayanmaktadır.' AS text
    UNION ALL
    SELECT NULL, NULL, 'faq', 'coverage',
           'Sistem İstanbul’un 39 ilçesini kapsamaktadır.' AS text
    UNION ALL
    SELECT NULL, NULL, 'faq', 'scope',
           'Her ilçe için demografi, konut, ulaşım, yeşil alan ve hizmet noktaları verileri bulunmaktadır.' AS text
    UNION ALL
    SELECT NULL, NULL, 'faq', 'scope',
           'Bu sistem yalnızca İstanbul verilerini içerir, diğer şehirler dahil edilmemiştir.' AS text
    UNION ALL
    SELECT NULL, NULL, 'faq', 'system',
           'Bu sistem bir şehir analitiği platformu olarak geliştirilmiştir.' AS text
    UNION ALL
    SELECT NULL, NULL, 'faq', 'system',
           'Verilerden üretilen yanıtlar, RAG (Retrieval-Augmented Generation) teknolojisi ile sunulmaktadır.' AS text
    UNION ALL
    SELECT NULL, NULL, 'faq', 'system',
           'Sistem yalnızca kamuya açık ve ücretsiz veri kaynaklarını kullanmaktadır.' AS text
)

SELECT
    MD5(COALESCE(district_name,'') || doc_type || metric_key || text) AS doc_id,
    *
FROM (
    SELECT * FROM population
UNION ALL
SELECT * FROM household_size
UNION ALL
SELECT * FROM avg_price_m2
UNION ALL
SELECT * FROM avg_rent
UNION ALL
SELECT * FROM green_area_m2
UNION ALL
SELECT * FROM bike_lane_km
UNION ALL
SELECT * FROM pedestrian_length_m
UNION ALL
SELECT * FROM area_km2
UNION ALL
SELECT * FROM rank_population
UNION ALL
SELECT * FROM rank_household_size
UNION ALL
SELECT * FROM rank_rent_affordability
UNION ALL
SELECT * FROM rank_house_price_affordability
UNION ALL
SELECT * FROM rank_total_green_area
UNION ALL
SELECT * FROM rank_total_bike_lane
UNION ALL
SELECT * FROM rank_total_pedestrian
UNION ALL
SELECT * FROM rank_green_per_capita
UNION ALL
SELECT * FROM rank_bike_lane_density
UNION ALL
SELECT * FROM rank_pedestrian_density
UNION ALL
SELECT * FROM rank_poi_per_capita
UNION ALL
SELECT * FROM rank_poi_density
UNION ALL
SELECT * FROM rank_environment
UNION ALL
SELECT * FROM rank_mobility
UNION ALL
SELECT * FROM rank_housing
UNION ALL
SELECT * FROM rank_overall
UNION ALL
SELECT * FROM green_per_capita_m2
UNION ALL
SELECT * FROM total_pois
UNION ALL
SELECT * FROM metro_station_count
UNION ALL
SELECT * FROM bus_stop_count
UNION ALL
SELECT * FROM tram_station_count
UNION ALL
SELECT * FROM ev_charger_count
UNION ALL
SELECT * FROM health_count
UNION ALL
SELECT * FROM kiosk_count
UNION ALL
SELECT * FROM bike_parking_count
UNION ALL
SELECT * FROM micro_mobility_parking_count
UNION ALL
SELECT * FROM museum_count
UNION ALL
SELECT * FROM theater_count
UNION ALL
SELECT * FROM toilet_count
UNION ALL
SELECT * FROM faq
)


