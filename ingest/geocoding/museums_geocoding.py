import pandas as pd
import requests
from dotenv import load_dotenv
import os

load_dotenv()
API_KEY = os.getenv('GOOGLE_GEOCODING_API_KEY')

museums = pd.read_csv('../../data/raw/csv_addresses/museums.csv')

#add formatted address
# def format_address(row):
#     clean_address = f"{row['Muze Adi'].strip()},{row['Adres'].strip()} {row['Ilce Adi'].strip()}, İstanbul, Türkiye"
#     return clean_address
#
# museums["formatted_address"] = museums.apply(format_address, axis=1)
#
# museums.to_csv('../../data/raw/csv_addresses/museums.csv', index=False)

def get_geocode(row):
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        'address': row['formatted_address'],
        'key': API_KEY
    }

    res = requests.get(url, params=params).json()
    print(res)
    if res['results']:
        loc_data = res['results'][0]['geometry']['location']

        row['lat'] = loc_data['lat']
        row['lon'] = loc_data['lng']
    else:
        row['lat'] = None
        row['lon'] = None

    return row

museums = museums.apply(get_geocode, axis=1)

museums.to_csv('../../data/raw/csv_addresses/museums_geocoded.csv', index=False)