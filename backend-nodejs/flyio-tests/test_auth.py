#!/usr/bin/env python3
"""
Authentication API tests
Tests: /api/auth/*
"""

from config import (
    APIClient, TestStats, TestAssertions, test_data,
    log_section, log_test, log_success, log_error,
    TEST_USERS
)


def test_auth(client: APIClient, stats: TestStats):
    """Test authentication endpoints"""
    log_section("Authentication Tests")

    assertions = TestAssertions()

    # Test 1: Register new user
    log_test("Register new user")
    import time
    timestamp = int(time.time())
    register_data = {
        'email': f'test_user_{timestamp}@test.fr',
        'password': 'TestPassword123!'
    }

    response, status = client.post('/auth/register', register_data)
    passed = assertions.assert_status(status, 201, "Register")

    if passed and response:
        passed = assertions.assert_has_fields(
            response,
            ['message', 'token', 'userId'],
            "Register response"
        )

        if passed and 'userId' in response:
            user_id = response['userId']
            if user_id:
                test_data.track_user(user_id)
                log_success(f"Created test user ID: {user_id}")

    stats.add_result(passed)

    # Test 2: Register with existing email (should fail)
    log_test("Register with existing email (should fail)")
    response, status = client.post('/auth/register', {
        'email': TEST_USERS['femme1']['email'],  # Existing user
        'password': 'TestPassword123!'
    })
    # Accept both 400 and 409 (Conflict)
    passed = status in [400, 409]
    if passed:
        log_success(f"Duplicate email: Status {status} ✓")
    else:
        log_error(f"Duplicate email: Expected status 400 or 409, got {status}")
    stats.add_result(passed)

    # Test 3: Register with short password (should fail)
    log_test("Register with short password (should fail)")
    response, status = client.post('/auth/register', {
        'email': 'another_test@test.fr',
        'password': '12345'  # Too short (< 6 chars)
    })
    passed = assertions.assert_status(status, 400, "Short password")
    stats.add_result(passed)

    # Test 4: Login with valid credentials
    log_test("Login with valid credentials")
    login_data = {
        'email': TEST_USERS['femme1']['email'],
        'password': TEST_USERS['femme1']['password']
    }

    response, status = client.post('/auth/login', login_data)
    passed = assertions.assert_status(status, 200, "Login")

    if passed and response:
        passed = assertions.assert_has_fields(
            response,
            ['token', 'userId'],
            "Login response"
        )

        if passed and 'token' in response:
            # Save token for subsequent tests
            client.set_token(response['token'])
            log_success(f"Token saved for authenticated requests")

    stats.add_result(passed)

    # Test 5: Login with invalid password (should fail)
    log_test("Login with invalid password (should fail)")
    response, status = client.post('/auth/login', {
        'email': TEST_USERS['femme1']['email'],
        'password': 'wrong_password'
    })
    passed = assertions.assert_status(status, 401, "Invalid password")
    stats.add_result(passed)

    # Test 6: Login with non-existent email (should fail)
    log_test("Login with non-existent email (should fail)")
    response, status = client.post('/auth/login', {
        'email': 'nonexistent@test.fr',
        'password': 'password123'
    })
    passed = assertions.assert_status(status, 401, "Non-existent email")
    stats.add_result(passed)

    # Test 7: Get current user (requires authentication)
    log_test("Get current user (authenticated)")
    response, status = client.get('/auth/me')
    passed = assertions.assert_status(status, 200, "Get current user")

    if passed and response:
        passed = assertions.assert_has_fields(
            response,
            ['id', 'email', 'created_at'],
            "Current user response"
        )

    stats.add_result(passed)

    # Test 8: Get current user without token (should fail)
    log_test("Get current user without token (should fail)")
    # Temporarily clear token
    token = client.token
    client.clear_token()

    response, status = client.get('/auth/me')
    passed = assertions.assert_status(status, 401, "No token")

    # Restore token
    client.set_token(token)
    stats.add_result(passed)

    # Test 9: Update user language
    log_test("Update user language")
    language_data = {
        'language': 'en'
    }

    response, status = client.put('/auth/language', language_data)
    passed = assertions.assert_status(status, 200, "Update language")

    if passed and response:
        passed = assertions.assert_has_fields(
            response,
            ['message'],
            "Language update response"
        )

    stats.add_result(passed)

    # Test 10: Get current user to verify language
    log_test("Verify language was saved")
    response, status = client.get('/auth/me')
    passed = assertions.assert_status(status, 200, "Get user after update")

    if passed and response:
        passed = assertions.assert_equals(
            response.get('preferred_language'),
            'en',
            'preferred_language',
            "Language persisted"
        )

    stats.add_result(passed)


if __name__ == '__main__':
    client = APIClient()
    stats = TestStats()

    test_auth(client, stats)

    stats.print_summary()
    exit(0 if stats.failed == 0 else 1)
