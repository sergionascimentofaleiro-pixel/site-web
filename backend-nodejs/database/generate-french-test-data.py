#!/usr/bin/env python3
"""
Generate test data with 200 French men and 200 French women
Uses placeholder photos from UI Avatars and randomuser.me
For women, uses local photos from PHOTOS_SOURCE_DIR (configured in .env)
Ensures NO duplicate photos across all profiles
Test profiles: All men seek women, all women seek men (no 'all')
"""

import mysql.connector
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

    # Set environment variables
    for key, value in env_vars.items():
        os.environ.setdefault(key, value)

    return env_vars

# Load .env variables
load_env()

# Database connection
db_config = {
    'host': 'localhost',
    'user': 'devuser',
    'password': 'Manuela2011!',
    'database': 'dating_app'
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
    cursor.execute("""
        SELECT id FROM cities
        WHERE country_id = (SELECT id FROM countries WHERE code = 'FR')
        ORDER BY RAND()
        LIMIT 1
    """)
    result = cursor.fetchone()
    return result[0] if result else None

def get_random_interests(cursor, count=5):
    """Get random interest IDs"""
    cursor.execute("SELECT interest_id FROM interests ORDER BY RAND() LIMIT %s", (count,))
    return [row[0] for row in cursor.fetchall()]

def get_file_hash(file_path):
    """Calculate MD5 hash of a file to detect duplicates"""
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def copy_local_photos_for_gender(gender='female'):
    """Copy local photos to uploads directory and return list of copied filenames

    DEDUPLICATION: Detects and removes duplicate photos before copying
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

    # Get destination directory (always relative to backend-nodejs)
    script_dir = Path(__file__).parent
    dest_dir = script_dir.parent / 'uploads' / 'profiles'

    # Create destination directory if it doesn't exist
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

    # Limit to 200 photos max (we only have 200 women profiles)
    max_photos = min(len(unique_files), 200)
    unique_files = unique_files[:max_photos]

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
    2. randomuser.me (men: 0-99, women: 0-99)
    3. UI Avatars with unique initials (fallback)

    Women profiles (index 0-199):
    - First N: Local photos (if available)
    - Next 100: randomuser.me women/0-99
    - Remaining: UI Avatars with unique names

    Men profiles (index 0-199):
    - First N: Local photos (if available)
    - Next 100: randomuser.me men/0-99
    - Remaining: UI Avatars with unique initials
    """
    if gender == 'female':
        local_photos = local_photos_women
        if local_photos and len(local_photos) > 0 and index < len(local_photos):
            # Use local photo for first N women (where N = number of local photos)
            return f"/uploads/profiles/{local_photos[index]}"
        else:
            # For remaining women
            offset = len(local_photos) if local_photos else 0
            remaining_index = index - offset

            if remaining_index < 100:
                # Use randomuser.me women/0-99 (100 unique photos)
                return f"https://randomuser.me/api/portraits/women/{remaining_index}.jpg"
            else:
                # Use UI Avatars with unique initials as fallback
                # Generate unique combinations to avoid duplicates
                remaining_after_randomuser = remaining_index - 100
                # Use letters A-Z and combinations to create unique avatars
                first_letter = chr(65 + (remaining_after_randomuser // 26))  # A, B, C...
                second_letter = chr(65 + (remaining_after_randomuser % 26))  # A-Z
                return f"https://ui-avatars.com/api/?name={first_letter}+{second_letter}&background=random&size=300&bold=true"
    else:
        # For men
        local_photos = local_photos_men
        if local_photos and len(local_photos) > 0 and index < len(local_photos):
            # Use local photo for first N men (where N = number of local photos)
            return f"/uploads/profiles/{local_photos[index]}"
        else:
            # For remaining men
            offset = len(local_photos) if local_photos else 0
            remaining_index = index - offset

            if remaining_index < 100:
                # Use randomuser.me men/0-99 (100 unique photos)
                return f"https://randomuser.me/api/portraits/men/{remaining_index}.jpg"
            else:
                # Use UI Avatars with unique initials as fallback
                remaining_index_fallback = remaining_index - 100
                first_letter = chr(65 + (remaining_index_fallback // 26))  # A, B, C...
                second_letter = chr(65 + (remaining_index_fallback % 26))  # A-Z
                return f"https://ui-avatars.com/api/?name={first_letter}+{second_letter}&background=random&size=300&bold=true"

def create_test_users(cursor, local_photos_women=None, local_photos_men=None):
    """Create 200 men and 200 women test accounts"""
    print("Creating test users...")
    print("  Women distribution: 50 in Paris, 15 in Orléans, 135 random")
    print("  Men distribution: 200 random French cities")
    if local_photos_women:
        print(f"  Using {len(local_photos_women)} local photos for women")
    if local_photos_men:
        print(f"  Using {len(local_photos_men)} local photos for men")

    # Get France country ID
    cursor.execute("SELECT id FROM countries WHERE code = 'FR'")
    france_id = cursor.fetchone()[0]

    users_created = 0

    # Get city ID for Orleans
    orleans_id = get_city_id(cursor, 'Orleans')

    # Create 200 men
    # First 20 in Orléans, remaining 180 random
    for i in range(200):
        first_name = random.choice(MALE_NAMES)
        last_name = random.choice(LAST_NAMES)
        email = f"homme{i+1}@test.fr"
        password = '$2b$10$TtgI0Lolao6eeTvo0JEHhOhC263.cdAePcwGaFL3ZjNR1N2BeCEam'  # bcrypt hash of "password123"

        # Create user
        cursor.execute("""
            INSERT INTO users (email, password_hash, preferred_language, is_active)
            VALUES (%s, %s, 'fr', TRUE)
        """, (email, password))
        user_id = cursor.lastrowid

        # Assign city: First 20 in Orléans, rest random
        if i < 20 and orleans_id:
            city_id = orleans_id
        else:
            city_id = get_random_french_city(cursor)

        # Create profile
        birth_date = get_random_date_of_birth()
        looking_for = 'female'  # All men seek women
        bio = random.choice(BIOS_MALE)
        profile_photo = generate_profile_photo('male', i, local_photos_women, local_photos_men)

        cursor.execute("""
            INSERT INTO profiles (
                user_id, first_name, last_name, birth_date, gender, looking_for,
                bio, country_id, city_id, profile_photo
            ) VALUES (%s, %s, %s, %s, 'male', %s, %s, %s, %s, %s)
        """, (user_id, first_name, last_name, birth_date, looking_for, bio, france_id, city_id, profile_photo))

        profile_id = cursor.lastrowid

        # Assign random interests
        interests = get_random_interests(cursor, random.randint(3, 8))
        for interest_id in interests:
            cursor.execute("""
                INSERT INTO profile_interests (profile_id, interest_id)
                VALUES (%s, %s)
            """, (profile_id, interest_id))

        users_created += 1
        if users_created % 50 == 0:
            print(f"  Created {users_created} users...")

    # Get city ID for Paris
    paris_id = get_city_id(cursor, 'Paris')

    # Create 200 women
    # First 50 in Paris, next 15 in Orléans, remaining 135 random
    for i in range(200):
        first_name = random.choice(FEMALE_NAMES)
        last_name = random.choice(LAST_NAMES)
        email = f"femme{i+1}@test.fr"
        password = '$2b$10$TtgI0Lolao6eeTvo0JEHhOhC263.cdAePcwGaFL3ZjNR1N2BeCEam'  # bcrypt hash of "password123"

        # Create user
        cursor.execute("""
            INSERT INTO users (email, password_hash, preferred_language, is_active)
            VALUES (%s, %s, 'fr', TRUE)
        """, (email, password))
        user_id = cursor.lastrowid

        # Assign city: 50 in Paris, 15 in Orléans, rest random
        if i < 50 and paris_id:
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

        cursor.execute("""
            INSERT INTO profiles (
                user_id, first_name, last_name, birth_date, gender, looking_for,
                bio, country_id, city_id, profile_photo
            ) VALUES (%s, %s, %s, %s, 'female', %s, %s, %s, %s, %s)
        """, (user_id, first_name, last_name, birth_date, looking_for, bio, france_id, city_id, profile_photo))

        profile_id = cursor.lastrowid

        # Assign random interests
        interests = get_random_interests(cursor, random.randint(3, 8))
        for interest_id in interests:
            cursor.execute("""
                INSERT INTO profile_interests (profile_id, interest_id)
                VALUES (%s, %s)
            """, (profile_id, interest_id))

        users_created += 1
        if users_created % 50 == 0:
            print(f"  Created {users_created} users...")

    print(f"✓ Successfully created {users_created} test users (200 men + 200 women)")

def main():
    print("=== Generating French Test Data ===")
    print("Creating 200 men and 200 women with realistic French profiles\n")

    conn = None
    cursor = None

    try:
        # Get source directories from environment
        source_dir_women = os.getenv('PHOTOS_SOURCE_DIR_WOMEN', '/media/nascimento/data/photos-site')
        source_dir_men = os.getenv('PHOTOS_SOURCE_DIR_MEN', '/media/nascimento/data/photos-site-hommes')

        # Copy local photos for women
        print(f"Copying local photos for women from {source_dir_women}...")
        local_photos_women = copy_local_photos_for_gender('female')

        if len(local_photos_women) > 0:
            print(f"✓ Copied {len(local_photos_women)} unique women's photos to uploads/profiles/\n")
        else:
            print(f"⚠️  No local photos found for women - profiles will use randomuser.me\n")

        # Copy local photos for men
        print(f"Copying local photos for men from {source_dir_men}...")
        local_photos_men = copy_local_photos_for_gender('male')

        if len(local_photos_men) > 0:
            print(f"✓ Copied {len(local_photos_men)} unique men's photos to uploads/profiles/\n")
        else:
            print(f"⚠️  No local photos found for men - profiles will use randomuser.me\n")

        # Connect to database
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

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
        create_test_users(cursor, local_photos_women, local_photos_men)

        # Commit changes
        conn.commit()

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
                if remaining <= 100:
                    print(f"      - homme{len(local_photos_men)+1}-200: randomuser.me men/0-{remaining-1}")
                else:
                    print(f"      - homme{len(local_photos_men)+1}-{len(local_photos_men)+100}: randomuser.me men/0-99")
                    print(f"      - homme{len(local_photos_men)+101}-200: UI Avatars unique initials")
        else:
            print("    Photo sources (NO duplicates):")
            print("      - homme1-100: randomuser.me men/0-99")
            print("      - homme101-200: UI Avatars unique initials")
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
                if remaining <= 100:
                    print(f"      - femme{len(local_photos_women)+1}-200: randomuser.me women/0-{remaining-1}")
                else:
                    print(f"      - femme{len(local_photos_women)+1}-{len(local_photos_women)+100}: randomuser.me women/0-99")
                    print(f"      - femme{len(local_photos_women)+101}-200: UI Avatars unique initials")
        else:
            print("    Photo sources (NO duplicates):")
            print("      - femme1-100: randomuser.me women/0-99")
            print("      - femme101-200: UI Avatars unique initials")
        print("")
        print("  Password: password123")
        print("")
        print("Configuration:")
        print(f"  - PHOTOS_SOURCE_DIR_WOMEN: {source_dir_women}")
        print(f"  - PHOTOS_SOURCE_DIR_MEN: {source_dir_men}")

    except mysql.connector.Error as err:
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
