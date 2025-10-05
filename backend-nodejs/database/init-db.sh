#!/bin/bash

# Script pour initialiser la base de données VIDE (première installation)
# Crée la structure mais n'ajoute PAS de données de test
# Usage: ./init-db.sh

echo "========================================="
echo "  Dating App - Database Initialization"
echo "========================================="
echo ""
echo "This will create an EMPTY database structure."
echo "No test data will be added."
echo ""
echo "For a complete reset WITH test data, use: ./full-reset.sh"
echo ""

ROOT_PASS="Manuela2011"

echo "🔧 Creating database and user..."
mysql -uroot -p$ROOT_PASS < setup.sql

if [ $? -eq 0 ]; then
    echo "✅ Database and user created"
else
    echo "❌ Error creating database"
    exit 1
fi

echo ""
echo "📋 Creating main tables (users, profiles, likes, matches, messages)..."
mysql -uroot -p$ROOT_PASS dating_app < schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Main tables created"
else
    echo "❌ Error creating main tables"
    exit 1
fi

echo ""
echo "📋 Creating interest tables..."
mysql -uroot -p$ROOT_PASS dating_app < interests-schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Interest tables created"
else
    echo "❌ Error creating interest tables"
    exit 1
fi

echo ""
echo "🌱 Seeding interest categories and interests..."
mysql -uroot -p$ROOT_PASS --default-character-set=utf8mb4 dating_app < interests-seed.sql

if [ $? -eq 0 ]; then
    echo "✅ Interests seeded (10 categories, 100 interests)"
else
    echo "❌ Error seeding interests"
    exit 1
fi

echo ""
echo "🌍 Creating interest translation tables..."
mysql -uroot -p$ROOT_PASS dating_app < interests-translations-schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Interest translation tables created"
else
    echo "❌ Error creating translation tables"
    exit 1
fi

echo ""
echo "🌱 Seeding interest translations (en, fr, es, pt)..."
mysql -uroot -p$ROOT_PASS --default-character-set=utf8mb4 dating_app < interests-translations-seed.sql

if [ $? -eq 0 ]; then
    echo "✅ Interest translations seeded (4 languages)"
else
    echo "❌ Error seeding translations"
    exit 1
fi

echo ""
echo "🌍 Creating location tables (countries, states, cities)..."
mysql -uroot -p$ROOT_PASS dating_app < locations-schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Location tables created"
else
    echo "❌ Error creating location tables"
    exit 1
fi

echo ""
echo "🌱 Seeding location data..."
mysql -uroot -p$ROOT_PASS --default-character-set=utf8mb4 dating_app < locations-seed.sql

if [ $? -eq 0 ]; then
    echo "✅ Location data seeded (10 countries, states, cities)"
else
    echo "❌ Error seeding locations"
    exit 1
fi

echo ""
echo "🔗 Adding location foreign keys to profiles table..."
mysql -uroot -p$ROOT_PASS dating_app < add-location-foreign-keys.sql

if [ $? -eq 0 ]; then
    echo "✅ Location foreign keys added"
else
    echo "❌ Error adding location foreign keys"
    exit 1
fi

echo ""
echo "========================================="
echo "  ✅ Database Initialized!"
echo "========================================="
echo ""
echo "Configuration:"
echo "  - Database: dating_app"
echo "  - User: devuser"
echo "  - Password: Manuela2011!"
echo ""
echo "Next steps:"
echo "  1. Start backend: cd ../.. && npm run dev"
echo "  2. Or add test data: ./seed-db.sh"
echo ""
