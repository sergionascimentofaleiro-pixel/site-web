#!/usr/bin/env python3
"""
Generate test data with 200 French men and 200 French women
Uses placeholder photos from UI Avatars and randomuser.me
"""

import mysql.connector
import random
from datetime import datetime, timedelta

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

def generate_profile_photo(gender, index):
    """Generate profile photo URL based on gender"""
    # Using randomuser.me API for realistic photos
    seed = f"{gender}_{index}"
    return f"https://randomuser.me/api/portraits/{'men' if gender == 'male' else 'women'}/{index % 99}.jpg"

def create_test_users(cursor):
    """Create 200 men and 200 women test accounts"""
    print("Creating test users...")
    print("  Women distribution: 50 in Paris, 15 in Orléans, 135 random")
    print("  Men distribution: 200 random French cities")

    # Get France country ID
    cursor.execute("SELECT id FROM countries WHERE code = 'FR'")
    france_id = cursor.fetchone()[0]

    users_created = 0

    # Create 200 men
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

        # Get random city
        city_id = get_random_french_city(cursor)

        # Create profile
        birth_date = get_random_date_of_birth()
        looking_for = random.choice(['female', 'female', 'female', 'all'])  # 75% female, 25% all
        bio = random.choice(BIOS_MALE)
        profile_photo = generate_profile_photo('male', i)

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

    # Get city IDs for Paris and Orleans
    paris_id = get_city_id(cursor, 'Paris')
    orleans_id = get_city_id(cursor, 'Orleans')

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
        looking_for = random.choice(['male', 'male', 'male', 'all'])  # 75% male, 25% all
        bio = random.choice(BIOS_FEMALE)
        profile_photo = generate_profile_photo('female', i)

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
        create_test_users(cursor)

        # Commit changes
        conn.commit()
        print("\n=== Test Data Generation Complete ===")
        print("You can now login with:")
        print("  Men: homme1@test.fr to homme200@test.fr (random French cities)")
        print("  Women: femme1@test.fr to femme200@test.fr")
        print("    - femme1 to femme50: Paris")
        print("    - femme51 to femme65: Orléans")
        print("    - femme66 to femme200: Random French cities")
        print("  Password: password123")

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
