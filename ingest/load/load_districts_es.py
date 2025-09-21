from elasticsearch import Elasticsearch
import psycopg2

pg_conn = psycopg2.connect(
    dbname="citistanbul",
    user="citistanbul",
    password="citistanbul",
    host="localhost",
    port=5432
)
pg_cur = pg_conn.cursor()

es = Elasticsearch("http://localhost:9200")

# Districts with bounding box
pg_cur.execute("""
    SELECT 
        district_id,
        district_name,
        ST_XMin(geom) AS min_lon,
        ST_YMin(geom) AS min_lat,
        ST_XMax(geom) AS max_lon,
        ST_YMax(geom) AS max_lat
    FROM city.districts;
""")
rows = pg_cur.fetchall()

for row in rows:
    district_id, district_name, min_lon, min_lat, max_lon, max_lat = row
    doc = {
        "district_id": district_id,
        "district_name": district_name,
        "bbox": [min_lon, min_lat, max_lon, max_lat]
    }
    es.index(index="districts", id=district_id, document=doc)

print(f"{len(rows)} districts indexed to Elasticsearch")

pg_cur.close()
pg_conn.close()
