#!/bin/bash

# Script pour initialiser la base de données (première installation)
# Usage: ./init-db.sh

echo "🚀 Initialisation de la base de données dating_app..."
echo ""

# Demander le mot de passe root MySQL une seule fois
read -sp "Mot de passe root MySQL: " MYSQL_ROOT_PASSWORD
echo

echo ""
echo "🔧 Création de la base de données et de l'utilisateur..."

# Créer la base et l'utilisateur
mysql -u root -p"$MYSQL_ROOT_PASSWORD" < "$(dirname "$0")/setup.sql"

if [ $? -eq 0 ]; then
    echo "✅ Base de données et utilisateur créés"
else
    echo "❌ Erreur lors de la création de la base"
    exit 1
fi

echo ""
echo "📋 Création des tables..."

# Créer les tables
mysql -u root -p"$MYSQL_ROOT_PASSWORD" dating_app < "$(dirname "$0")/schema.sql"

if [ $? -eq 0 ]; then
    echo "✅ Tables créées avec succès"
else
    echo "❌ Erreur lors de la création des tables"
    exit 1
fi

echo ""
echo "🎉 Base de données initialisée avec succès!"
echo ""
echo "Configuration:"
echo "  - Base de données: dating_app"
echo "  - Utilisateur: devuser"
echo "  - Mot de passe: Manuela2011!"
echo ""
echo "Vous pouvez maintenant démarrer le backend avec:"
echo "  cd backend-nodejs && npm run dev"
