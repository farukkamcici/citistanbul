#!/bin/bash
set -e  # hata olursa script dursun

DB_PATH="data/interim/citistanbul.duckdb"

STEPS=(
  "01_setup.sql"
  "01_1_materialize_data.sql"
  "02_load_points.sql"
  "03_normalize_points.sql"
  "04_load_districts.sql"
  "05_pois_with_district.sql"
  "06_snap_missing_pois_step1.sql"
  "06_snap_missing_pois_step2.sql"
)

for step in "${STEPS[@]}"; do
  echo ">>> Running $step"
  duckdb $DB_PATH -c ".read transform/duckdb/$step"
done
