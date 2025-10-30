import csv
import sys
import os

DB_TYPE = os.environ.get('DB_TYPE', 'mysql')
DATABASE_URL = os.environ.get('DATABASE_URL')
DB_NAME = "dating_app"
DB_USER = "postgres"
DB_PASS = "postgres"

# Countries that have states
COUNTRIES_WITH_STATES = {'US', 'BR', 'CA', 'MX', 'AU', 'IN', 'CN', 'RU', 'AR'}

if DB_TYPE == 'postgres':
    import psycopg2
    import psycopg2.extras

    def connect_db():
        # Use DATABASE_URL if available (cloud/proxy mode)
        if DATABASE_URL:
            print("   [PostgreSQL] Connecting with DATABASE_URL")
            return psycopg2.connect(DATABASE_URL)
        else:
            print(f"   [PostgreSQL] Connecting to localhost as {DB_USER}")
            return psycopg2.connect(
                host="localhost",
                user=DB_USER,
                password=DB_PASS,
                database=DB_NAME
            )

    def clear_tables(cursor):
        cursor.execute("TRUNCATE TABLE cities CASCADE")
        cursor.execute("TRUNCATE TABLE states CASCADE")
        cursor.execute("TRUNCATE TABLE countries CASCADE")

    def get_lastrowid(cursor):
        cursor.execute("SELECT lastval()")
        return cursor.fetchone()[0]
else:
    import mysql.connector

    def connect_db():
        return mysql.connector.connect(
            host="localhost",
            user=DB_USER,
            password=DB_PASS,
            database=DB_NAME
        )

    def clear_tables(cursor):
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
        cursor.execute("TRUNCATE TABLE cities")
        cursor.execute("TRUNCATE TABLE states")
        cursor.execute("TRUNCATE TABLE countries")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")

    def get_lastrowid(cursor):
        return cursor.lastrowid

print("   📊 Importing countries...")
conn = connect_db()
cursor = conn.cursor()

# Optimize PostgreSQL for bulk inserts
if DB_TYPE == 'postgres':
    print("   ⚡ Applying PostgreSQL optimizations for bulk inserts...")
    cursor.execute("SET synchronous_commit = OFF")
    cursor.execute("SET work_mem = '256MB'")
    cursor.execute("SET maintenance_work_mem = '512MB'")

# Clear tables
clear_tables(cursor)

# Import countries
country_map = {}
with open('countryInfo.txt', 'r', encoding='utf-8') as f:
    for line in f:
        if line.startswith('#') or not line.strip():
            continue
        parts = line.strip().split('\t')
        if len(parts) < 5:
            continue

        iso = parts[0]
        country = parts[4]
        has_states = iso in COUNTRIES_WITH_STATES

        cursor.execute(
            "INSERT INTO countries (code, name_en, name_fr, name_es, name_pt, has_states) VALUES (%s, %s, %s, %s, %s, %s)",
            (iso, country, country, country, country, has_states)
        )
        country_map[iso] = get_lastrowid(cursor)

conn.commit()
print(f"   ✅ {len(country_map)} countries imported")

# Import states
print("   📊 Importing states...")
state_map = {}
with open('admin1CodesASCII.txt', 'r', encoding='utf-8') as f:
    for line in f:
        parts = line.strip().split('\t')
        if len(parts) < 2:
            continue

        code = parts[0]
        name = parts[1]

        if '.' not in code:
            continue

        country_code, state_code = code.split('.', 1)

        if country_code in COUNTRIES_WITH_STATES and country_code in country_map:
            cursor.execute(
                "INSERT INTO states (country_id, code, name) VALUES (%s, %s, %s)",
                (country_map[country_code], state_code, name)
            )
            state_map[code] = get_lastrowid(cursor)

conn.commit()
print(f"   ✅ {len(state_map)} states imported")

# Import cities (batch insert for performance)
print("   📊 Importing cities (this may take 2-3 minutes)...")
cities_batch = []
city_count = 0
# Larger batch size for remote databases (DATABASE_URL mode)
batch_size = 5000 if DATABASE_URL else 1000

with open('cities500.txt', 'r', encoding='utf-8') as f:
    reader = csv.reader(f, delimiter='\t')
    for row in reader:
        if len(row) < 18:
            continue

        city_name = row[2]  # ASCII name
        latitude = row[4]   # Latitude
        longitude = row[5]  # Longitude
        country_code = row[8]
        admin1_code = row[10]

        if country_code not in country_map:
            continue

        country_id = country_map[country_code]
        state_id = None

        # Check if country has states
        if country_code in COUNTRIES_WITH_STATES:
            full_code = f"{country_code}.{admin1_code}"
            if full_code in state_map:
                state_id = state_map[full_code]

        cities_batch.append((country_id, state_id, city_name, latitude, longitude))

        if len(cities_batch) >= batch_size:
            cursor.executemany(
                "INSERT INTO cities (country_id, state_id, name, latitude, longitude) VALUES (%s, %s, %s, %s, %s)",
                cities_batch
            )
            conn.commit()
            city_count += len(cities_batch)
            # Show progress every 10k cities to reduce console I/O
            if city_count % 10000 == 0 or city_count < 10000:
                print(f"   ... {city_count} cities imported", end='\r')
            cities_batch = []

# Insert remaining cities
if cities_batch:
    cursor.executemany(
        "INSERT INTO cities (country_id, state_id, name, latitude, longitude) VALUES (%s, %s, %s, %s, %s)",
        cities_batch
    )
    conn.commit()
    city_count += len(cities_batch)

print(f"   ✅ {city_count} cities imported          ")

# Reset PostgreSQL settings
if DB_TYPE == 'postgres':
    cursor.execute("RESET synchronous_commit")
    cursor.execute("RESET work_mem")
    cursor.execute("RESET maintenance_work_mem")

cursor.close()
conn.close()

print("\n✅ Import completed successfully!")
