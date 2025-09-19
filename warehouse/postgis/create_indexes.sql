-- Districts geometry index
CREATE INDEX IF NOT EXISTS idx_districts_geom
    ON city.districts
    USING GIST (geom);

-- POIs geometry index
CREATE INDEX IF NOT EXISTS idx_pois_geom
    ON city.pois
    USING GIST (geom);

-- Green Areas geometry index
CREATE INDEX IF NOT EXISTS idx_green_areas_geom
    ON city.green_areas
    USING GIST (geom);

-- POIs
CREATE INDEX IF NOT EXISTS idx_pois_district_id
    ON city.pois (district_id);

-- Green Areas
CREATE INDEX IF NOT EXISTS idx_green_areas_district_id
    ON city.green_areas (district_id);

-- District Metrics
CREATE INDEX IF NOT EXISTS idx_metrics_district_id
    ON city.district_metrics (district_id);

-- District Scores
CREATE INDEX IF NOT EXISTS idx_scores_district_id
    ON city.district_scores (district_id);

-- District Rankings
CREATE INDEX IF NOT EXISTS idx_rankings_district_id
    ON city.district_rankings (district_id);

-- POI Summary
CREATE INDEX IF NOT EXISTS idx_summary_district_id
    ON city.poi_summary (district_id);