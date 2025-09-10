-- DuckDB'de mekansal fonksiyonlar
INSTALL spatial;
LOAD spatial;

-- Çalışma şemaları
CREATE SCHEMA IF NOT EXISTS raw;      -- dış dosyadan ST_Read ile gelenler
CREATE SCHEMA IF NOT EXISTS stg;      -- normalize edilmiş staging
CREATE SCHEMA IF NOT EXISTS util;     -- küçük yardımcı görünümler vs.
