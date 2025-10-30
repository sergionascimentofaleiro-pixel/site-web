#!/usr/bin/env python3
"""
Test configuration for Fly.io backend API tests
Contains shared configuration and utilities used by all test scripts
"""

import os
import json
from typing import Dict, List, Optional, Tuple
import requests
from dataclasses import dataclass, field
from colorama import init, Fore, Style

# Initialize colorama for colored output
init(autoreset=True)

# API Base URL
API_URL = os.getenv('BACKEND_URL', 'http://localhost:3000') + '/api'

# Test user credentials (created by full-reset.sh)
TEST_USERS = {
    'femme1': {
        'email': 'femme1@test.fr',
        'password': 'password123'
    },
    'femme2': {
        'email': 'femme2@test.fr',
        'password': 'password123'
    },
    'homme1': {
        'email': 'homme1@test.fr',
        'password': 'password123'
    },
    'homme2': {
        'email': 'homme2@test.fr',
        'password': 'password123'
    }
}

# Temporary file to track created test data for cleanup
TEST_DATA_FILE = '/tmp/flyio_test_data.json'


@dataclass
class TestData:
    """Track test data created during tests for cleanup"""
    users: List[int] = field(default_factory=list)
    likes: List[int] = field(default_factory=list)
    matches: List[int] = field(default_factory=list)
    messages: List[int] = field(default_factory=list)

    def save(self):
        """Save test data to file"""
        with open(TEST_DATA_FILE, 'w') as f:
            json.dump({
                'users': self.users,
                'likes': self.likes,
                'matches': self.matches,
                'messages': self.messages
            }, f, indent=2)

    @classmethod
    def load(cls):
        """Load test data from file"""
        if os.path.exists(TEST_DATA_FILE):
            with open(TEST_DATA_FILE, 'r') as f:
                data = json.load(f)
                return cls(**data)
        return cls()

    def track_user(self, user_id: int):
        """Track a created user for cleanup"""
        if user_id and user_id not in self.users:
            self.users.append(user_id)
            self.save()

    def track_like(self, like_id: int):
        """Track a created like for cleanup"""
        if like_id and like_id not in self.likes:
            self.likes.append(like_id)
            self.save()

    def track_match(self, match_id: int):
        """Track a created match for cleanup"""
        if match_id and match_id not in self.matches:
            self.matches.append(match_id)
            self.save()

    def track_message(self, message_id: int):
        """Track a created message for cleanup"""
        if message_id and message_id not in self.messages:
            self.messages.append(message_id)
            self.save()


# Global test data tracker
test_data = TestData.load()


# Logging helpers
def log_success(message: str):
    """Log success message in green"""
    print(f"{Fore.GREEN}✅ {message}{Style.RESET_ALL}")


def log_error(message: str):
    """Log error message in red"""
    print(f"{Fore.RED}❌ {message}{Style.RESET_ALL}")


def log_warning(message: str):
    """Log warning message in yellow"""
    print(f"{Fore.YELLOW}⚠️  {message}{Style.RESET_ALL}")


def log_info(message: str):
    """Log info message in blue"""
    print(f"{Fore.BLUE}ℹ️  {message}{Style.RESET_ALL}")


def log_section(message: str):
    """Log section header"""
    print()
    print(f"{Fore.BLUE}========================================")
    print(f"  {message}")
    print(f"========================================{Style.RESET_ALL}")


def log_test(test_name: str):
    """Log individual test name"""
    print(f"\n{Fore.CYAN}🧪 {test_name}{Style.RESET_ALL}")


# HTTP request helper
class APIClient:
    """API client with authentication support"""

    def __init__(self, base_url: str = API_URL):
        self.base_url = base_url
        self.token: Optional[str] = None
        self.session = requests.Session()

    def set_token(self, token: str):
        """Set authentication token"""
        self.token = token
        self.session.headers.update({'Authorization': f'Bearer {token}'})

    def clear_token(self):
        """Clear authentication token"""
        self.token = None
        if 'Authorization' in self.session.headers:
            del self.session.headers['Authorization']

    def request(self, method: str, endpoint: str, data: Optional[Dict] = None,
                files: Optional[Dict] = None) -> Tuple[Optional[Dict], int]:
        """
        Make HTTP request to API

        Returns: (response_json, status_code)
        """
        url = f"{self.base_url}{endpoint}"

        try:
            if files:
                # Don't set Content-Type for multipart/form-data
                response = self.session.request(method, url, data=data, files=files)
            else:
                response = self.session.request(method, url, json=data)

            # Try to parse JSON response
            try:
                response_data = response.json()
            except json.JSONDecodeError:
                response_data = {'text': response.text}

            return response_data, response.status_code

        except requests.exceptions.RequestException as e:
            log_error(f"Request failed: {e}")
            return None, 0

    def get(self, endpoint: str) -> Tuple[Optional[Dict], int]:
        """GET request"""
        return self.request('GET', endpoint)

    def post(self, endpoint: str, data: Optional[Dict] = None,
             files: Optional[Dict] = None) -> Tuple[Optional[Dict], int]:
        """POST request"""
        return self.request('POST', endpoint, data, files)

    def put(self, endpoint: str, data: Optional[Dict] = None) -> Tuple[Optional[Dict], int]:
        """PUT request"""
        return self.request('PUT', endpoint, data)

    def patch(self, endpoint: str, data: Optional[Dict] = None) -> Tuple[Optional[Dict], int]:
        """PATCH request"""
        return self.request('PATCH', endpoint, data)

    def delete(self, endpoint: str) -> Tuple[Optional[Dict], int]:
        """DELETE request"""
        return self.request('DELETE', endpoint)


# Test assertion helpers
class TestAssertions:
    """Helper class for test assertions"""

    @staticmethod
    def assert_status(actual: int, expected: int, test_name: str) -> bool:
        """Assert HTTP status code"""
        if actual == expected:
            log_success(f"{test_name}: Status {actual} ✓")
            return True
        else:
            log_error(f"{test_name}: Expected status {expected}, got {actual}")
            return False

    @staticmethod
    def assert_has_fields(data: Dict, fields: List[str], test_name: str) -> bool:
        """Assert response has required fields"""
        missing = [f for f in fields if f not in data]
        if not missing:
            log_success(f"{test_name}: All fields present ✓")
            return True
        else:
            log_error(f"{test_name}: Missing fields: {', '.join(missing)}")
            return False

    @staticmethod
    def assert_equals(actual, expected, field_name: str, test_name: str) -> bool:
        """Assert value equality"""
        if actual == expected:
            log_success(f"{test_name}: {field_name} = {expected} ✓")
            return True
        else:
            log_error(f"{test_name}: {field_name} expected {expected}, got {actual}")
            return False

    @staticmethod
    def assert_not_empty(data, field_name: str, test_name: str) -> bool:
        """Assert data is not empty"""
        if data:
            log_success(f"{test_name}: {field_name} is not empty ✓")
            return True
        else:
            log_error(f"{test_name}: {field_name} is empty")
            return False


# Test statistics
class TestStats:
    """Track test statistics"""

    def __init__(self):
        self.total = 0
        self.passed = 0
        self.failed = 0

    def add_result(self, passed: bool):
        """Add test result"""
        self.total += 1
        if passed:
            self.passed += 1
        else:
            self.failed += 1

    def print_summary(self):
        """Print test summary"""
        print()
        print("=" * 50)
        print(f"{Fore.CYAN}TEST SUMMARY{Style.RESET_ALL}")
        print("=" * 50)
        print(f"Total tests: {self.total}")
        print(f"{Fore.GREEN}Passed: {self.passed}{Style.RESET_ALL}")
        if self.failed > 0:
            print(f"{Fore.RED}Failed: {self.failed}{Style.RESET_ALL}")
        else:
            print(f"Failed: {self.failed}")

        success_rate = (self.passed / self.total * 100) if self.total > 0 else 0
        print(f"Success rate: {success_rate:.1f}%")
        print("=" * 50)

        return self.failed == 0


# Initialize test environment
def init_tests():
    """Initialize test environment"""
    log_info(f"Test environment initialized")
    log_info(f"API URL: {API_URL}")

    # Initialize test data file
    test_data.save()


if __name__ == '__main__':
    init_tests()
    log_success("Configuration module loaded successfully")
