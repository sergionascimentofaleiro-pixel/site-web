# Database Scripts

Scripts pour gérer la base de données de l'application de rencontres.

## 🚀 Quick Start

### Option 1: Réinitialisation complète (RECOMMANDÉ)

Pour tout réinitialiser avec des données de test :

```bash
cd backend-nodejs/database
./full-reset.sh
```

Ce script va :
1. ✅ Supprimer et recréer la base de données `dating_app`
2. ✅ Créer toutes les tables (users, profiles, likes, matches, messages)
3. ✅ Créer les tables d'intérêts (interest_categories, interests, profile_interests)
4. ✅ Insérer 10 catégories d'intérêts et 100 intérêts prédéfinis
5. ✅ Créer les tables de traductions et insérer les traductions (en, fr, es, pt)
6. ✅ Créer les tables de localisation (countries, states, cities)
7. ✅ Importer les données GeoNames (~252 pays, 305 états, 224k villes)
8. ✅ Créer 40 comptes de test (20 hommes, 20 femmes)
9. ✅ Assigner des intérêts aléatoires à chaque profil

**Temps d'exécution :** ~1-2 minutes (incluant le téléchargement et import des données géographiques)

### Option 2: Installation propre (sans données de test)

Pour une installation en production ou développement sans données :

```bash
cd backend-nodejs/database
./init-db.sh
```

### Option 3: Ajouter des données de test à une base existante

Si vous avez déjà initialisé la base avec `init-db.sh` :

```bash
cd backend-nodejs/database
./seed-db.sh
```

## 📁 Fichiers SQL

### Schémas

- **`schema.sql`** - Tables principales (users, profiles, likes, matches, messages)
- **`interests-schema.sql`** - Tables pour les intérêts (interest_categories, interests, profile_interests)
- **`interests-translations-schema.sql`** - Tables pour les traductions multilingues
- **`locations-schema.sql`** - Tables pour la localisation (countries, states, cities)
- **`add-location-foreign-keys.sql`** - Contraintes de clés étrangères pour les localisations

### Données de seed

- **`interests-seed.sql`** - 10 catégories et 100 intérêts prédéfinis
- **`interests-translations-seed.sql`** - Traductions des intérêts (en, fr, es, pt)
- **`locations-seed.sql`** - Données de localisation de base (fallback si GeoNames échoue)
- **`seed-data.sql`** - 40 comptes utilisateurs avec profils complets
- **`assign-random-interests.sql`** - Assigne des intérêts aléatoires aux profils

### Scripts shell

- **`full-reset.sh`** - ⭐ Réinitialisation complète avec données (RECOMMANDÉ pour développement)
- **`init-db.sh`** - Initialise la base de données vide avec structure et intérêts (pour production)
- **`seed-db.sh`** - Ajoute uniquement les données de test (40 comptes + intérêts assignés)
- **`import-geonames.sh`** - Importe les données de localisation mondiale depuis GeoNames

## 🔑 Identifiants

### Base de données
- **Nom** : `dating_app`
- **Root password** : `Manuela2011`
- **Dev user** : `devuser`
- **Dev password** : `Manuela2011!`

### Comptes de test
Tous les comptes de test utilisent le mot de passe : **`Test123!`**

Exemples :
- `john.smith@test.com` / `Test123!`
- `emma.johnson@test.com` / `Test123!`
- `mike.wilson@test.com` / `Test123!`

Voir `TEST-ACCOUNTS.md` pour la liste complète.

## 📊 Structure des intérêts

### 10 Catégories d'intérêts :

1. ⚽ **Sports & Fitness** - Football, Basketball, Yoga, Gym, etc.
2. 🎵 **Music & Arts** - Live Music, Instruments, Painting, Photography, etc.
3. 🍕 **Food & Dining** - Cooking, Wine, Coffee, Restaurants, etc.
4. ✈️ **Travel & Adventure** - Beach, Hiking, City Exploration, Backpacking, etc.
5. 🎬 **Entertainment** - Movies, TV Series, Anime, Concerts, etc.
6. 🎨 **Hobbies & Crafts** - DIY, Gardening, Writing, Pottery, etc.
7. 💻 **Technology & Gaming** - Video Games, Programming, Gadgets, VR, etc.
8. 🌲 **Nature & Outdoors** - Hiking, Wildlife, Fishing, Stargazing, etc.
9. 📚 **Learning & Culture** - Reading, Languages, History, Museums, etc.
10. 👥 **Social & Community** - Volunteering, Networking, Meetups, etc.

**Total : 100 intérêts prédéfinis**

### 🌍 Support multilingue

Les intérêts sont traduits dans 4 langues :
- 🇬🇧 **Anglais** (en) - langue par défaut
- 🇫🇷 **Français** (fr)
- 🇪🇸 **Espagnol** (es)
- 🇵🇹 **Portugais** (pt)

**Tables de traduction :**
- `interest_category_translations` - Noms des catégories traduits
- `interest_translations` - Noms des intérêts traduits

**Utilisation API :**
```bash
# Récupérer les intérêts en français
GET /api/interests/all?lang=fr

# Récupérer les intérêts utilisateur en espagnol
GET /api/interests/my?lang=es
```

Si aucune langue n'est spécifiée, l'anglais (en) est utilisé par défaut.

## 🌍 Système de localisation

### Données géographiques (GeoNames)

L'application utilise les données **GeoNames** pour une couverture mondiale complète :

- **252 pays** avec traductions (en, fr, es, pt)
- **305 états/provinces** pour les grands pays (US, BR, CA, MX, AU, IN, CN, RU, AR)
- **224 513 villes** (population > 500 habitants)

### Import des données

L'import est automatique lors du `full-reset.sh`, mais peut être lancé manuellement :

```bash
cd backend-nodejs/database
./import-geonames.sh
```

**Processus d'import :**
1. Téléchargement des fichiers GeoNames (~25 MB)
2. Traitement avec Python (batch inserts pour performance)
3. Import en base de données (~20 secondes)

### Recherche de villes (Autocomplete)

Le système utilise un autocomplete optimisé pour éviter les problèmes de performance :

```bash
# Rechercher des villes commençant par "Par" en France
GET /api/locations/cities/search?q=Par&countryId=75&limit=500
```

**Fonctionnalités :**
- Recherche par préfixe (LIKE 'term%')
- Filtrage par pays et/ou état
- Limite de 500 résultats maximum
- Performance optimisée avec index sur les noms

### Structure des tables

```sql
countries (
  id, code, name_en, name_fr, name_es, name_pt, has_states
)

states (
  id, country_id, code, name
)

cities (
  id, country_id, state_id, name
)
```

**Pays avec états :**
- 🇺🇸 USA
- 🇧🇷 Brésil
- 🇨🇦 Canada
- 🇲🇽 Mexique
- 🇦🇺 Australie
- 🇮🇳 Inde
- 🇨🇳 Chine
- 🇷🇺 Russie
- 🇦🇷 Argentine

## 🔧 Utilisation avancée

### Réinitialiser seulement les intérêts

```bash
mysql -uroot -pManuela2011 dating_app < interests-schema.sql
mysql -uroot -pManuela2011 --default-character-set=utf8mb4 dating_app < interests-seed.sql
mysql -uroot -pManuela2011 --default-character-set=utf8mb4 dating_app < assign-random-interests.sql
```

### Réinitialiser seulement les profils

```bash
mysql -uroot -pManuela2011 dating_app -e "TRUNCATE TABLE profiles; TRUNCATE TABLE users;"
mysql -uroot -pManuela2011 --default-character-set=utf8mb4 dating_app < seed-data.sql
mysql -uroot -pManuela2011 --default-character-set=utf8mb4 dating_app < assign-random-interests.sql
```

### Voir les statistiques

```bash
mysql -uroot -pManuela2011 dating_app -e "
  SELECT
    (SELECT COUNT(*) FROM users) as Users,
    (SELECT COUNT(*) FROM profiles) as Profiles,
    (SELECT COUNT(*) FROM interest_categories) as Categories,
    (SELECT COUNT(*) FROM interests) as Interests,
    (SELECT COUNT(*) FROM interest_translations) as Translations,
    (SELECT COUNT(*) FROM profile_interests) as Assignments,
    (SELECT COUNT(*) FROM countries) as Countries,
    (SELECT COUNT(*) FROM states) as States,
    (SELECT COUNT(*) FROM cities) as Cities;
"
```

## ⚠️ Notes importantes

- Le script `full-reset.sh` **supprime TOUTES les données** - utilisez avec précaution !
- Le charset **utf8mb4** est requis pour les emojis dans les intérêts
- Les mots de passe des comptes de test sont hashés avec bcryptjs (10 rounds)
- Les profils ont des intérêts aléatoires entre 5 et 15 par personne
- L'import GeoNames nécessite **Python 3** et **mysql-connector-python**
- Les villes ont un nom limité à **200 caractères** (VARCHAR(200))

## 🐛 Dépannage

### Erreur de connexion MySQL

Vérifiez que MariaDB/MySQL est démarré :
```bash
sudo systemctl status mariadb
```

### Erreur de charset

Assurez-vous d'utiliser `--default-character-set=utf8mb4` pour les fichiers avec emojis.

### Permission denied sur les scripts

Rendez-les exécutables :
```bash
chmod +x *.sh
```
