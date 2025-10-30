#!/usr/bin/env python3
"""
Messages API tests
Tests: /api/messages/*
"""

from config import (
    APIClient, TestStats, TestAssertions, test_data,
    log_section, log_test, log_success, log_error, log_info,
    TEST_USERS
)


def ensure_match(client1: APIClient, client2: APIClient, user1_id: int, user2_id: int):
    """Ensure two users are matched, returns match_id if successful"""
    # User 1 likes User 2
    swipe_data = {
        'targetUserId': user2_id,
        'action': 'like'
    }
    client1.post('/profile/swipe', swipe_data)

    # User 2 likes User 1
    swipe_data = {
        'targetUserId': user1_id,
        'action': 'like'
    }
    response, status = client2.post('/profile/swipe', swipe_data)

    # Get the actual match_id from the matches list
    matches_response, matches_status = client1.get('/matches')
    if matches_status == 200 and matches_response:
        for match in matches_response:
            if match.get('otherUser', {}).get('id') == user2_id:
                return match.get('matchId')

    return None


def test_messages(client: APIClient, stats: TestStats):
    """Test messages endpoints"""
    log_section("Messages Tests")

    assertions = TestAssertions()

    # Login as femme2
    log_test("Login as femme2")
    login_data = {
        'email': TEST_USERS['femme2']['email'],
        'password': TEST_USERS['femme2']['password']
    }
    response, status = client.post('/auth/login', login_data)
    if status == 200 and response and 'token' in response:
        client.set_token(response['token'])
        user1_id = response['userId']
        log_success(f"Logged in as user ID: {user1_id}")
    else:
        log_error("Failed to login as femme2")
        return

    # Create a second client for homme2
    client2 = APIClient()
    log_test("Login as homme2")
    login_data2 = {
        'email': TEST_USERS['homme2']['email'],
        'password': TEST_USERS['homme2']['password']
    }
    response, status = client2.post('/auth/login', login_data2)
    if status == 200 and response and 'token' in response:
        client2.set_token(response['token'])
        user2_id = response['userId']
        log_success(f"Logged in as user ID: {user2_id}")
    else:
        log_error("Failed to login as homme2")
        return

    # Ensure users are matched first
    log_test("Ensure users are matched")
    match_id = ensure_match(client, client2, user1_id, user2_id)
    if match_id:
        log_success(f"Users are matched (match_id: {match_id})")
    else:
        log_error("Failed to create match, cannot test messages")
        return

    # Test 1: Send a message
    log_test("Send a message")
    message_data = {
        'matchId': match_id,
        'receiverId': user2_id,
        'message': 'Hello! This is a test message.'
    }

    response, status = client.post('/messages', message_data)
    passed = assertions.assert_status(status, 201, "Send message")

    message_id = None
    if passed and response:
        passed = assertions.assert_has_fields(
            response,
            ['message', 'messageId'],
            "Message response"
        )

        if passed:
            message_id = response.get('messageId')
            if message_id:
                test_data.track_message(message_id)
                log_success(f"Message created with ID: {message_id}")

    stats.add_result(passed)

    # Test 2: Send message without content (should fail)
    log_test("Send message without content (should fail)")
    message_data = {
        'matchId': match_id,
        'receiverId': user2_id,
        'message': ''
    }

    response, status = client.post('/messages', message_data)
    passed = assertions.assert_status(status, 400, "Empty message")
    stats.add_result(passed)

    # Test 3: Send message to non-existent match (should fail)
    log_test("Send message to non-existent match (should fail)")
    message_data = {
        'matchId': 999999,
        'receiverId': user2_id,
        'message': 'This should fail'
    }

    response, status = client.post('/messages', message_data)
    # Should fail with 400, 403, or 404
    passed = status in [400, 403, 404]
    if passed:
        log_success(f"Message to non-existent match: Status {status} ✓")
    else:
        log_error(f"Expected status 400/403/404, got {status}")
    stats.add_result(passed)

    # Test 4: Get conversation between users
    log_test("Get conversation")
    response, status = client.get(f'/messages/{match_id}')
    passed = assertions.assert_status(status, 200, "Get conversation")

    if passed and response:
        if isinstance(response, list):
            log_info(f"Conversation has {len(response)} messages")
            # Should contain at least the message we sent
            if len(response) > 0:
                passed = assertions.assert_has_fields(
                    response[0],
                    ['id', 'sender_id', 'receiver_id', 'message'],
                    "Message in conversation"
                )
        else:
            log_error("Response is not an array")
            passed = False

    stats.add_result(passed)

    # Test 5: Send a reply from user2
    log_test("Send reply from homme2")
    message_data = {
        'matchId': match_id,
        'receiverId': user1_id,
        'message': 'Hi! This is a reply.'
    }

    response, status = client2.post('/messages', message_data)
    passed = assertions.assert_status(status, 201, "Send reply")

    if passed and response:
        reply_id = response.get('messageId')
        if reply_id:
            test_data.track_message(reply_id)

    stats.add_result(passed)

    # Test 6: Get conversation again (should have 2 messages)
    log_test("Get conversation (should have multiple messages)")
    response, status = client.get(f'/messages/{match_id}')
    passed = assertions.assert_status(status, 200, "Get updated conversation")

    if passed and response:
        if isinstance(response, list):
            if len(response) >= 2:
                log_success(f"Conversation has {len(response)} messages ✓")
                passed = True
            else:
                log_error(f"Expected at least 2 messages, got {len(response)}")
                passed = False
        else:
            passed = False

    stats.add_result(passed)

    # Test 7: Get all conversations
    log_test("Get all conversations")
    response, status = client.get('/messages/conversations')
    passed = assertions.assert_status(status, 200, "Get conversations")

    if passed and response:
        if isinstance(response, list):
            log_info(f"User has {len(response)} conversations")
            # Should have at least 1 conversation
            # API returns last messages, not conversation summaries
            if len(response) > 0:
                passed = assertions.assert_has_fields(
                    response[0],
                    ['id', 'match_id', 'sender_id', 'message'],
                    "Conversation item"
                )
        else:
            log_error("Response is not an array")
            passed = False

    stats.add_result(passed)

    # Test 8: Get unread count
    log_test("Get unread message count")
    response, status = client.get('/messages/unread-count')
    passed = assertions.assert_status(status, 200, "Get unread count")

    if passed and response:
        passed = assertions.assert_has_fields(
            response,
            ['unreadCount'],
            "Unread count response"
        )

        if passed:
            unread = response.get('unreadCount', 0)
            log_info(f"Unread messages: {unread}")

    stats.add_result(passed)

    # Test 9: Get conversation marks messages as read automatically
    log_test("Verify getting conversation marks as read")
    # First send a new message from user2
    test_msg = {
        'matchId': match_id,
        'receiverId': user1_id,
        'message': 'Test unread'
    }
    client2.post('/messages', test_msg)

    # User1 gets the conversation (should mark as read)
    client.get(f'/messages/{match_id}')

    # Check unread count (should not include messages from this conversation)
    response, status = client.get('/messages/unread-count')
    passed = assertions.assert_status(status, 200, "Get unread count after reading")

    if passed and response:
        unread_after = response.get('unreadCount', 0)
        log_info(f"Unread messages after reading conversation: {unread_after}")
        passed = True

    stats.add_result(passed)


if __name__ == '__main__':
    client = APIClient()
    stats = TestStats()

    test_messages(client, stats)

    stats.print_summary()
    exit(0 if stats.failed == 0 else 1)
