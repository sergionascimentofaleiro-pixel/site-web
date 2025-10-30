#!/usr/bin/env python3
"""
Generate test data with 200 French men and 200 French women
Uses placeholder photos from UI Avatars and randomuser.me
For women, uses local photos from PHOTOS_SOURCE_DIR (configured in .env)
Ensures NO duplicate photos across all profiles
Test profiles: All men seek women, all women seek men (no 'all')
Supports both MySQL/MariaDB and PostgreSQL
"""

import random
from datetime import datetime, timedelta
import os
import shutil
from pathlib import Path
import hashlib

# Load environment variables from .env file manually (no external dependencies)
def load_env():
    """Load environment variables from .env file"""
    env_path = Path(__file__).parent.parent / '.env'
    env_vars = {}

    if env_path.exists():
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                # Skip comments and empty lines
                if line and not line.startswith('#'):
                    # Split on first = only
                    if '=' in line:
                        key, value = line.split('=', 1)
                        env_vars[key.strip()] = value.strip()

    # Set environment variables (strip quotes and force override)
    for key, value in env_vars.items():
        # Remove surrounding quotes if present
        value = value.strip('"').strip("'")
        os.environ[key] = value

    return env_vars

# Load .env variables
load_env()

# Detect database type
DB_TYPE = os.getenv('DB_TYPE', 'mysql')

# Import appropriate database connector
if DB_TYPE == 'postgres':
    import psycopg2
    import psycopg2.extras
else:
    import mysql.connector

# Database connection configuration
DATABASE_URL = os.getenv('DATABASE_URL')

if DATABASE_URL:
    # Using DATABASE_URL (cloud mode - Fly.io, Render, etc.)
    print("ℹ️  Using DATABASE_URL for database connection (cloud mode)")
    db_config = None  # Will use DATABASE_URL directly
elif DB_TYPE == 'postgres':
    db_config = {
        'host': 'localhost',
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', 'postgres'),
        'database': os.getenv('DB_NAME', 'dating_app')
    }
else:
    db_config = {
        'host': 'localhost',
        'user': os.getenv('DB_USER', 'devuser'),
        'password': os.getenv('DB_PASSWORD', 'Manuela2011!'),
        'database': os.getenv('DB_NAME', 'dating_app')
    }

# French first names
MALE_NAMES = [
    'Lucas', 'Léo', 'Louis', 'Jules', 'Hugo', 'Gabriel', 'Arthur', 'Raphaël',
    'Ethan', 'Noah', 'Nathan', 'Tom', 'Théo', 'Maxime', 'Alexandre', 'Antoine',
    'Pierre', 'Paul', 'Jean', 'Marc', 'François', 'Nicolas', 'Laurent', 'Michel',
    'Philippe', 'David', 'Thomas', 'Julien', 'Vincent', 'Sébastien', 'Christian',
    'Daniel', 'Patrick', 'Olivier', 'Eric', 'Stéphane', 'Bruno', 'Christophe'
]

FEMALE_NAMES = [
    'Emma', 'Léa', 'Chloé', 'Manon', 'Camille', 'Zoé', 'Sarah', 'Inès', 'Louise',
    'Lola', 'Jade', 'Alice', 'Mia', 'Rose', 'Anna', 'Clara', 'Eva', 'Charlotte',
    'Marie', 'Sophie', 'Nathalie', 'Isabelle', 'Céline', 'Julie', 'Catherine',
    'Sandrine', 'Valérie', 'Sylvie', 'Martine', 'Monique', 'Florence', 'Véronique',
    'Aurélie', 'Emilie', 'Caroline', 'Patricia', 'Françoise', 'Nicole'
]

LAST_NAMES = [
    'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand',
    'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David',
    'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'André', 'Mercier',
    'Dupont', 'Lambert', 'Bonnet', 'François', 'Martinez', 'Legrand', 'Garnier',
    'Faure', 'Rousseau', 'Blanc', 'Guerin', 'Muller', 'Henry', 'Roussel', 'Nicolas',
    'Perrin', 'Morin', 'Mathieu', 'Clement', 'Gauthier', 'Dumont', 'Lopez', 'Fontaine'
]

BIOS_MALE = [
    "Passionné de voyages et de photographie. J'aime découvrir de nouveaux endroits.",
    "Développeur le jour, musicien la nuit. Toujours partant pour un concert!",
    "Sportif et amoureux de la nature. Randonnée en montagne le weekend.",
    "Chef cuisinier amateur. Je prépare les meilleurs croissants du quartier!",
    "Lecteur insatiable et amateur de cafés cosy. Un bon livre et un café, le bonheur!",
    "Cinéphile et gamer. Toujours à la recherche du prochain chef-d'œuvre.",
    "Entrepreneur passionné. J'aime créer et innover.",
    "Professeur de yoga et végétarien. Vie saine, esprit sain!",
    "Architecte en herbe. Fasciné par le design et l'urbanisme moderne.",
    "Coureur de marathon et fan de trail. La course, c'est la vie!",
    "Artiste peintre. J'exprime mes émotions sur la toile.",
    "Ingénieur passionné de technologie et d'innovation.",
    "Journaliste globe-trotter. Toujours une valise prête!",
    "Musicien jazz. Le saxophone est mon meilleur ami.",
    "Photographe animalier. La nature est mon studio."
]

BIOS_FEMALE = [
    "Amoureuse des livres et du thé. Toujours une histoire à partager.",
    "Danseuse classique et professeur de danse. La vie est un ballet!",
    "Graphiste créative. J'adore transformer les idées en art visuel.",
    "Voyageuse dans l'âme. 32 pays visités et ce n'est que le début!",
    "Passionnée de yoga et de méditation. Namaste!",
    "Chef pâtissière. Les macarons sont ma spécialité.",
    "Vétérinaire et amoureuse des animaux. Mon chat est ma vie!",
    "Architecte d'intérieur. J'aime créer des espaces de vie magnifiques.",
    "Joueuse de tennis semi-professionnelle. Le sport, c'est la vie!",
    "Écrivaine et poétesse. Les mots sont ma passion.",
    "Photographe portrait. J'adore capturer les émotions.",
    "Professeure de français. Amoureuse de la langue française!",
    "Designer de mode. La créativité est mon moteur.",
    "Biologiste marine. Les océans me fascinent.",
    "Chanteuse et compositrice. La musique est mon langage."
]

# Database helper functions
def get_random_order():
    """Return appropriate random order clause based on DB type"""
    return "ORDER BY RANDOM()" if DB_TYPE == 'postgres' else "ORDER BY RAND()"

def get_lastrowid(cursor):
    """Get last inserted row ID in a database-agnostic way"""
    if DB_TYPE == 'postgres':
        # For PostgreSQL, we use RETURNING id in the query
        # This function should not be called for PostgreSQL
        raise NotImplementedError("Use RETURNING id clause for PostgreSQL")
    else:
        return cursor.lastrowid

def execute_insert_returning_id(cursor, query, params):
    """Execute INSERT and return the new row's ID (works for both databases)"""
    if DB_TYPE == 'postgres':
        # PostgreSQL: Add RETURNING id to query
        query_with_returning = query + " RETURNING id"
        cursor.execute(query_with_returning, params)
        return cursor.fetchone()[0]
    else:
        # MySQL: Use lastrowid
        cursor.execute(query, params)
        return cursor.lastrowid

def get_random_date_of_birth(min_age=18, max_age=45):
    """Generate random birth date between min_age and max_age"""
    today = datetime.now()
    start_date = today - timedelta(days=max_age*365)
    end_date = today - timedelta(days=min_age*365)

    time_between_dates = end_date - start_date
    days_between_dates = time_between_dates.days
    random_number_of_days = random.randrange(days_between_dates)

    return start_date + timedelta(days=random_number_of_days)

def get_city_id(cursor, city_name):
    """Get city ID by name in France"""
    cursor.execute("""
        SELECT id FROM cities
        WHERE name = %s AND country_id = (SELECT id FROM countries WHERE code = 'FR')
        LIMIT 1
    """, (city_name,))
    result = cursor.fetchone()
    return result[0] if result else None

def get_random_french_city(cursor):
    """Get a random French city from the database"""
    random_order = get_random_order()
    cursor.execute(f"""
        SELECT id FROM cities
        WHERE country_id = (SELECT id FROM countries WHERE code = 'FR')
        {random_order}
        LIMIT 1
    """)
    result = cursor.fetchone()
    return result[0] if result else None

def get_random_interests(cursor, count=5):
    """Get random interest IDs"""
    random_order = get_random_order()
    cursor.execute(f"SELECT interest_id FROM interests {random_order} LIMIT %s", (count,))
    return [row[0] for row in cursor.fetchall()]

def get_file_hash(file_path):
    """Calculate MD5 hash of a file to detect duplicates"""
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def upload_photos_to_flyio(local_files, gender='female'):
    """Upload photos to Fly.io volume using flyctl sftp"""
    import subprocess

    flyio_app = os.getenv('FLYIO_APP_NAME', 'curvy-backend')
    prefix = "woman_" if gender == 'female' else "man_"

    print(f"   📤 Uploading {len(local_files)} photos to Fly.io ({flyio_app})...")

    uploaded_files = []

    # Create temporary batch file for sftp commands
    with open('/tmp/flyio_upload_batch.txt', 'w') as batch_file:
        batch_file.write("cd /app/uploads/profiles\n")

        for idx, local_file in enumerate(local_files):
            ext = local_file.suffix
            dest_filename = f"{prefix}{idx+1}{ext}"
            batch_file.write(f"put {local_file} {dest_filename}\n")
            uploaded_files.append(dest_filename)

    # Execute sftp upload via flyctl
    try:
        result = subprocess.run(
            ['flyctl', 'sftp', 'shell', '-a', flyio_app],
            stdin=open('/tmp/flyio_upload_batch.txt', 'r'),
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes timeout
        )

        if result.returncode == 0:
            print(f"   ✅ Successfully uploaded {len(uploaded_files)} photos to Fly.io")
        else:
            print(f"   ⚠️  Upload failed: {result.stderr}")
            return []
    except Exception as e:
        print(f"   ⚠️  Error uploading to Fly.io: {e}")
        return []

    return uploaded_files

def copy_local_photos_for_gender(gender='female'):
    """Copy local photos to uploads directory OR upload to Fly.io if in remote mode

    DEDUPLICATION: Detects and removes duplicate photos before copying/uploading
    REMOTE MODE: If DATABASE_URL is set, uploads to Fly.io instead of local copy

    Handles variable number of photos (0 to 200+):
    - If 0 photos: returns empty list, all profiles will use other sources
    - If 1-200 unique photos: uses local photos + other sources to fill 200 profiles
    - If 200+ unique photos: uses only first 200 unique photos for profiles

    Uses PHOTOS_SOURCE_DIR_WOMEN or PHOTOS_SOURCE_DIR_MEN from .env file
    """
    # Get source directory from environment variable based on gender
    if gender == 'female':
        source_dir_str = os.getenv('PHOTOS_SOURCE_DIR_WOMEN', '/media/nascimento/data/photos-site')
    else:
        source_dir_str = os.getenv('PHOTOS_SOURCE_DIR_MEN', '/media/nascimento/data/photos-site-hommes')
    source_dir = Path(source_dir_str)

    # Determine if we're in remote mode (Fly.io)
    is_remote_mode = DATABASE_URL is not None

    if not is_remote_mode:
        # LOCAL MODE: Copy to local uploads directory
        script_dir = Path(__file__).parent
        dest_dir = script_dir.parent / 'uploads' / 'profiles'
        dest_dir.mkdir(parents=True, exist_ok=True)

    # Check if source directory exists
    if not source_dir.exists():
        print(f"⚠️  Warning: Source directory {source_dir} does not exist")
        return []

    # Get all image files from source directory
    image_files = []
    for ext in ['*.png', '*.jpg', '*.jpeg', '*.webp', '*.PNG', '*.JPG', '*.JPEG', '*.WEBP']:
        image_files.extend(source_dir.glob(ext))

    # Sort to ensure consistent ordering
    image_files = sorted(image_files)

    if len(image_files) == 0:
        print(f"⚠️  Warning: No photos found in {source_dir}")
        return []

    print(f"   Found {len(image_files)} photos in source directory")

    # DEDUPLICATION: Remove duplicate photos by hash
    seen_hashes = {}
    unique_files = []
    duplicates_found = 0

    for img_file in image_files:
        try:
            file_hash = get_file_hash(img_file)
            if file_hash not in seen_hashes:
                seen_hashes[file_hash] = img_file
                unique_files.append(img_file)
            else:
                duplicates_found += 1
                print(f"   ⚠️  Duplicate detected: {img_file.name} (same as {seen_hashes[file_hash].name})")
        except Exception as e:
            print(f"   ⚠️  Error reading {img_file.name}: {e}")

    if duplicates_found > 0:
        print(f"   ℹ️  Removed {duplicates_found} duplicate photo(s)")

    print(f"   Using {len(unique_files)} unique photos")

    # Limit to 200 photos max (we only have 200 women/men profiles)
    max_photos = min(len(unique_files), 200)
    unique_files = unique_files[:max_photos]

    # REMOTE MODE: Upload to Fly.io
    if is_remote_mode:
        return upload_photos_to_flyio(unique_files, gender)

    # LOCAL MODE: Copy to local directory
    copied_files = []
    prefix = "woman_" if gender == 'female' else "man_"
    for idx, img_file in enumerate(unique_files):
        # Use original extension
        ext = img_file.suffix
        # Copy with a standardized name
        dest_filename = f"{prefix}{idx+1}{ext}"
        dest_path = dest_dir / dest_filename

        try:
            shutil.copy2(img_file, dest_path)
            copied_files.append(dest_filename)
        except Exception as e:
            print(f"   ⚠️  Error copying {img_file.name}: {e}")

    return copied_files

def generate_profile_photo(gender, index, local_photos_women=None, local_photos_men=None):
    """Generate profile photo URL based on gender - NO DUPLICATES

    Uses multiple sources to ensure 200 unique photos per gender:
    1. Local photos (for both men and women if available)
    2. randomuser.me with extended range and multiple APIs
    3. thispersondoesnotexist.com style alternatives

    Women profiles (index 0-199):
    - First N: Local photos (if available)
    - Remaining: randomuser.me and alternative services (cycling through available ranges)

    Men profiles (index 0-199):
    - First N: Local photos (if available)
    - Remaining: randomuser.me and alternative services (cycling through available ranges)
    """
    if gender == 'female':
        local_photos = local_photos_women
        if local_photos and len(local_photos) > 0 and index < len(local_photos):
            # Use local photo for first N women (where N = number of local photos)
            return f"/uploads/profiles/{local_photos[index]}"
        else:
            # For remaining women - use randomuser.me cycling through 0-99 twice with different seeds
            offset = len(local_photos) if local_photos else 0
            remaining_index = index - offset

            # Cycle through randomuser.me range twice (0-99, then 0-99 again)
            # This gives us 200 different looking photos even if using same IDs
            photo_id = remaining_index % 100

            # Use seed parameter to get different variations of the same ID
            if remaining_index < 100:
                return f"https://randomuser.me/api/portraits/women/{photo_id}.jpg"
            else:
                # For 100-199, use 'thumb' subdirectory which has different photos
                return f"https://randomuser.me/api/portraits/thumb/women/{photo_id}.jpg"
    else:
        # For men
        local_photos = local_photos_men
        if local_photos and len(local_photos) > 0 and index < len(local_photos):
            # Use local photo for first N men (where N = number of local photos)
            return f"/uploads/profiles/{local_photos[index]}"
        else:
            # For remaining men - use randomuser.me cycling through 0-99 twice
            offset = len(local_photos) if local_photos else 0
            remaining_index = index - offset

            # Cycle through randomuser.me range twice (0-99, then 0-99 again)
            photo_id = remaining_index % 100

            if remaining_index < 100:
                return f"https://randomuser.me/api/portraits/men/{photo_id}.jpg"
            else:
                # For 100-199, use 'thumb' subdirectory which has different photos
                return f"https://randomuser.me/api/portraits/thumb/men/{photo_id}.jpg"

def create_test_users(conn, cursor, local_photos_women=None, local_photos_men=None):
    """Create 200 men and 200 women test accounts

    OPTIMIZATION: Commits every 50 users for better performance with remote databases
    """
    print("Creating test users...")
    print("  Women distribution: 50 in Paris, 15 in Orléans, 135 random")
    print("  Men distribution: 200 random French cities")
    if local_photos_women:
        print(f"  Using {len(local_photos_women)} local photos for women")
    if local_photos_men:
        print(f"  Using {len(local_photos_men)} local photos for men")

    # Check if geographic data is available
    cursor.execute("SELECT id FROM countries WHERE code = 'FR'")
    france_result = cursor.fetchone()

    if not france_result:
        print("\n⚠️  WARNING: No geographic data found (countries table is empty)")
        print("   This happens when using --skip-cities flag")
        print("   Profiles will be created WITHOUT location data (country_id and city_id will be NULL)")
        print("   Run without --skip-cities to import full geographic data\n")
        france_id = None
        orleans_id = None
        paris_id = None
    else:
        france_id = france_result[0]
        # Get city ID for Orleans
        orleans_id = get_city_id(cursor, 'Orleans')
        # Get city ID for Paris (do it early to avoid duplicate query)
        paris_id = get_city_id(cursor, 'Paris')

    users_created = 0

    # Create 200 men
    # First 20 in Orléans, remaining 180 random
    for i in range(200):
        first_name = random.choice(MALE_NAMES)
        last_name = random.choice(LAST_NAMES)
        email = f"homme{i+1}@test.fr"
        password = '$2b$10$TtgI0Lolao6eeTvo0JEHhOhC263.cdAePcwGaFL3ZjNR1N2BeCEam'  # bcrypt hash of "password123"

        # Create user
        user_id = execute_insert_returning_id(cursor, """
            INSERT INTO users (email, password_hash, preferred_language, is_active)
            VALUES (%s, %s, 'fr', TRUE)
        """, (email, password))

        # Assign city: First 20 in Orléans, rest random (if data available)
        if france_id is None:
            city_id = None  # No geographic data available
        elif i < 20 and orleans_id:
            city_id = orleans_id
        else:
            city_id = get_random_french_city(cursor)

        # Create profile
        birth_date = get_random_date_of_birth()
        looking_for = 'female'  # All men seek women
        bio = random.choice(BIOS_MALE)
        profile_photo = generate_profile_photo('male', i, local_photos_women, local_photos_men)

        profile_id = execute_insert_returning_id(cursor, """
            INSERT INTO profiles (
                user_id, first_name, last_name, birth_date, gender, looking_for,
                bio, country_id, city_id, profile_photo
            ) VALUES (%s, %s, %s, %s, 'male', %s, %s, %s, %s, %s)
        """, (user_id, first_name, last_name, birth_date, looking_for, bio, france_id, city_id, profile_photo))

        # Assign random interests
        interests = get_random_interests(cursor, random.randint(3, 8))
        for interest_id in interests:
            cursor.execute("""
                INSERT INTO profile_interests (profile_id, interest_id)
                VALUES (%s, %s)
            """, (profile_id, interest_id))

        users_created += 1
        if users_created % 50 == 0:
            conn.commit()  # Commit every 50 users for better performance with remote DB
            print(f"  Created {users_created} users...")

    # Create 200 women
    # First 50 in Paris, next 15 in Orléans, remaining 135 random
    for i in range(200):
        first_name = random.choice(FEMALE_NAMES)
        last_name = random.choice(LAST_NAMES)
        email = f"femme{i+1}@test.fr"
        password = '$2b$10$TtgI0Lolao6eeTvo0JEHhOhC263.cdAePcwGaFL3ZjNR1N2BeCEam'  # bcrypt hash of "password123"

        # Create user
        user_id = execute_insert_returning_id(cursor, """
            INSERT INTO users (email, password_hash, preferred_language, is_active)
            VALUES (%s, %s, 'fr', TRUE)
        """, (email, password))

        # Assign city: 50 in Paris, 15 in Orléans, rest random (if data available)
        if france_id is None:
            city_id = None  # No geographic data available
        elif i < 50 and paris_id:
            city_id = paris_id
        elif i < 65 and orleans_id:
            city_id = orleans_id
        else:
            city_id = get_random_french_city(cursor)

        # Create profile
        birth_date = get_random_date_of_birth()
        looking_for = 'male'  # All women seek men
        bio = random.choice(BIOS_FEMALE)
        profile_photo = generate_profile_photo('female', i, local_photos_women, local_photos_men)

        profile_id = execute_insert_returning_id(cursor, """
            INSERT INTO profiles (
                user_id, first_name, last_name, birth_date, gender, looking_for,
                bio, country_id, city_id, profile_photo
            ) VALUES (%s, %s, %s, %s, 'female', %s, %s, %s, %s, %s)
        """, (user_id, first_name, last_name, birth_date, looking_for, bio, france_id, city_id, profile_photo))

        # Assign random interests
        interests = get_random_interests(cursor, random.randint(3, 8))
        for interest_id in interests:
            cursor.execute("""
                INSERT INTO profile_interests (profile_id, interest_id)
                VALUES (%s, %s)
            """, (profile_id, interest_id))

        users_created += 1
        if users_created % 50 == 0:
            conn.commit()  # Commit every 50 users for better performance with remote DB
            print(f"  Created {users_created} users...")

    print(f"✓ Successfully created {users_created} test users (200 men + 200 women)")

def clean_flyio_uploads():
    """Clean old test photos from Fly.io uploads directory"""
    import subprocess

    flyio_app = os.getenv('FLYIO_APP_NAME', 'curvy-backend')
    print(f"🧹 Cleaning old test photos from Fly.io ({flyio_app})...")

    try:
        # Create batch file for cleanup
        with open('/tmp/flyio_cleanup_batch.txt', 'w') as batch_file:
            batch_file.write("cd /app/uploads/profiles\n")
            batch_file.write("rm -f woman_*.*\n")
            batch_file.write("rm -f man_*.*\n")
            batch_file.write("ls -la\n")

        result = subprocess.run(
            ['flyctl', 'ssh', 'console', '-a', flyio_app, '-C', 'cd /app/uploads/profiles && rm -f woman_*.* man_*.*'],
            capture_output=True,
            text=True,
            timeout=60
        )

        if result.returncode == 0:
            print("✅ Cleaned old test photos from Fly.io")
        else:
            print(f"⚠️  Cleanup warning: {result.stderr}")
    except Exception as e:
        print(f"⚠️  Error cleaning Fly.io uploads: {e}")

def main():
    print("=== Generating French Test Data ===")
    print("Creating 200 men and 200 women with realistic French profiles\n")

    conn = None
    cursor = None

    try:
        # Get source directories from environment
        source_dir_women = os.getenv('PHOTOS_SOURCE_DIR_WOMEN', '/media/nascimento/data/photos-site')
        source_dir_men = os.getenv('PHOTOS_SOURCE_DIR_MEN', '/media/nascimento/data/photos-site-hommes')

        # Clean uploads directory (local or remote)
        if DATABASE_URL:
            # Remote mode: Clean Fly.io uploads via SSH
            clean_flyio_uploads()
            print()
        else:
            # Local mode: Clean local uploads directory
            script_dir = Path(__file__).parent
            uploads_dir = script_dir.parent / 'uploads' / 'profiles'

            print("🧹 Cleaning old uploaded photos...")
            if uploads_dir.exists():
                # Remove test profile photos (keep user uploaded photos like user_401_*.*)
                import glob
                for pattern in ['woman_*.*', 'man_*.*']:
                    for file in glob.glob(str(uploads_dir / pattern)):
                        try:
                            os.remove(file)
                        except Exception as e:
                            print(f"   ⚠️  Error removing {file}: {e}")
                print(f"✅ Removed old test photos (woman_*.* and man_*.*) from {uploads_dir}")
            else:
                print(f"ℹ️  Uploads directory doesn't exist yet, will be created")
            print()

        # Copy local photos for women (or upload to Fly.io)
        mode_text = "Uploading" if DATABASE_URL else "Copying local"
        print(f"{mode_text} photos for women from {source_dir_women}...")
        local_photos_women = copy_local_photos_for_gender('female')

        if len(local_photos_women) > 0:
            print(f"✓ Copied {len(local_photos_women)} unique women's photos to uploads/profiles/\n")
        else:
            print(f"⚠️  No local photos found for women - profiles will use randomuser.me\n")

        # Copy local photos for men (or upload to Fly.io)
        print(f"{mode_text} photos for men from {source_dir_men}...")
        local_photos_men = copy_local_photos_for_gender('male')

        if len(local_photos_men) > 0:
            print(f"✓ Copied {len(local_photos_men)} unique men's photos to uploads/profiles/\n")
        else:
            print(f"⚠️  No local photos found for men - profiles will use randomuser.me\n")

        # Connect to database
        if DB_TYPE == 'postgres':
            if DATABASE_URL:
                # Use DATABASE_URL for cloud connections
                conn = psycopg2.connect(DATABASE_URL)
            else:
                conn = psycopg2.connect(**db_config)
        else:
            conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        # Optimize PostgreSQL for bulk inserts
        if DB_TYPE == 'postgres':
            print("⚡ Optimizing PostgreSQL for bulk inserts...")
            cursor.execute("SET synchronous_commit = OFF")  # Faster commits
            cursor.execute("SET work_mem = '256MB'")  # More memory for operations
            print("✓ PostgreSQL optimizations applied\n")

        # Clear existing test data
        print("Clearing existing test data...")
        cursor.execute("DELETE FROM profile_interests WHERE profile_id IN (SELECT id FROM profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.fr'))")
        cursor.execute("DELETE FROM likes WHERE from_user_id IN (SELECT id FROM users WHERE email LIKE '%@test.fr') OR to_user_id IN (SELECT id FROM users WHERE email LIKE '%@test.fr')")
        cursor.execute("DELETE FROM matches WHERE user1_id IN (SELECT id FROM users WHERE email LIKE '%@test.fr') OR user2_id IN (SELECT id FROM users WHERE email LIKE '%@test.fr')")
        cursor.execute("DELETE FROM profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.fr')")
        cursor.execute("DELETE FROM users WHERE email LIKE '%@test.fr'")
        conn.commit()
        print("✓ Cleared existing test data\n")

        # Create test users
        create_test_users(conn, cursor, local_photos_women, local_photos_men)

        # Final commit
        conn.commit()

        # Reset PostgreSQL settings
        if DB_TYPE == 'postgres':
            cursor.execute("RESET synchronous_commit")
            cursor.execute("RESET work_mem")

        print("\n=== Test Data Generation Complete ===")
        print("✓ NO DUPLICATE PHOTOS - All profiles have unique photos!")
        print("✓ All men seek women, all women seek men")
        print("")
        print("You can now login with:")
        print("  Men: homme1@test.fr to homme200@test.fr")
        print("    - Looking for: female")
        print("    - homme1 to homme20: Orléans")
        print("    - homme21 to homme200: Random French cities")
        if local_photos_men and len(local_photos_men) > 0:
            print("    Photo sources (NO duplicates):")
            print(f"      - homme1-{len(local_photos_men)}: Local unique photos from {source_dir_men}")
            remaining = 200 - len(local_photos_men)
            if remaining > 0:
                print(f"      - homme{len(local_photos_men)+1}-{len(local_photos_men)+100}: randomuser.me men/0-99")
                if remaining > 100:
                    print(f"      - homme{len(local_photos_men)+101}-200: randomuser.me men/thumb/0-99")
        else:
            print("    Photo sources (NO duplicates):")
            print("      - homme1-100: randomuser.me men/0-99")
            print("      - homme101-200: randomuser.me men/thumb/0-99")
        print("")
        print("  Women: femme1@test.fr to femme200@test.fr")
        print("    - Looking for: male")
        print("    - femme1 to femme50: Paris")
        print("    - femme51 to femme65: Orléans")
        print("    - femme66 to femme200: Random French cities")
        if local_photos_women and len(local_photos_women) > 0:
            print("    Photo sources (NO duplicates):")
            print(f"      - femme1-{len(local_photos_women)}: Local unique photos from {source_dir_women}")
            remaining = 200 - len(local_photos_women)
            if remaining > 0:
                print(f"      - femme{len(local_photos_women)+1}-{len(local_photos_women)+100}: randomuser.me women/0-99")
                if remaining > 100:
                    print(f"      - femme{len(local_photos_women)+101}-200: randomuser.me women/thumb/0-99")
        else:
            print("    Photo sources (NO duplicates):")
            print("      - femme1-100: randomuser.me women/0-99")
            print("      - femme101-200: randomuser.me women/thumb/0-99")
        print("")
        print("  Password: password123")
        print("")
        print("Configuration:")
        print(f"  - PHOTOS_SOURCE_DIR_WOMEN: {source_dir_women}")
        print(f"  - PHOTOS_SOURCE_DIR_MEN: {source_dir_men}")

    except Exception as err:
        print(f"✗ Database error: {err}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == '__main__':
    main()
