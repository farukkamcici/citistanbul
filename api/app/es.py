from elasticsearch import Elasticsearch

def get_es_client():
    return Elasticsearch("http://localhost:9200")