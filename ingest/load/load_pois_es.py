import os
import psycopg2
import psycopg2.extras
from elasticsearch import Elasticsearch, helpers

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

    # Postgres'ten POI verilerini çek
    cur.execute("""
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
    rows = cur.fetchall()
    print(f"Fetched {len(rows)} POIs from PostGIS")

    # Bulk index için doküman listesi
    actions = []
    for row in rows:
        doc = {
            "_index": "pois",
            "_id": row["poi_id"],
            "_source": {
                "poi_id": row["poi_id"],
                "name": row["name"],
                "poi_type": row["poi_type"],
                "poi_type_label": TYPE_LABELS.get(row["poi_type"], row["poi_type"]),
                "subtype": row["subtype"],
                "district_name": row["district_name"],
                "address_text": row["address_text"],
                "lon": row["lon"],
                "lat": row["lat"],
            },
        }
        actions.append(doc)

    if actions:
        helpers.bulk(es, actions)
        print(f"✅ {len(actions)} POIs indexed to Elasticsearch.")
    else:
        print("⚠️ No POIs found to index.")

    cur.close()
    conn.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("❌ Error during POI indexing:", e)
