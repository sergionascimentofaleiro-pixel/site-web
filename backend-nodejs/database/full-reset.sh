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

# Step 5: Seed test accounts and profiles
echo ""
echo "5️⃣  Seeding test accounts and profiles (40 users)..."
mysql -uroot -p$ROOT_PASS --default-character-set=utf8mb4 $DB_NAME < seed-data.sql

if [ $? -eq 0 ]; then
    echo "✅ Test accounts and profiles seeded successfully"
else
    echo "❌ Error seeding test data"
    exit 1
fi

# Step 6: Assign random interests to profiles
echo ""
echo "6️⃣  Assigning random interests to test profiles..."
mysql -uroot -p$ROOT_PASS --default-character-set=utf8mb4 $DB_NAME < assign-random-interests.sql > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Interests assigned to profiles successfully"
else
    echo "❌ Error assigning interests to profiles"
    exit 1
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
    (SELECT COUNT(*) FROM profile_interests) as 'Profile-Interest Links';
EOF

echo ""
echo "Test account credentials:"
echo "  Email: john.smith@test.com"
echo "  Password: Test123!"
echo ""
echo "All test accounts use password: Test123!"
echo "See TEST-ACCOUNTS.md for full list"
echo ""
echo "🎉 Ready to use!"
