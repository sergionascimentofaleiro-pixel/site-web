#!/bin/bash

# Full database reset script for dating app
# This script will:
# 1. Drop and recreate the database
# 2. Create all tables (schema + interests)
# 3. Seed test accounts and profiles
# 4. Seed interests data

echo "========================================="
echo "  Dating App - Full Database Reset"
echo "========================================="
echo ""

# Configuration
DB_NAME="dating_app"
DB_USER="devuser"
DB_PASS="Manuela2011!"
ROOT_PASS="Manuela2011"

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

# Step 0: Clean old uploaded photos
echo "0️⃣  Cleaning old uploaded photos..."
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

# Step 1: Drop and recreate database
echo "1️⃣  Dropping and recreating database..."
mysql -uroot -p$ROOT_PASS << EOF
DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database recreated successfully"
else
    echo "❌ Error recreating database"
    exit 1
fi

# Step 2: Create main schema
echo ""
echo "2️⃣  Creating main tables (users, profiles, likes, matches, messages)..."
mysql -uroot -p$ROOT_PASS $DB_NAME < schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Main schema created successfully"
else
    echo "❌ Error creating main schema"
    exit 1
fi

# Step 3: Create interests schema
echo ""
echo "3️⃣  Creating interests tables..."
mysql -uroot -p$ROOT_PASS $DB_NAME < interests-schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Interests schema created successfully"
else
    echo "❌ Error creating interests schema"
    exit 1
fi

# Step 4: Seed interests data
echo ""
echo "4️⃣  Seeding interests data (10 categories, 100 interests)..."
mysql -uroot -p$ROOT_PASS --default-character-set=utf8mb4 $DB_NAME < interests-seed.sql

if [ $? -eq 0 ]; then
    echo "✅ Interests data seeded successfully"
else
    echo "❌ Error seeding interests data"
    exit 1
fi

# Step 4.5: Create interest translation tables
echo ""
echo "4️⃣.5 Creating interest translation tables..."
mysql -uroot -p$ROOT_PASS $DB_NAME < interests-translations-schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Interest translation tables created successfully"
else
    echo "❌ Error creating translation tables"
    exit 1
fi

# Step 4.6: Seed interest translations
echo ""
echo "4️⃣.6 Seeding interest translations (en, fr, es, pt)..."
mysql -uroot -p$ROOT_PASS --default-character-set=utf8mb4 $DB_NAME < interests-translations-seed.sql

if [ $? -eq 0 ]; then
    echo "✅ Interest translations seeded successfully (4 languages)"
else
    echo "❌ Error seeding translations"
    exit 1
fi

# Step 4.7: Create location tables
echo ""
echo "4️⃣.7 Creating location tables (countries, states, cities)..."
mysql -uroot -p$ROOT_PASS $DB_NAME < locations-schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Location tables created successfully"
else
    echo "❌ Error creating location tables"
    exit 1
fi

# Step 4.8: Import GeoNames data (all countries and cities with population > 500)
echo ""
echo "4️⃣.8 Importing GeoNames data (countries, states, cities)..."
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

# Step 4.9: Add foreign key constraints for locations in profiles table
echo ""
echo "4️⃣.9 Adding location foreign keys to profiles table..."
mysql -uroot -p$ROOT_PASS $DB_NAME < add-location-foreign-keys.sql

if [ $? -eq 0 ]; then
    echo "✅ Location foreign keys added successfully"
else
    echo "❌ Error adding location foreign keys"
    exit 1
fi

# Step 5: Generate French test data (200 men + 200 women)
echo ""
echo "5️⃣  Generating French test data (200 men + 200 women)..."
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
    mysql -uroot -p$ROOT_PASS --default-character-set=utf8mb4 $DB_NAME < seed-data.sql
    mysql -uroot -p$ROOT_PASS --default-character-set=utf8mb4 $DB_NAME < assign-random-interests.sql > /dev/null 2>&1
fi

# Summary
echo ""
echo "========================================="
echo "  ✅ Database Reset Complete!"
echo "========================================="
echo ""
echo "Summary:"
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
