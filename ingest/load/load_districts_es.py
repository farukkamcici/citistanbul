import os
import psycopg2
import psycopg2.extras
from elasticsearch import Elasticsearch

# Ortam değişkenlerinden bağlantı bilgileri
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://citistanbul:citistanbul@db:5432/citistanbul")
ELASTIC_URL = os.getenv("ELASTIC_URL", "http://es:9200")

def main():
    print(f"Connecting to Postgres: {DATABASE_URL}")
    print(f"Connecting to Elasticsearch: {ELASTIC_URL}")

    # Postgres bağlantısı
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()

    # Elasticsearch bağlantısı
    es = Elasticsearch(ELASTIC_URL)

    # District geometrilerinden bounding box hesapla
    cur.execute("""
        SELECT 
            district_id,
            district_name,
            ST_XMin(geom) AS min_lon,
            ST_YMin(geom) AS min_lat,
            ST_XMax(geom) AS max_lon,
            ST_YMax(geom) AS max_lat
        FROM city.districts;
    """)
    rows = cur.fetchall()
    print(f"Fetched {len(rows)} districts from PostGIS")

    # Indexe yükle
    for row in rows:
        doc = {
            "district_id": row["district_id"],
            "district_name": row["district_name"],
            "bbox": [
                row["min_lon"],
                row["min_lat"],
                row["max_lon"],
                row["max_lat"],
            ],
        }
        es.index(index="districts", id=row["district_id"], document=doc)

    print(f"✅ {len(rows)} districts indexed to Elasticsearch.")

    cur.close()
    conn.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("❌ Error during district indexing:", e)
