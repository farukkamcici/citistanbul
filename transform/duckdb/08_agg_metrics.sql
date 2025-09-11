LOAD spatial;

CREATE OR REPLACE TABLE raw.district_metrics AS
       SELECT
           f.district_id,
           h.district_name,
           p.population,
           h.household_size,
           ho.price_avg_m2 AS avg_price_m2,
           ho.rent_avg AS avg_rent
       FROM raw.district_households h
       JOIN raw.district_population p ON h.district_name = p.district_name
       JOIN raw.district_housing ho ON h.district_name = ho.district_name
       JOIN raw.districts_fix f ON h.district_name = f.district_name_tr;