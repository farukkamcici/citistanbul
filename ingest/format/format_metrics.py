import pandas as pd

household_df = pd.read_csv('../../data/raw/csv_district_metrics/district_households.csv')
prices_df = pd.read_csv('../../data/raw/csv_district_metrics/district_housing_prices_2025_06.csv')
population_df = pd.read_csv('../../data/raw/csv_district_metrics/district_population.csv')

#clean household df
household_df = household_df.rename(columns={'Ilce': 'district_name',
                                            'Buyukluk': 'household_size',})
household_df = household_df.query("Yil==2024")[['district_name', 'household_size']]
household_df = household_df.to_csv('../../data/interim/csv_district_metrics/district_households_pcd.csv', index=False)

#clean prices df
prices_df = prices_df.rename(columns={'İlçe': 'district_name',
                                      'Ortalama Satış (TL/m²)': 'price_avg_m2',
                                      'Ortalama Kira (TL/ay)': 'rent_avg'})
prices_df = prices_df.to_csv('../../data/interim/csv_district_metrics/district_housing_prices_pcd.csv', index=False)

#clean population df
population_df = population_df.query("Yil==2024")
population_df = population_df.drop(columns=['Yil', 'ilce_kodu', '_id'])
numeric_cols = population_df.select_dtypes(include=['int64', 'float64']).columns
population_df['population'] = population_df[numeric_cols].sum(axis=1)
population_df = population_df.rename(columns={'Ilce': 'district_name'})
population_df = population_df[['district_name', 'population']]
population_df.to_csv('../../data/interim/csv_district_metrics/district_population_pcd.csv', index=False)