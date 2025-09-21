from elasticsearch import Elasticsearch, helpers
import psycopg2

# --- Türkçe type labels ---
TYPE_LABELS = {
    "bike_parking": "Bisiklet Parkı",
    "bus_stop": "Otobüs Durağı",
    "ev_charger": "Elektrikli Araç Şarj",
    "health": "Sağlık Tesisi",
    "kiosk": "Büfe",
    "metro_station": "Metro İstasyonu",
    "micro_mobility_parking": "Mikro Mobilite Parkı",
    "museum": "Müze",
    "theater": "Tiyatro",
    "toilet": "Tuvalet",
    "tram_station": "Tramvay İstasyonu",
}

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
    SELECT 
        poi_id, 
        name, 
        poi_type, 
        subtype, 
        district_name, 
        address_text,
        ST_X(geom)::float AS lon,
        ST_Y(geom)::float AS lat
    FROM city.pois;
""")
rows = pg_cur.fetchall()

# Bulk için doküman hazırlığı
actions = []
for row in rows:
    poi_id, name, poi_type, subtype, district_name, address_text, lon, lat = row
    doc = {
        "_index": "pois",
        "_id": poi_id,
        "_source": {
            "poi_id": poi_id,
            "name": name,
            "poi_type": poi_type,
            "poi_type_label": TYPE_LABELS.get(poi_type, poi_type),
            "subtype": subtype,
            "district_name": district_name,
            "address_text": address_text,
            "lon": lon,
            "lat": lat,
        }
    }
    actions.append(doc)

# Elasticsearch'e bulk yükle
helpers.bulk(es, actions)

print(f"{len(actions)} POIs indexed to Elasticsearch")

pg_cur.close()
pg_conn.close()
