#!/bin/bash

# Script pour injecter des données de test dans la base de données
# Usage: ./seed-db.sh

echo "🌱 Seeding dating app database with test data..."
echo ""

# Demander le mot de passe root MySQL
read -sp "Mot de passe root MySQL: " MYSQL_ROOT_PASSWORD
echo

echo ""
echo "📊 Injecting 40 test profiles (20 men + 20 women)..."

# Injecter les données
mysql -u root -p"$MYSQL_ROOT_PASSWORD" dating_app < "$(dirname "$0")/seed-data.sql"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database seeded successfully!"
    echo ""
    echo "Test accounts created:"
    echo "  👨 Men: john.smith@test.com, michael.jones@test.com, etc."
    echo "  👩 Women: emma.johnson@test.com, olivia.williams@test.com, etc."
    echo ""
    echo "  🔑 Password for all accounts: Test123!"
    echo ""
    echo "You can now login with any of these accounts and test the app!"
else
    echo ""
    echo "❌ Error seeding database"
    exit 1
fi
