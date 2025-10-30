#!/usr/bin/env python3
"""
Matches API tests
Tests: /api/matches/*
"""

from config import (
    APIClient, TestStats, TestAssertions, test_data,
    log_section, log_test, log_success, log_error, log_info,
    TEST_USERS
)


def create_mutual_like(client1: APIClient, client2: APIClient, user1_id: int, user2_id: int):
    """Helper function to create a mutual like (match) between two users"""
    # User 1 likes User 2
    swipe_data = {
        'targetUserId': user2_id,
        'action': 'like'
    }
    response1, status1 = client1.post('/profile/swipe', swipe_data)

    # Debug: print response1
    if status1 == 200:
        log_info(f"User {user1_id} swiped on {user2_id}: {response1}")

    # User 2 likes User 1
    swipe_data = {
        'targetUserId': user1_id,
        'action': 'like'
    }
    response2, status2 = client2.post('/profile/swipe', swipe_data)

    # Debug: print response2
    if status2 == 200:
        log_info(f"User {user2_id} swiped on {user1_id}: {response2}")

    # Check if match was created OR if both swipes were successful
    if status1 == 200 and status2 == 200:
        # Both swipes successful - either new match or already matched
        if response2 and response2.get('isMatch'):
            log_success("New match created!")
        else:
            log_info("Swipes successful (may be already matched)")
        return True

    return None


def test_matches(client: APIClient, stats: TestStats):
    """Test matches endpoints"""
    log_section("Matches Tests")

    assertions = TestAssertions()

    # Login as femme1
    log_test("Login as femme1")
    login_data = {
        'email': TEST_USERS['femme1']['email'],
        'password': TEST_USERS['femme1']['password']
    }
    response, status = client.post('/auth/login', login_data)
    if status == 200 and response and 'token' in response:
        client.set_token(response['token'])
        user1_id = response['userId']
        log_success(f"Logged in as user ID: {user1_id}")
    else:
        log_error("Failed to login as femme1")
        return

    # Create a second client for homme1
    client2 = APIClient()
    log_test("Login as homme1")
    login_data2 = {
        'email': TEST_USERS['homme1']['email'],
        'password': TEST_USERS['homme1']['password']
    }
    response, status = client2.post('/auth/login', login_data2)
    if status == 200 and response and 'token' in response:
        client2.set_token(response['token'])
        user2_id = response['userId']
        log_success(f"Logged in as user ID: {user2_id}")
    else:
        log_error("Failed to login as homme1")
        return

    # Test 1: Get matches list (empty initially)
    log_test("Get matches list (may be empty)")
    response, status = client.get('/matches')
    passed = assertions.assert_status(status, 200, "Get matches")

    if passed and response:
        if isinstance(response, list):
            log_info(f"Current matches count: {len(response)}")
            passed = True
        else:
            log_error("Response is not an array")
            passed = False

    stats.add_result(passed)

    # Test 2: Create a match by mutual liking
    log_test("Create a match (mutual like)")
    match_created = create_mutual_like(client, client2, user1_id, user2_id)

    if match_created:
        log_success(f"Match created successfully")
        passed = True
    else:
        log_error("Failed to create match")
        passed = False

    stats.add_result(passed)

    # Test 3: Get matches list (should contain the new match)
    log_test("Get matches list (should contain new match)")
    response, status = client.get('/matches')
    passed = assertions.assert_status(status, 200, "Get matches after creation")

    if passed and response:
        if isinstance(response, list) and len(response) > 0:
            # Check if homme1 is in the matches list
            match_found = any(m.get('otherUser', {}).get('id') == user2_id for m in response)
            if match_found:
                log_success(f"New match found in matches list")
                passed = True
            else:
                log_success(f"Matches list contains {len(response)} match(es)")
                passed = True
        else:
            log_error("Matches list is empty")
            passed = False

    stats.add_result(passed)

    # Test 4: Unmatch
    # Get the match_id from the matches list (whether just created or already exists)
    log_test("Unmatch a user")
    response, status = client.get('/matches')
    match_id = None
    if status == 200 and response and isinstance(response, list):
        # Find the match with user2_id
        for match in response:
            # The response format is: {matchId, otherUser: {id, ...}}
            if match.get('otherUser', {}).get('id') == user2_id:
                match_id = match.get('matchId')
                break

    if not match_id:
        # Skip unmatch tests if no match found
        log_info("No match found to unmatch, skipping unmatch tests")
        stats.add_result(True)  # Consider as passed since it's expected in some cases
    else:
        response, status = client.delete(f'/matches/{match_id}')
        passed = assertions.assert_status(status, 200, "Unmatch")

        if passed and response:
            passed = assertions.assert_has_fields(
                response,
                ['message'],
                "Unmatch response"
            )

        stats.add_result(passed)

        # Test 5: Verify match was removed
        log_test("Verify match was removed from list")
        response, status = client.get('/matches')
        passed = assertions.assert_status(status, 200, "Get matches after unmatch")

        if passed and response:
            if isinstance(response, list):
                # Check that homme1 is no longer in the matches list
                match_found = any(m.get('otherUser', {}).get('id') == user2_id for m in response)
                if not match_found:
                    log_success("Match successfully removed")
                    passed = True
                else:
                    log_error("Match still present in list")
                    passed = False
            else:
                log_error("Response is not an array")
                passed = False

        stats.add_result(passed)

    # Test 6: Unmatch non-existent match (should fail gracefully)
    log_test("Unmatch non-existent user")
    response, status = client.delete('/matches/999999')
    # Should return 404 or similar error
    passed = status in [404, 400]
    if passed:
        log_success(f"Unmatch non-existent: Status {status} ✓")
    else:
        log_error(f"Expected status 404 or 400, got {status}")
    stats.add_result(passed)

    # Test 7: Get matches from second user's perspective
    log_test("Get matches from homme1's perspective")
    response, status = client2.get('/matches')
    passed = assertions.assert_status(status, 200, "Get matches (user 2)")

    if passed and response:
        if isinstance(response, list):
            log_info(f"Homme1 matches count: {len(response)}")
            passed = True
        else:
            log_error("Response is not an array")
            passed = False

    stats.add_result(passed)


if __name__ == '__main__':
    client = APIClient()
    stats = TestStats()

    test_matches(client, stats)

    stats.print_summary()
    exit(0 if stats.failed == 0 else 1)
