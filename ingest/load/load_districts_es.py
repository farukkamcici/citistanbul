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

pg_cur.execute("SELECT district_id, district_name FROM city.districts;")
rows = pg_cur.fetchall()

for row in rows:
    doc = {
        "district_id": row[0],
        "district_name": row[1]
    }
    es.index(index="districts", document=doc)

print(f"{len(rows)} districts indexed to Elasticsearch")

pg_cur.close()
pg_conn.close()
