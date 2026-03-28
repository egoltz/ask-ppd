import pandas as pd
import sqlite3
import glob
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
DB_PATH = os.path.join(DATA_DIR, 'portland.db')
# Data lives in data/DispatchedCalls/ subfolder
XLSX_GLOB = os.path.join(DATA_DIR, 'DispatchedCalls', 'DispatchedCalls_OpenData_*.xlsx')


def is_duplicate(filename):
    """Skip 'DispatchedCalls_OpenData_2024_1 (1).xlsx' — it's a duplicate."""
    return '(1)' in filename


def clean_dispatch(df):
    df.columns = [c.strip() for c in df.columns]

    df['ReportDateTime'] = pd.to_datetime(df['ReportDateTime'], errors='coerce')
    df = df.dropna(subset=['ReportDateTime'])
    df['year'] = df['ReportDateTime'].dt.year
    df['month'] = df['ReportDateTime'].dt.month
    df['date'] = df['ReportDateTime'].dt.strftime('%Y-%m-%d')
    df['hour'] = df['ReportDateTime'].dt.hour

    for col in ['Priority', 'FinalCallGroup', 'FinalCallCategory', 'Neighborhood', 'Address']:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()
            df[col] = df[col].replace('nan', None)

    # Cap response time outliers at 2 hours (7200 sec) to prevent skewed averages
    for col in ['TimeInQueue_sec', 'TravelTime_sec', 'ResponseTime_sec']:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').clip(upper=7200)
        else:
            df[col] = None

    df['PriorityNumber'] = pd.to_numeric(df.get('PriorityNumber'), errors='coerce')
    df['OpenDataLat'] = pd.to_numeric(df.get('OpenDataLat'), errors='coerce')
    df['OpenDataLon'] = pd.to_numeric(df.get('OpenDataLon'), errors='coerce')

    return pd.DataFrame({
        'call_number':       df.get('CallNumber'),
        'date':              df['date'],
        'year':              df['year'],
        'month':             df['month'],
        'hour':              df['hour'],
        'report_month_year': df.get('ReportMonthYear'),
        'priority':          df.get('Priority'),
        'priority_number':   df.get('PriorityNumber'),
        'call_group':        df.get('FinalCallGroup'),
        'call_category':     df.get('FinalCallCategory'),
        'neighborhood':      df.get('Neighborhood'),
        'address':           df.get('Address'),
        'time_in_queue_sec': df.get('TimeInQueue_sec'),
        'travel_time_sec':   df.get('TravelTime_sec'),
        'response_time_sec': df.get('ResponseTime_sec'),
        'lat':               df.get('OpenDataLat'),
        'lon':               df.get('OpenDataLon'),
    })


def main():
    files = sorted(glob.glob(XLSX_GLOB))
    if not files:
        print("ERROR: No DispatchedCalls_OpenData_*.xlsx files found in data/DispatchedCalls/")
        return

    dfs = []
    for f in files:
        name = os.path.basename(f)
        if is_duplicate(name):
            print(f"Skipping duplicate: {name}")
            continue
        print(f"Reading {name}...")
        try:
            df = pd.read_excel(f)
            df = clean_dispatch(df)
            dfs.append(df)
            print(f"  -> {len(df):,} rows")
        except Exception as e:
            print(f"  WARNING: skipping {name} — {e}")

    combined = pd.concat(dfs, ignore_index=True)
    combined = combined.drop_duplicates(subset=['call_number'], keep='first')
    print(f"\nTotal dispatch records after dedup: {len(combined):,}")
    print(f"Year range: {combined['year'].min()} – {combined['year'].max()}")

    conn = sqlite3.connect(DB_PATH)
    combined.to_sql('dispatches', conn, if_exists='replace', index=True, index_label='id')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_disp_neighborhood ON dispatches(neighborhood)')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_disp_year ON dispatches(year)')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_disp_date ON dispatches(date)')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_disp_priority ON dispatches(priority)')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_disp_call_group ON dispatches(call_group)')
    conn.commit()
    conn.close()
    print(f"dispatches table written to {DB_PATH}")


if __name__ == '__main__':
    main()
