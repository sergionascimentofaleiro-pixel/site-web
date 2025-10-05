#!/bin/bash

# Script pour réinitialiser complètement la base de données
# Usage: ./reset-db.sh

echo "🗑️  Suppression de la base de données et de l'utilisateur..."

# Demander le mot de passe root MySQL une seule fois
read -sp "Mot de passe root MySQL: " MYSQL_ROOT_PASSWORD
echo

# Supprimer la base et l'utilisateur
mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "DROP DATABASE IF EXISTS dating_app; DROP USER IF EXISTS 'devuser'@'localhost';" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Base de données et utilisateur supprimés"
else
    echo "❌ Erreur lors de la suppression (peut-être qu'ils n'existaient pas)"
fi

echo ""
echo "🔧 Création de la base de données et de l'utilisateur..."

# Recréer la base et l'utilisateur
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
echo "🎉 Base de données réinitialisée avec succès!"
echo ""
echo "Vous pouvez maintenant démarrer le backend avec:"
echo "  cd backend-nodejs && npm run dev"
