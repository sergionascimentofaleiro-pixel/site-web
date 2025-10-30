#!/usr/bin/env python3
"""
Cleanup script for test data
Removes all data created during tests, keeping only data from full-reset.sh
"""

import os
import sys
from config import (
    TestData, log_section, log_success, log_error, log_info, log_warning
)

# Database connection
DB_TYPE = os.getenv('DB_TYPE', 'postgres')
DATABASE_URL = os.getenv('DATABASE_URL')


def get_db_connection():
    """Get database connection based on DB_TYPE"""
    if DB_TYPE == 'postgres':
        import psycopg2

        if DATABASE_URL:
            log_info("Connecting to PostgreSQL using DATABASE_URL")
            return psycopg2.connect(DATABASE_URL)
        else:
            log_info("Connecting to local PostgreSQL")
            return psycopg2.connect(
                host='localhost',
                user=os.getenv('DB_USER', 'postgres'),
                password=os.getenv('DB_PASSWORD', 'postgres'),
                database=os.getenv('DB_NAME', 'dating_app')
            )
    else:
        import mysql.connector

        log_info("Connecting to local MySQL/MariaDB")
        return mysql.connector.connect(
            host='localhost',
            user=os.getenv('DB_USER', 'devuser'),
            password=os.getenv('DB_PASSWORD', 'Manuela2011!'),
            database=os.getenv('DB_NAME', 'dating_app')
        )


def cleanup_messages(cursor, message_ids):
    """Delete test messages"""
    if not message_ids:
        log_info("No test messages to clean up")
        return 0

    log_info(f"Cleaning up {len(message_ids)} test messages...")

    placeholders = ','.join(['%s'] * len(message_ids))
    query = f"DELETE FROM messages WHERE id IN ({placeholders})"

    cursor.execute(query, message_ids)
    deleted = cursor.rowcount

    log_success(f"Deleted {deleted} test messages")
    return deleted


def cleanup_matches(cursor, match_ids):
    """Delete test matches"""
    if not match_ids:
        log_info("No test matches to clean up")
        return 0

    log_info(f"Cleaning up {len(match_ids)} test matches...")

    placeholders = ','.join(['%s'] * len(match_ids))
    query = f"DELETE FROM matches WHERE id IN ({placeholders})"

    cursor.execute(query, match_ids)
    deleted = cursor.rowcount

    log_success(f"Deleted {deleted} test matches")
    return deleted


def cleanup_likes(cursor, like_ids):
    """Delete test likes"""
    if not like_ids:
        log_info("No test likes to clean up")
        return 0

    log_info(f"Cleaning up {len(like_ids)} test likes...")

    placeholders = ','.join(['%s'] * len(like_ids))
    query = f"DELETE FROM likes WHERE id IN ({placeholders})"

    cursor.execute(query, like_ids)
    deleted = cursor.rowcount

    log_success(f"Deleted {deleted} test likes")
    return deleted


def cleanup_users(cursor, user_ids):
    """Delete test users and their associated data"""
    if not user_ids:
        log_info("No test users to clean up")
        return 0

    log_info(f"Cleaning up {len(user_ids)} test users...")

    placeholders = ','.join(['%s'] * len(user_ids))

    # Delete associated data first (CASCADE should handle this, but being explicit)
    queries = [
        f"DELETE FROM messages WHERE sender_id IN ({placeholders}) OR receiver_id IN ({placeholders})",
        f"DELETE FROM matches WHERE user1_id IN ({placeholders}) OR user2_id IN ({placeholders})",
        f"DELETE FROM likes WHERE from_user_id IN ({placeholders}) OR to_user_id IN ({placeholders})",
        f"DELETE FROM profile_interests WHERE profile_id IN (SELECT id FROM profiles WHERE user_id IN ({placeholders}))",
        f"DELETE FROM profiles WHERE user_id IN ({placeholders})",
        f"DELETE FROM users WHERE id IN ({placeholders})"
    ]

    total_deleted = 0
    for query in queries:
        # Duplicate user_ids for queries with multiple placeholders
        params = user_ids * query.count(placeholders)
        cursor.execute(query, params)
        total_deleted += cursor.rowcount

    log_success(f"Deleted {len(user_ids)} test users and {total_deleted - len(user_ids)} associated records")
    return len(user_ids)


def main():
    """Main cleanup function"""
    log_section("Test Data Cleanup")

    # Load test data
    test_data = TestData.load()

    if not any([test_data.users, test_data.likes, test_data.matches, test_data.messages]):
        log_info("No test data to clean up")
        return

    # Summary of what will be deleted
    log_info("Test data to be cleaned up:")
    log_info(f"  - Users: {len(test_data.users)}")
    log_info(f"  - Likes: {len(test_data.likes)}")
    log_info(f"  - Matches: {len(test_data.matches)}")
    log_info(f"  - Messages: {len(test_data.messages)}")
    print()

    # Confirm deletion
    response = input("⚠️  This will permanently delete all test data. Continue? (yes/no): ")
    if response.lower() != 'yes':
        log_warning("Cleanup cancelled")
        return

    try:
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()

        log_info("Starting cleanup...")
        print()

        # Clean up in order (messages -> matches -> likes -> users)
        # to respect foreign key constraints
        cleanup_messages(cursor, test_data.messages)
        cleanup_matches(cursor, test_data.matches)
        cleanup_likes(cursor, test_data.likes)
        cleanup_users(cursor, test_data.users)

        # Commit changes
        conn.commit()
        log_success("All changes committed to database")

        # Close connection
        cursor.close()
        conn.close()

        # Clear test data file
        test_data.users = []
        test_data.likes = []
        test_data.matches = []
        test_data.messages = []
        test_data.save()

        log_success("Test data file cleared")

        print()
        log_section("Cleanup Complete")
        log_success("✅ All test data has been removed")
        log_info("Database now contains only data from full-reset.sh")

    except Exception as e:
        log_error(f"Cleanup failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        log_warning("\n\nCleanup interrupted by user")
        sys.exit(1)
    except Exception as e:
        log_error(f"Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
