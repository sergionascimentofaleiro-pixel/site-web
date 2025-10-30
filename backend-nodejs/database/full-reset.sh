#!/bin/bash

# Full database reset script for dating app
# Supports both MySQL/MariaDB and PostgreSQL
# This script will:
# 1. Drop and recreate the database
# 2. Create all tables (schema + interests)
# 3. Seed test accounts and profiles
# 4. Seed interests data

echo "========================================="
echo "  Dating App - Full Database Reset"
echo "========================================="
echo ""

# Load DB_TYPE from .env
if [ -f ../.env ]; then
    export $(grep -v '^#' ../.env | grep DB_TYPE | xargs)
fi

DB_TYPE="${DB_TYPE:-mysql}"

echo "Database Type: $DB_TYPE"
echo ""

# Configuration based on DB type
DB_NAME="dating_app"

if [ "$DB_TYPE" = "postgres" ]; then
    # PostgreSQL configuration
    DB_USER="postgres"
    DB_PASS="postgres"
    export PGPASSWORD="$DB_PASS"
    DB_SERVICE="postgresql"
else
    # MySQL/MariaDB configuration (default)
    DB_USER="devuser"
    DB_PASS="Manuela2011!"
    ROOT_PASS="Manuela2011"
    DB_SERVICE="mariadb"
fi

# Step 0: Restart database service
echo "🔄 Restarting $DB_SERVICE service..."
echo ""

# Stop the service (ignore errors if already stopped)
sudo systemctl stop $DB_SERVICE 2>/dev/null || echo "ℹ️  Service was not running"

# Start the service
sudo systemctl start $DB_SERVICE

if [ $? -eq 0 ]; then
    echo "✅ $DB_SERVICE service started successfully"
    # Wait a moment for the service to be fully ready
    sleep 2
else
    echo "❌ Error starting $DB_SERVICE service"
    exit 1
fi

echo ""

echo "⚠️  WARNING: This will DELETE all data in the database!"
echo "Database: $DB_NAME"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Operation cancelled."
    exit 0
fi

echo ""
echo "Starting full reset..."
echo ""

# Step 1: Clean old uploaded photos
echo "1️⃣  Cleaning old uploaded photos..."
UPLOADS_DIR="../uploads/profiles"
if [ -d "$UPLOADS_DIR" ]; then
    # Remove test profile photos (keep user uploaded photos like user_401_*.*)
    rm -f "$UPLOADS_DIR"/woman_*.*
    rm -f "$UPLOADS_DIR"/man_*.*
    echo "✅ Removed old test photos (woman_*.* and man_*.*) from $UPLOADS_DIR"
else
    echo "ℹ️  Uploads directory doesn't exist yet, will be created"
fi

echo ""

# Step 2: Drop and recreate database
echo "2️⃣  Dropping and recreating database..."
if [ "$DB_TYPE" = "postgres" ]; then
    psql -U $DB_USER -h localhost << EOF
DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME WITH ENCODING 'UTF8' TEMPLATE template0;
EOF
else
    mysql -uroot -p$ROOT_PASS << EOF
DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF
fi

if [ $? -eq 0 ]; then
    echo "✅ Database recreated successfully"
else
    echo "❌ Error recreating database"
    exit 1
fi

# Step 3: Create main schema
echo ""
echo "3️⃣  Creating main tables (users, profiles, likes, matches, messages)..."
if [ "$DB_TYPE" = "postgres" ]; then
    psql -U $DB_USER -h localhost -d $DB_NAME -f schema-postgres.sql

    # Grant all privileges on all tables and sequences to the user
    psql -U $DB_USER -h localhost -d $DB_NAME << EOF
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
EOF
else
    mysql -uroot -p$ROOT_PASS $DB_NAME < schema.sql
fi

if [ $? -eq 0 ]; then
    echo "✅ Main schema created successfully"
else
    echo "❌ Error creating main schema"
    exit 1
fi

# Step 4: Create interests schema
echo ""
echo "4️⃣  Creating interests tables..."
if [ "$DB_TYPE" = "postgres" ]; then
    echo "ℹ️  Skipping (already included in main schema for PostgreSQL)"
else
    mysql -uroot -p$ROOT_PASS $DB_NAME < interests-schema.sql
    if [ $? -ne 0 ]; then
        echo "❌ Error creating interests schema"
        exit 1
    fi
    echo "✅ Interests schema created successfully"
fi

# Step 5: Seed interests data
echo ""
echo "5️⃣  Seeding interests data (10 categories, 100 interests)..."
if [ "$DB_TYPE" = "postgres" ]; then
    # Remove MySQL-specific SET commands for PostgreSQL
    grep -v "^SET " interests-seed.sql | psql -U $DB_USER -h localhost -d $DB_NAME > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "❌ Error seeding interests data"
        exit 1
    fi
    echo "✅ Interests data seeded successfully"
else
    mysql -uroot -p$ROOT_PASS --default-character-set=utf8mb4 $DB_NAME < interests-seed.sql
    if [ $? -ne 0 ]; then
        echo "❌ Error seeding interests data"
        exit 1
    fi
    echo "✅ Interests data seeded successfully"
fi

# Step 6: Create interest translation tables
echo ""
echo "6️⃣  Creating interest translation tables..."
if [ "$DB_TYPE" = "postgres" ]; then
    echo "ℹ️  Skipping (already included in main schema for PostgreSQL)"
else
    mysql -uroot -p$ROOT_PASS $DB_NAME < interests-translations-schema.sql
    if [ $? -ne 0 ]; then
        echo "❌ Error creating translation tables"
        exit 1
    fi
    echo "✅ Interest translation tables created successfully"
fi

# Step 7: Seed interest translations
echo ""
echo "7️⃣  Seeding interest translations (en, fr, es, pt)..."
if [ "$DB_TYPE" = "postgres" ]; then
    # Remove MySQL-specific SET commands and convert \' to '' for PostgreSQL
    grep -v "^SET " interests-translations-seed.sql | sed "s/\\\\'/\'\'/g" | psql -U $DB_USER -h localhost -d $DB_NAME
    if [ $? -ne 0 ]; then
        echo "❌ Error seeding translations"
        exit 1
    fi
    echo "✅ Interest translations seeded successfully (4 languages)"
else
    mysql -uroot -p$ROOT_PASS --default-character-set=utf8mb4 $DB_NAME < interests-translations-seed.sql
    if [ $? -ne 0 ]; then
        echo "❌ Error seeding translations"
        exit 1
    fi
    echo "✅ Interest translations seeded successfully (4 languages)"
fi

# Step 8: Create location tables
echo ""
echo "8️⃣  Creating location tables (countries, states, cities)..."
if [ "$DB_TYPE" = "postgres" ]; then
    echo "ℹ️  Skipping (already included in main schema for PostgreSQL)"
else
    mysql -uroot -p$ROOT_PASS $DB_NAME < locations-schema.sql
    if [ $? -ne 0 ]; then
        echo "❌ Error creating location tables"
        exit 1
    fi
    echo "✅ Location tables created successfully"
fi

# Step 9: Import GeoNames data (all countries and cities with population > 500)
echo ""
echo "9️⃣  Importing GeoNames data (countries, states, cities)..."
echo "    This will download and import worldwide location data."
echo "    Download size: ~25 MB, Import time: ~15-20 seconds"
echo ""

# Run the GeoNames import script
bash import-geonames.sh

if [ $? -eq 0 ]; then
    echo "✅ GeoNames data imported successfully"
else
    echo "❌ Error importing GeoNames data"
    echo "    Falling back to basic location data..."
    mysql -uroot -p$ROOT_PASS --default-character-set=utf8mb4 $DB_NAME < locations-seed.sql
fi

# Step 10: Add foreign key constraints for locations in profiles table
echo ""
echo "🔟 Adding location foreign keys to profiles table..."
if [ "$DB_TYPE" = "postgres" ]; then
    psql -U $DB_USER -h localhost -d $DB_NAME -f add-location-foreign-keys.sql
else
    mysql -uroot -p$ROOT_PASS $DB_NAME < add-location-foreign-keys.sql
fi

if [ $? -eq 0 ]; then
    echo "✅ Location foreign keys added successfully"
else
    echo "❌ Error adding location foreign keys"
    exit 1
fi

# Step 11: Generate French test data (200 men + 200 women)
echo ""
echo "1️⃣1️⃣  Generating French test data (200 men + 200 women)..."
echo "    This will create realistic French profiles with:"
echo "    - Gender-appropriate photos from randomuser.me"
echo "    - Random French cities"
echo "    - Random interests (3-8 per profile)"
echo "    - Realistic French names and bios"
echo ""

python3 generate-french-test-data.py

if [ $? -eq 0 ]; then
    echo "✅ French test data generated successfully (400 users total)"
else
    echo "❌ Error generating French test data"
    echo "    Falling back to basic test data..."
    if [ "$DB_TYPE" = "postgres" ]; then
        echo "⚠️  TODO: Adapt seed-data.sql for PostgreSQL"
    else
        mysql -uroot -p$ROOT_PASS --default-character-set=utf8mb4 $DB_NAME < seed-data.sql
        mysql -uroot -p$ROOT_PASS --default-character-set=utf8mb4 $DB_NAME < assign-random-interests.sql > /dev/null 2>&1
    fi
fi

# Summary
echo ""
echo "========================================="
echo "  ✅ Database Reset Complete!"
echo "========================================="
echo ""
echo "Summary:"
if [ "$DB_TYPE" = "postgres" ]; then
    psql -U $DB_USER -h localhost -d $DB_NAME << EOF
SELECT
    (SELECT COUNT(*) FROM users) as "Users",
    (SELECT COUNT(*) FROM profiles) as "Profiles",
    (SELECT COUNT(*) FROM interest_categories) as "Interest Categories",
    (SELECT COUNT(*) FROM interests) as "Interests",
    (SELECT COUNT(*) FROM interest_translations) as "Interest Translations",
    (SELECT COUNT(*) FROM profile_interests) as "Profile-Interest Links",
    (SELECT COUNT(*) FROM countries) as "Countries",
    (SELECT COUNT(*) FROM states) as "States",
    (SELECT COUNT(*) FROM cities) as "Cities";
EOF
else
    mysql -uroot -p$ROOT_PASS $DB_NAME << EOF
SELECT
    (SELECT COUNT(*) FROM users) as 'Users',
    (SELECT COUNT(*) FROM profiles) as 'Profiles',
    (SELECT COUNT(*) FROM interest_categories) as 'Interest Categories',
    (SELECT COUNT(*) FROM interests) as 'Interests',
    (SELECT COUNT(*) FROM interest_translations) as 'Interest Translations',
    (SELECT COUNT(*) FROM profile_interests) as 'Profile-Interest Links',
    (SELECT COUNT(*) FROM countries) as 'Countries',
    (SELECT COUNT(*) FROM states) as 'States',
    (SELECT COUNT(*) FROM cities) as 'Cities';
EOF
fi

echo ""
echo "Test account credentials:"
echo "  Men: homme1@test.fr to homme200@test.fr"
echo "  Women: femme1@test.fr to femme200@test.fr"
echo "  Password: password123"
echo ""
echo "All 400 test accounts are French profiles with:"
echo "  - Realistic French names and bios"
echo "  - Gender-appropriate photos"
echo "  - Random French cities"
echo "  - 3-8 random interests per profile"
echo ""
echo "🎉 Ready to use!"
