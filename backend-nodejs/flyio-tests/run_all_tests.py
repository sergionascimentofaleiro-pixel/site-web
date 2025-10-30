#!/usr/bin/env python3
"""
Main test runner for Fly.io backend API tests
Runs all test modules in sequence and provides summary
"""

import sys
import os
from datetime import datetime

from config import (
    APIClient, TestStats, init_tests,
    log_section, log_success, log_error, log_info, log_warning
)

# Import test modules
from test_auth import test_auth
from test_profile import test_profile
from test_matches import test_matches
from test_messages import test_messages
from test_interests import test_interests
from test_locations import test_locations


def print_banner():
    """Print test suite banner"""
    print()
    print("=" * 60)
    print("  DATING APP API TEST SUITE")
    print("  Fly.io Backend Tests")
    print("=" * 60)
    print()
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()


def print_final_summary(overall_stats: TestStats, test_results: dict):
    """Print final test summary"""
    print()
    print("=" * 60)
    print("  FINAL TEST SUMMARY")
    print("=" * 60)
    print()

    # Individual test module results
    for test_name, (passed_count, total_count) in test_results.items():
        status_icon = "✅" if passed_count == total_count else "❌"
        success_rate = (passed_count / total_count * 100) if total_count > 0 else 0
        print(f"{status_icon} {test_name:20s}: {passed_count:3d}/{total_count:3d} ({success_rate:5.1f}%)")

    print()
    print(f"Total tests run: {overall_stats.total}")
    print(f"Passed: {overall_stats.passed}")
    print(f"Failed: {overall_stats.failed}")

    success_rate = (overall_stats.passed / overall_stats.total * 100) if overall_stats.total > 0 else 0
    print(f"Overall success rate: {success_rate:.1f}%")

    print()
    print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    if overall_stats.failed == 0:
        log_success("🎉 All tests passed!")
        return True
    else:
        log_error(f"❌ {overall_stats.failed} test(s) failed")
        return False


def run_test_module(name: str, test_func, client: APIClient, overall_stats: TestStats) -> tuple:
    """Run a single test module and return results"""
    log_section(f"Running {name}")

    module_stats = TestStats()
    try:
        test_func(client, module_stats)
    except Exception as e:
        log_error(f"Test module '{name}' crashed: {e}")
        import traceback
        traceback.print_exc()

    # Add module stats to overall stats
    overall_stats.total += module_stats.total
    overall_stats.passed += module_stats.passed
    overall_stats.failed += module_stats.failed

    # Print module summary
    print()
    if module_stats.failed == 0:
        log_success(f"{name}: {module_stats.passed}/{module_stats.total} tests passed ✅")
    else:
        log_error(f"{name}: {module_stats.failed}/{module_stats.total} tests failed ❌")

    return (module_stats.passed, module_stats.total)


def main():
    """Main test runner"""
    print_banner()

    # Check if backend URL is set
    backend_url = os.getenv('BACKEND_URL', 'http://localhost:3000')
    log_info(f"Testing backend at: {backend_url}")

    # Initialize test environment
    init_tests()

    # Create API client
    client = APIClient()

    # Overall statistics
    overall_stats = TestStats()
    test_results = {}

    # Run all test modules in sequence
    test_modules = [
        ('Authentication', test_auth),
        ('Profile', test_profile),
        ('Matches', test_matches),
        ('Messages', test_messages),
        ('Interests', test_interests),
        ('Locations', test_locations),
    ]

    for name, test_func in test_modules:
        try:
            results = run_test_module(name, test_func, client, overall_stats)
            test_results[name] = results
        except KeyboardInterrupt:
            log_warning("\n\nTests interrupted by user")
            break
        except Exception as e:
            log_error(f"Unexpected error in {name}: {e}")
            test_results[name] = (0, 0)

    # Print final summary
    all_passed = print_final_summary(overall_stats, test_results)

    # Remind user to run cleanup
    print()
    log_warning("⚠️  Don't forget to run cleanup script to remove test data:")
    log_info("  python3 cleanup.py")
    print()

    # Exit with appropriate code
    sys.exit(0 if all_passed else 1)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        log_warning("\n\nTests interrupted by user")
        sys.exit(1)
    except Exception as e:
        log_error(f"Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
