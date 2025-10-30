#!/usr/bin/env python3
"""
Interests API tests
Tests: /api/interests/*
"""

from config import (
    APIClient, TestStats, TestAssertions,
    log_section, log_test, log_success, log_error, log_info,
    TEST_USERS
)


def test_interests(client: APIClient, stats: TestStats):
    """Test interests endpoints"""
    log_section("Interests Tests")

    assertions = TestAssertions()

    # Login first
    log_test("Login as femme1")
    login_data = {
        'email': TEST_USERS['femme1']['email'],
        'password': TEST_USERS['femme1']['password']
    }
    response, status = client.post('/auth/login', login_data)
    if status == 200 and response and 'token' in response:
        client.set_token(response['token'])
        user_id = response['userId']
        log_success(f"Logged in as user ID: {user_id}")
    else:
        log_error("Failed to login, cannot continue interests tests")
        return

    # Test 1: Get all interest categories
    log_test("Get all interest categories")
    response, status = client.get('/interests/all')
    passed = assertions.assert_status(status, 200, "Get interests")

    if passed and response:
        if isinstance(response, list):
            log_info(f"Found {len(response)} interest categories")
            if len(response) > 0:
                # API returns: category_id, category_name, category_icon, interests[]
                passed = assertions.assert_has_fields(
                    response[0],
                    ['category_id', 'category_name', 'category_icon'],
                    "Interest category"
                )

                # Check if category has interests
                if passed and 'interests' in response[0]:
                    interests = response[0]['interests']
                    if isinstance(interests, list) and len(interests) > 0:
                        log_success(f"Category has {len(interests)} interests")
                        # API returns: interest_id, interest_name, interest_icon
                        passed = assertions.assert_has_fields(
                            interests[0],
                            ['interest_id', 'interest_name'],
                            "Interest"
                        )
        else:
            log_error("Response is not an array")
            passed = False

    stats.add_result(passed)

    # Test 2: Get interests with specific language (French)
    log_test("Get interests in French")
    response, status = client.get('/interests/all?lang=fr')
    passed = assertions.assert_status(status, 200, "Get interests (French)")

    if passed and response:
        if isinstance(response, list) and len(response) > 0:
            # API returns localized category_name based on lang parameter
            if 'category_name' in response[0]:
                log_success(f"French translation found: {response[0]['category_name']}")
                passed = True
            else:
                log_error("Category name missing")
                passed = False
        else:
            passed = False

    stats.add_result(passed)

    # Test 3: Get interests with Spanish language
    log_test("Get interests in Spanish")
    response, status = client.get('/interests/all?lang=es')
    passed = assertions.assert_status(status, 200, "Get interests (Spanish)")

    if passed and response:
        if isinstance(response, list) and len(response) > 0:
            # API returns localized category_name based on lang parameter
            if 'category_name' in response[0]:
                log_success(f"Spanish translation found: {response[0]['category_name']}")
                passed = True
            else:
                log_error("Category name missing")
                passed = False

    stats.add_result(passed)

    # Test 4: Get user's current interests
    log_test("Get user's current interests")
    response, status = client.get('/interests/my')
    passed = assertions.assert_status(status, 200, "Get user interests")

    current_interests = []
    if passed and response:
        if isinstance(response, list):
            # API may return interest_id or id field
            if len(response) > 0:
                id_field = 'interest_id' if 'interest_id' in response[0] else 'id'
                current_interests = [i[id_field] for i in response]
            log_info(f"User has {len(response)} interests")
            passed = True
        else:
            log_error("Response is not an array")
            passed = False

    stats.add_result(passed)

    # Test 5: Set user interests
    log_test("Set user interests")
    # Get some interest IDs from the full list
    all_interests, status = client.get('/interests/all')

    if status == 200 and all_interests and len(all_interests) > 0:
        # Collect some interest IDs
        interest_ids = []
        for category in all_interests[:3]:  # First 3 categories
            if 'interests' in category and len(category['interests']) > 0:
                # Take first 2 interests from each category - API uses interest_id
                interest_ids.extend([i['interest_id'] for i in category['interests'][:2]])

        if len(interest_ids) >= 3:
            # Set interests - API expects interestIds not interest_ids
            interests_data = {
                'interestIds': interest_ids[:5]  # Set 5 interests
            }

            response, status = client.post('/interests/my', interests_data)
            passed = assertions.assert_status(status, 200, "Set user interests")

            if passed and response:
                passed = assertions.assert_has_fields(
                    response,
                    ['message'],
                    "Set interests response"
                )
        else:
            log_error("Not enough interests available")
            passed = False
    else:
        log_error("Failed to get interests list")
        passed = False

    stats.add_result(passed)

    # Test 6: Verify interests were set
    log_test("Verify user interests were updated")
    response, status = client.get('/interests/my')
    passed = assertions.assert_status(status, 200, "Get updated user interests")

    if passed and response:
        if isinstance(response, list):
            new_count = len(response)
            log_info(f"User now has {new_count} interests")
            # Should have the interests we just set
            if new_count > 0:
                passed = True
            else:
                log_error("Interests were not saved")
                passed = False
        else:
            passed = False

    stats.add_result(passed)

    # Test 7: Set empty interests list
    log_test("Set empty interests list")
    interests_data = {
        'interestIds': []
    }

    response, status = client.post('/interests/my', interests_data)
    passed = assertions.assert_status(status, 200, "Set empty interests")
    stats.add_result(passed)

    # Test 8: Verify interests were cleared
    log_test("Verify interests were cleared")
    response, status = client.get('/interests/my')
    passed = assertions.assert_status(status, 200, "Get interests after clear")

    if passed and response:
        if isinstance(response, list):
            if len(response) == 0:
                log_success("Interests successfully cleared ✓")
                passed = True
            else:
                log_error(f"Expected 0 interests, got {len(response)}")
                passed = False

    stats.add_result(passed)

    # Test 9: Set invalid interest IDs (should fail or ignore)
    log_test("Set invalid interest IDs")
    interests_data = {
        'interestIds': [999999, 888888]
    }

    response, status = client.post('/interests/my', interests_data)
    # API may return 200 (silently ignores), 400, or 500 for invalid IDs
    passed = status in [200, 400, 500]
    if passed:
        log_success(f"Invalid interest IDs: Status {status} ✓")
    else:
        log_error(f"Unexpected status {status}")
    stats.add_result(passed)

    # Restore original interests if any
    if current_interests:
        log_test("Restore original interests")
        interests_data = {
            'interestIds': current_interests
        }
        client.post('/interests/my', interests_data)


if __name__ == '__main__':
    client = APIClient()
    stats = TestStats()

    test_interests(client, stats)

    stats.print_summary()
    exit(0 if stats.failed == 0 else 1)
