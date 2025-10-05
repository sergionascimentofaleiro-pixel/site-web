#!/bin/bash

# Script pour injecter UNIQUEMENT des données de test
# N'utiliser que si la base existe déjà (voir init-db.sh)
# Usage: ./seed-db.sh

echo "========================================="
echo "  Dating App - Seed Test Data"
echo "========================================="
echo ""
echo "This will add 40 test accounts with profiles."
echo "Database structure must already exist!"
echo ""

ROOT_PASS="Manuela2011"

# Check if database exists
DB_EXISTS=$(mysql -uroot -p$ROOT_PASS -e "SHOW DATABASES LIKE 'dating_app';" 2>/dev/null | grep dating_app)

if [ -z "$DB_EXISTS" ]; then
    echo "❌ Database 'dating_app' does not exist!"
    echo "Run ./init-db.sh first to create the database."
    exit 1
fi

echo "📊 Clearing existing test data..."
mysql -uroot -p$ROOT_PASS dating_app -e "SET FOREIGN_KEY_CHECKS=0; TRUNCATE TABLE profile_interests; TRUNCATE TABLE profiles; TRUNCATE TABLE users; SET FOREIGN_KEY_CHECKS=1;"

if [ $? -eq 0 ]; then
    echo "✅ Existing data cleared"
else
    echo "❌ Error clearing data"
    exit 1
fi

echo ""
echo "📊 Inserting 40 test accounts and profiles..."
mysql -uroot -p$ROOT_PASS --default-character-set=utf8mb4 dating_app < seed-data.sql > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Test accounts inserted"
else
    echo "❌ Error inserting test data"
    exit 1
fi

echo ""
echo "🎯 Assigning random interests to profiles..."
mysql -uroot -p$ROOT_PASS --default-character-set=utf8mb4 dating_app < assign-random-interests.sql > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Interests assigned"
else
    echo "❌ Error assigning interests"
    exit 1
fi

echo ""
echo "========================================="
echo "  ✅ Test Data Seeded!"
echo "========================================="
echo ""
echo "Test accounts created:"
echo "  👨 Men: john.smith@test.com, michael.jones@test.com, etc."
echo "  👩 Women: emma.johnson@test.com, olivia.williams@test.com, etc."
echo ""
echo "  🔑 Password for all: Test123!"
echo ""
echo "Summary:"
mysql -uroot -p$ROOT_PASS dating_app -e "SELECT (SELECT COUNT(*) FROM users) as Users, (SELECT COUNT(*) FROM profiles) as Profiles, (SELECT COUNT(*) FROM profile_interests) as Interests_Assigned;"
echo ""
echo "See TEST-ACCOUNTS.md for full list"
echo ""
