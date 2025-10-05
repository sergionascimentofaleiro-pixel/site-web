#!/usr/bin/env python3
"""
Verify the distribution of women in Paris and Orléans
"""

import mysql.connector

# Database connection
db_config = {
    'host': 'localhost',
    'user': 'devuser',
    'password': 'Manuela2011!',
    'database': 'dating_app'
}

try:
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()

    print("=== Distribution des femmes par ville ===\n")

    # Check women in Paris
    cursor.execute("""
        SELECT COUNT(*) FROM profiles p
        JOIN cities c ON p.city_id = c.id
        JOIN users u ON p.user_id = u.id
        WHERE u.email LIKE 'femme%@test.fr'
        AND c.name = 'Paris'
    """)
    paris_count = cursor.fetchone()[0]
    print(f"Femmes à Paris: {paris_count}")

    # Check women in Orleans
    cursor.execute("""
        SELECT COUNT(*) FROM profiles p
        JOIN cities c ON p.city_id = c.id
        JOIN users u ON p.user_id = u.id
        WHERE u.email LIKE 'femme%@test.fr'
        AND c.name = 'Orleans'
    """)
    orleans_count = cursor.fetchone()[0]
    print(f"Femmes à Orléans: {orleans_count}")

    # Top 10 cities
    print("\n=== Top 10 villes avec le plus de femmes ===\n")
    cursor.execute("""
        SELECT c.name, COUNT(*) as count
        FROM profiles p
        JOIN cities c ON p.city_id = c.id
        JOIN users u ON p.user_id = u.id
        WHERE u.email LIKE 'femme%@test.fr'
        GROUP BY c.name
        ORDER BY count DESC
        LIMIT 10
    """)

    for city_name, count in cursor.fetchall():
        print(f"  {city_name}: {count} femmes")

    # Verify first 50 women are in Paris
    print("\n=== Vérification des 50 premières femmes (doivent être à Paris) ===\n")
    cursor.execute("""
        SELECT u.email, c.name
        FROM profiles p
        JOIN cities c ON p.city_id = c.id
        JOIN users u ON p.user_id = u.id
        WHERE u.email IN ('femme1@test.fr', 'femme25@test.fr', 'femme50@test.fr')
        ORDER BY u.email
    """)

    for email, city in cursor.fetchall():
        status = "✓" if city == "Paris" else "✗"
        print(f"  {status} {email}: {city}")

    # Verify women 51-65 are in Orleans
    print("\n=== Vérification des femmes 51-65 (doivent être à Orleans) ===\n")
    cursor.execute("""
        SELECT u.email, c.name
        FROM profiles p
        JOIN cities c ON p.city_id = c.id
        JOIN users u ON p.user_id = u.id
        WHERE u.email IN ('femme51@test.fr', 'femme60@test.fr', 'femme65@test.fr')
        ORDER BY u.email
    """)

    for email, city in cursor.fetchall():
        status = "✓" if city == "Orleans" else "✗"
        print(f"  {status} {email}: {city}")

    cursor.close()
    conn.close()

except mysql.connector.Error as err:
    print(f"Error: {err}")
