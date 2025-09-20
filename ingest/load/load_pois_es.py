from elasticsearch import Elasticsearch, helpers
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

# Postgres'ten POIs çek
pg_cur.execute("""
    SELECT poi_id, name, poi_type, subtype, district_name, address_text
    FROM city.pois;
""")
rows = pg_cur.fetchall()

# Bulk için doküman hazırlığı
actions = []
for row in rows:
    doc = {
        "_index": "pois",
        "_id": row[0],  # poi_id'yi ES doküman ID yapıyoruz
        "_source": {
            "poi_id": row[0],
            "name": row[1],
            "poi_type": row[2],
            "subtype": row[3],
            "district_name": row[4],
            "address_text": row[5]
        }
    }
    actions.append(doc)

# Elasticsearch'e bulk yükle
helpers.bulk(es, actions)

print(f"{len(actions)} POIs indexed to Elasticsearch")

pg_cur.close()
pg_conn.close()
