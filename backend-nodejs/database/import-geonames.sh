#!/bin/bash

# Optimized script to download and import GeoNames data
# Uses batch inserts for better performance

echo "========================================="
echo "  GeoNames Data Import (Optimized)"
echo "========================================="
echo ""

# Load DB_TYPE from .env
if [ -f ../.env ]; then
    export $(grep -v '^#' ../.env | grep DB_TYPE | xargs)
fi

DB_TYPE="${DB_TYPE:-mysql}"
DB_NAME="dating_app"
BATCH_SIZE=1000

echo "Database Type: $DB_TYPE"
echo ""

if [ "$DB_TYPE" = "postgres" ]; then
    DB_USER="postgres"
    DB_PASS="postgres"
    export PGPASSWORD="$DB_PASS"
else
    ROOT_PASS="Manuela2011"
    DB_USER="devuser"
    DB_PASS="Manuela2011!"
fi

# Create temporary directory
mkdir -p geonames_data
cd geonames_data

echo "1️⃣  Downloading country data..."
if [ ! -f "countryInfo.txt" ]; then
    wget -q --show-progress http://download.geonames.org/export/dump/countryInfo.txt
    echo "✅ Country data downloaded"
else
    echo "✅ Country data already exists"
fi

echo ""
echo "2️⃣  Downloading cities data (cities with population > 500)..."
if [ ! -f "cities500.zip" ]; then
    wget -q --show-progress http://download.geonames.org/export/dump/cities500.zip
    unzip -q cities500.zip
    echo "✅ Cities data downloaded and extracted"
else
    if [ ! -f "cities500.txt" ]; then
        unzip -q cities500.zip
    fi
    echo "✅ Cities data already exists"
fi

echo ""
echo "3️⃣  Downloading admin divisions (states/provinces)..."
if [ ! -f "admin1CodesASCII.txt" ]; then
    wget -q --show-progress http://download.geonames.org/export/dump/admin1CodesASCII.txt
    echo "✅ Admin divisions data downloaded"
else
    echo "✅ Admin divisions data already exists"
fi

echo ""
echo "4️⃣  Processing and importing data..."
echo "   This uses Python for better performance and data handling."

# Create Python script for processing
cat > process_geonames.py << PYEOF
import csv
import sys
import os

DB_TYPE = os.environ.get('DB_TYPE', 'mysql')
DATABASE_URL = os.environ.get('DATABASE_URL')
DB_NAME = "$DB_NAME"
DB_USER = "$DB_USER"
DB_PASS = "$DB_PASS"

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
PYEOF

# Check if Python and required database connector are available
if command -v python3 &> /dev/null; then
    if [ "$DB_TYPE" = "postgres" ]; then
        python3 -c "import psycopg2" 2> /dev/null
        if [ $? -eq 0 ]; then
            # Run Python script
            python3 process_geonames.py
            import_status=$?
        else
            echo "❌ Python psycopg2 not installed"
            echo "   Installing psycopg2-binary..."
            pip3 install --user psycopg2-binary > /dev/null 2>&1
            if [ $? -eq 0 ]; then
                python3 process_geonames.py
                import_status=$?
            else
                echo "❌ Failed to install psycopg2-binary"
                import_status=1
            fi
        fi
    else
        python3 -c "import mysql.connector" 2> /dev/null
        if [ $? -eq 0 ]; then
            # Run Python script
            python3 process_geonames.py
            import_status=$?
        else
            echo "❌ Python mysql-connector-python not installed"
            echo "   Installing mysql-connector-python..."
            pip3 install --user mysql-connector-python > /dev/null 2>&1
            if [ $? -eq 0 ]; then
                python3 process_geonames.py
                import_status=$?
            else
                echo "❌ Failed to install mysql-connector-python"
                import_status=1
            fi
        fi
    fi
else
    echo "❌ Python3 not found"
    import_status=1
fi

if [ $import_status -eq 0 ]; then
    echo ""
    echo "5️⃣  Getting statistics..."
    if [ "$DB_TYPE" = "postgres" ]; then
        psql -U $DB_USER -h localhost -d $DB_NAME << EOF
SELECT
    (SELECT COUNT(*) FROM countries) as "Countries",
    (SELECT COUNT(*) FROM states) as "States",
    (SELECT COUNT(*) FROM cities) as "Cities";
EOF
    else
        mysql -uroot -p$ROOT_PASS $DB_NAME << EOF
SELECT
    (SELECT COUNT(*) FROM countries) as 'Countries',
    (SELECT COUNT(*) FROM states) as 'States',
    (SELECT COUNT(*) FROM cities) as 'Cities';
EOF
    fi

    echo ""
    echo "========================================="
    echo "  ✅ GeoNames Import Complete!"
    echo "========================================="
else
    echo ""
    echo "❌ Import failed. Falling back to basic data..."
    cd ..
    exit 1
fi

cd ..
