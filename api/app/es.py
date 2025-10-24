import os

from elasticsearch import Elasticsearch


def get_es_client():
    es_url = os.environ.get("ELASTIC_URL", "http://localhost:9200")
    return Elasticsearch(es_url, sniff_on_start=False, sniff_on_connection_fail=False)
