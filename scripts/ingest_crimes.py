import pandas as pd
import sqlite3
import glob
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
DB_PATH = os.path.join(DATA_DIR, 'portland.db')
# Data lives in data/NewOffenses/ subfolder
CSV_GLOB = os.path.join(DATA_DIR, 'NewOffenses', 'New_Offense_Data_*.csv')


def clean_crimes(df, filename):
    df.columns = [c.strip() for c in df.columns]

    df['OccurDate'] = pd.to_datetime(df['OccurDate'], errors='coerce')
    df = df.dropna(subset=['OccurDate'])
    df['year'] = df['OccurDate'].dt.year
    df['month'] = df['OccurDate'].dt.month
    df['date'] = df['OccurDate'].dt.strftime('%Y-%m-%d')

    for col in ['Neighborhood', 'CustomCrimeCategory', 'OffenseCategory',
                'OffenseType', 'CrimeAgainst', 'CouncilDistrict']:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()
            df[col] = df[col].replace('nan', None)

    df['OffenseCount'] = pd.to_numeric(df.get('OffenseCount', 1), errors='coerce').fillna(1).astype(int)
    df['OpenDataLat'] = pd.to_numeric(df.get('OpenDataLat'), errors='coerce')
    df['OpenDataLon'] = pd.to_numeric(df.get('OpenDataLon'), errors='coerce')

    return pd.DataFrame({
        'case_number':           df.get('CaseNumber'),
        'date':                  df['date'],
        'year':                  df['year'],
        'month':                 df['month'],
        'occur_time':            df.get('OccurTime'),
        'report_month_year':     df.get('ReportMonthYear'),
        'address':               df.get('Address'),
        'neighborhood':          df.get('Neighborhood'),
        'council_district':      df.get('CouncilDistrict'),
        'crime_against':         df.get('CrimeAgainst'),
        'offense_category':      df.get('OffenseCategory'),
        'offense_type':          df.get('OffenseType'),
        'custom_crime_category': df.get('CustomCrimeCategory'),
        'offense_count':         df['OffenseCount'],
        'lat':                   df.get('OpenDataLat'),
        'lon':                   df.get('OpenDataLon'),
    })


def main():
    files = sorted(glob.glob(CSV_GLOB))
    if not files:
        print("ERROR: No New_Offense_Data_*.csv files found in data/NewOffenses/")
        return

    dfs = []
    for f in files:
        name = os.path.basename(f)
        print(f"Reading {name}...")
        try:
            df = pd.read_csv(f, low_memory=False)
            df = clean_crimes(df, name)
            dfs.append(df)
            print(f"  -> {len(df):,} rows")
        except Exception as e:
            print(f"  WARNING: skipping {name} — {e}")

    combined = pd.concat(dfs, ignore_index=True)
    combined = combined.drop_duplicates(subset=['case_number', 'offense_type', 'date'], keep='first')
    print(f"\nTotal crime records after dedup: {len(combined):,}")
    print(f"Year range: {combined['year'].min()} – {combined['year'].max()}")
    print(f"Note: 2019 data is not available from PPB open data.")

    conn = sqlite3.connect(DB_PATH)
    combined.to_sql('crimes', conn, if_exists='replace', index=True, index_label='id')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_crimes_neighborhood ON crimes(neighborhood)')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_crimes_category ON crimes(custom_crime_category)')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_crimes_year ON crimes(year)')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_crimes_date ON crimes(date)')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_crimes_district ON crimes(council_district)')
    conn.commit()
    conn.close()
    print(f"crimes table written to {DB_PATH}")


if __name__ == '__main__':
    main()
