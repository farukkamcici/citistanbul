import os
import psycopg2
from psycopg2.extras import RealDictCursor

def get_connection():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL environment variable is not set")
    conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
    return conn
