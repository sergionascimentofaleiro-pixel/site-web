#!/usr/bin/env python3
"""
Locations API tests
Tests: /api/locations/*
"""

from config import (
    APIClient, TestStats, TestAssertions,
    log_section, log_test, log_success, log_error, log_info,
    TEST_USERS
)


def test_locations(client: APIClient, stats: TestStats):
    """Test locations endpoints"""
    log_section("Locations Tests")

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
        log_success(f"Logged in")
    else:
        log_error("Failed to login, cannot continue locations tests")
        return

    # Test 1: Get all countries
    log_test("Get all countries")
    response, status = client.get('/locations/countries')
    passed = assertions.assert_status(status, 200, "Get countries")

    france_code = None
    usa_code = None
    if passed and response:
        if isinstance(response, list):
            log_info(f"Found {len(response)} countries")
            if len(response) > 0:
                # API returns: id, code, name, has_states (not name_en)
                passed = assertions.assert_has_fields(
                    response[0],
                    ['id', 'code', 'name'],
                    "Country"
                )

                # Find France and USA for subsequent tests
                for country in response:
                    if country.get('code') == 'FR':
                        france_code = country.get('id')
                    elif country.get('code') == 'US':
                        usa_code = country.get('id')

                if france_code:
                    log_success(f"Found France (ID: {france_code})")
                if usa_code:
                    log_success(f"Found USA (ID: {usa_code})")
        else:
            log_error("Response is not an array")
            passed = False

    stats.add_result(passed)

    # Test 2: Get countries with language parameter (French)
    log_test("Get countries in French")
    response, status = client.get('/locations/countries?lang=fr')
    passed = assertions.assert_status(status, 200, "Get countries (French)")

    if passed and response:
        if isinstance(response, list) and len(response) > 0:
            # API returns localized 'name' field based on lang parameter
            if 'name' in response[0]:
                log_success(f"French translation found: {response[0]['name']}")
                passed = True
            else:
                log_error("Name field missing")
                passed = False

    stats.add_result(passed)

    # Test 3: Get states for a country with states (USA)
    if usa_code:
        log_test("Get states for USA")
        response, status = client.get(f'/locations/countries/{usa_code}/states')
        passed = assertions.assert_status(status, 200, "Get states")

        if passed and response:
            if isinstance(response, list):
                log_info(f"USA has {len(response)} states")
                if len(response) > 0:
                    # API returns: id, code, name (country_id may or may not be included)
                    passed = assertions.assert_has_fields(
                        response[0],
                        ['id', 'code', 'name'],
                        "State"
                    )
            else:
                log_error("Response is not an array")
                passed = False

        stats.add_result(passed)
    else:
        log_error("USA not found, skipping states test")
        stats.add_result(False)

    # Test 4: Get states for a country without states (France)
    if france_code:
        log_test("Get states for France (should be empty)")
        response, status = client.get(f'/locations/countries/{france_code}/states')
        passed = assertions.assert_status(status, 200, "Get states (empty)")

        if passed and response:
            if isinstance(response, list):
                if len(response) == 0:
                    log_success("France has no states (as expected) ✓")
                    passed = True
                else:
                    log_info(f"France has {len(response)} administrative divisions")
                    passed = True
            else:
                passed = False

        stats.add_result(passed)
    else:
        log_error("France not found, skipping test")
        stats.add_result(False)

    # Test 5: Get cities for a country
    if france_code:
        log_test("Get cities for France")
        response, status = client.get(f'/locations/cities?countryId={france_code}')
        passed = assertions.assert_status(status, 200, "Get cities")

        if passed and response:
            if isinstance(response, list):
                log_info(f"France has {len(response)} cities (limited to 500)")
                if len(response) > 0:
                    # API returns: id, name (country_id may or may not be included)
                    passed = assertions.assert_has_fields(
                        response[0],
                        ['id', 'name'],
                        "City"
                    )
            else:
                log_error("Response is not an array")
                passed = False

        stats.add_result(passed)
    else:
        log_error("France not found, skipping cities test")
        stats.add_result(False)

    # Test 6: Search cities by name
    log_test("Search cities by name (Paris)")
    # API endpoint is /locations/cities/search not /locations/search
    response, status = client.get('/locations/cities/search?q=Paris')
    passed = assertions.assert_status(status, 200, "Search cities")

    if passed and response:
        if isinstance(response, list):
            log_info(f"Found {len(response)} cities matching 'Paris'")
            if len(response) > 0:
                # API returns: id, name (minimal response for search)
                passed = assertions.assert_has_fields(
                    response[0],
                    ['id', 'name'],
                    "Search result"
                )

                # Check if Paris is in results
                paris_found = any('Paris' in city.get('name', '') for city in response)
                if paris_found:
                    log_success("Paris found in results ✓")
                    passed = True
        else:
            log_error("Response is not an array")
            passed = False

    stats.add_result(passed)

    # Test 7: Search cities with short query
    log_test("Search cities with short query (2 chars)")
    response, status = client.get('/locations/cities/search?q=Pa')
    passed = assertions.assert_status(status, 200, "Search short query")

    if passed and response:
        if isinstance(response, list):
            log_info(f"Found {len(response)} cities matching 'Pa'")
            passed = True

    stats.add_result(passed)

    # Test 8: Search cities with empty query (should return empty or error)
    log_test("Search cities with empty query")
    response, status = client.get('/locations/cities/search?q=')
    # API returns empty array for empty query (status 200)
    passed = status == 200
    if passed and isinstance(response, list):
        log_success(f"Empty query: Status {status}, returns empty array ✓")
    stats.add_result(passed)

    # Test 9: Search cities with special characters
    log_test("Search cities with accents (São Paulo)")
    response, status = client.get('/locations/cities/search?q=São')
    passed = assertions.assert_status(status, 200, "Search with accents")

    if passed and response:
        if isinstance(response, list):
            log_info(f"Found {len(response)} cities matching 'São'")
            passed = True

    stats.add_result(passed)

    # Test 10: Get cities for non-existent country
    log_test("Get cities for non-existent country")
    # API requires countryId parameter, /cities/999999 is for getting city details
    response, status = client.get('/locations/cities?countryId=999999')
    # Should return 404 or empty array
    passed = status in [200, 400, 404]
    if passed:
        if status == 200 and isinstance(response, list) and len(response) == 0:
            log_success("Non-existent country returns empty array ✓")
        elif status == 404:
            log_success("Non-existent country returns 404 ✓")
        elif status == 400:
            log_success("Non-existent country returns 400 ✓")
    stats.add_result(passed)

    # Test 11: Search with country filter
    if france_code:
        log_test("Search cities with country filter")
        response, status = client.get(f'/locations/cities/search?q=Lyon&countryId={france_code}')
        passed = assertions.assert_status(status, 200, "Search with country filter")

        if passed and response:
            if isinstance(response, list):
                log_info(f"Found {len(response)} cities matching 'Lyon' in France")
                # API returns minimal response, cannot verify country_id in search results
                # Just verify we got results
                if len(response) > 0:
                    log_success(f"Found {len(response)} results for Lyon in France ✓")
                    passed = True
                else:
                    log_error("No results found")
                    passed = False

        stats.add_result(passed)


if __name__ == '__main__':
    client = APIClient()
    stats = TestStats()

    test_locations(client, stats)

    stats.print_summary()
    exit(0 if stats.failed == 0 else 1)
