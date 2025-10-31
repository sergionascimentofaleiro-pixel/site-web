#!/usr/bin/env python3
"""
Main test runner for Fly.io backend API tests
Runs all test modules in sequence and provides summary
"""

import sys
import os
import subprocess
import time
import signal
import atexit
import getpass
from datetime import datetime
from pathlib import Path

# Load .env file from parent directory (backend-nodejs)
_backend_dir = Path(__file__).parent.parent
_env_file = _backend_dir / '.env'
if _env_file.exists():
    with open(_env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                # Remove quotes if present
                value = value.strip('"').strip("'")
                os.environ[key] = value

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

# Global variables to track processes
backend_process = None
proxy_process = None
postgres_was_running = False
sudo_password = None  # Cache sudo password to avoid asking twice


def stop_proxy():
    """Stop the Fly.io proxy process"""
    global proxy_process, postgres_was_running

    if proxy_process:
        log_info("Stopping Fly.io proxy...")
        proxy_process.terminate()
        try:
            proxy_process.wait(timeout=5)
            log_success("Proxy stopped")
        except subprocess.TimeoutExpired:
            log_warning("Proxy didn't stop gracefully, killing...")
            proxy_process.kill()
            proxy_process.wait()
        proxy_process = None

    # Restart local PostgreSQL if it was running before
    if postgres_was_running:
        global sudo_password
        log_info("Restarting local PostgreSQL service...")

        try:
            if sudo_password:
                # Use cached password
                result = subprocess.run(
                    ["sudo", "-S", "systemctl", "start", "postgresql"],
                    input=sudo_password + "\n",
                    text=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=30
                )
            else:
                # Try without password (if sudo is cached)
                result = subprocess.run(
                    ["sudo", "systemctl", "start", "postgresql"],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=30
                )

            if result.returncode == 0:
                log_success("Local PostgreSQL restarted successfully")
            else:
                log_warning("Could not restart PostgreSQL. You may need to start it manually: sudo systemctl start postgresql")
        except subprocess.TimeoutExpired:
            log_warning("PostgreSQL restart timeout. You may need to start it manually: sudo systemctl start postgresql")
        except KeyboardInterrupt:
            log_warning("PostgreSQL restart cancelled. You may need to start it manually: sudo systemctl start postgresql")
        except Exception as e:
            log_warning(f"Could not restart PostgreSQL: {e}. You may need to start it manually: sudo systemctl start postgresql")


def start_proxy():
    """Start Fly.io proxy for remote database access"""
    global proxy_process, postgres_was_running, sudo_password

    # Get Fly.io app name from environment
    flyio_app_name = os.getenv('FLYIO_APP_NAME', 'curvy-backend')
    db_app_name = f"{flyio_app_name}-db"

    log_info(f"Starting Fly.io proxy for {db_app_name}...")

    # Check if local PostgreSQL is running on port 5432
    log_info("Checking if local PostgreSQL is using port 5432...")
    try:
        result = subprocess.run(
            ["systemctl", "is-active", "postgresql"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        if result.returncode == 0:
            postgres_was_running = True
            log_warning("Local PostgreSQL is running on port 5432")
            log_info("Stopping PostgreSQL to free port for Fly.io proxy...")

            try:
                # Ask for sudo password
                print()
                log_info("Please enter your sudo password to stop PostgreSQL:")
                sudo_password = getpass.getpass("Password: ")
                print()

                # Run sudo with password via stdin
                result = subprocess.run(
                    ["sudo", "-S", "systemctl", "stop", "postgresql"],
                    input=sudo_password + "\n",
                    text=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=30
                )

                if result.returncode == 0:
                    log_success("Local PostgreSQL stopped successfully")
                    time.sleep(2)
                else:
                    log_error("Failed to stop PostgreSQL - incorrect password or permission denied")
                    sudo_password = None  # Clear invalid password
                    return False

            except subprocess.TimeoutExpired:
                log_error("Failed to stop PostgreSQL (timeout)")
                return False
            except KeyboardInterrupt:
                log_error("Operation cancelled by user")
                return False
            except Exception as e:
                log_error(f"Failed to stop PostgreSQL: {e}")
                return False
        else:
            log_info("Local PostgreSQL is not running")
    except FileNotFoundError:
        log_info("systemctl not found, assuming PostgreSQL not installed")
    except Exception as e:
        log_warning(f"Could not check PostgreSQL status: {e}")

    # Start proxy in background
    try:
        proxy_process = subprocess.Popen(
            ["flyctl", "proxy", "5432:5432", "-a", db_app_name],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )

        log_info(f"Proxy started with PID {proxy_process.pid}")
        log_info("Waiting for proxy to accept connections...")

        # Wait for proxy to be ready (test actual database connectivity)
        max_retries = 15
        retry_count = 0
        connected = False

        # Get DATABASE_URL for testing connection
        database_url = os.getenv('DATABASE_URL')

        while retry_count < max_retries:
            # Check if proxy process is still running
            if proxy_process.poll() is not None:
                log_error("Proxy process died")
                return False

            # Try to connect to database through proxy
            try:
                result = subprocess.run(
                    ["psql", database_url, "-c", "SELECT 1;"],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=2
                )
                if result.returncode == 0:
                    connected = True
                    break
            except:
                pass

            retry_count += 1
            if retry_count < max_retries:
                log_info(f"Attempt {retry_count}/{max_retries} - waiting for connection...")
            time.sleep(1)

        if connected:
            log_success("Proxy is ready and accepting connections")
            return True
        else:
            log_error(f"Failed to connect to database through proxy after {max_retries} attempts")
            stop_proxy()
            return False

    except Exception as e:
        log_error(f"Failed to start proxy: {e}")
        return False


def stop_backend():
    """Stop the test backend process"""
    global backend_process

    if backend_process:
        log_info("Stopping test backend...")
        backend_process.terminate()
        try:
            backend_process.wait(timeout=5)
            log_success("Backend stopped")
        except subprocess.TimeoutExpired:
            log_warning("Backend didn't stop gracefully, killing...")
            backend_process.kill()
            backend_process.wait()
        backend_process = None


def start_backend():
    """Start backend with NODE_ENV=test"""
    global backend_process

    # Path to backend directory
    backend_dir = Path(__file__).parent.parent

    log_info("Starting backend with rate limiting disabled...")

    # Prepare environment with DISABLE_RATE_LIMIT=true
    # Note: We don't use NODE_ENV=test because that prevents server.listen()
    env = os.environ.copy()
    env['DISABLE_RATE_LIMIT'] = 'true'

    # Start backend process
    try:
        # Use node directly instead of npm run dev to avoid nodemon buffering issues
        backend_process = subprocess.Popen(
            ['node', 'src/server.js'],
            cwd=backend_dir,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,  # Merge stderr into stdout
            text=True,
            bufsize=1
        )

        log_info("Waiting for backend to be ready...")

        # Wait for backend to be ready (max 30 seconds)
        max_retries = 30
        for i in range(max_retries):
            # Check if process is still running
            if backend_process.poll() is not None:
                # Process died, read output
                output = backend_process.stdout.read()
                log_error("Backend process died during startup")
                log_error(f"Output: {output}")
                return False

            try:
                import requests
                response = requests.get('http://localhost:3000/api/health', timeout=1)
                if response.status_code == 200:
                    log_success("Backend is ready")
                    return True
            except:
                pass
            time.sleep(1)

        # Timeout - show backend logs
        log_error("Backend didn't start within 30 seconds")
        if backend_process.poll() is None:
            # Still running, read available output
            log_warning("Backend logs (last output):")
            # Use non-blocking read or set a timeout
            try:
                import select
                if select.select([backend_process.stdout], [], [], 0)[0]:
                    output = backend_process.stdout.read(4096)
                    print(output)
            except:
                pass

        stop_backend()
        return False

    except Exception as e:
        log_error(f"Failed to start backend: {e}")
        import traceback
        traceback.print_exc()
        return False


def cleanup_all():
    """Cleanup function called on exit"""
    stop_backend()
    stop_proxy()


# Register cleanup to run on exit
atexit.register(cleanup_all)


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

    # Check if we need to start Fly.io proxy for remote database
    database_url = os.getenv('DATABASE_URL', '')
    use_proxy = 'localhost:5432' in database_url and 'curvy_backend' in database_url

    if use_proxy:
        log_info("Detected remote database configuration (DATABASE_URL with localhost proxy)")
        log_info("Starting Fly.io proxy for database access...")

        if not start_proxy():
            log_error("Failed to start Fly.io proxy, cannot run tests")
            log_info("Make sure you are logged in to Fly.io: flyctl auth login")
            sys.exit(1)
    else:
        log_info("Using local database (no proxy needed)")

    # Kill any existing backend process on port 3000
    log_info("Checking for existing backend process...")
    try:
        # Try to find and kill process using port 3000
        result = subprocess.run(
            ["lsof", "-ti:3000"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        if result.stdout.strip():
            pids = result.stdout.strip().split('\n')
            for pid in pids:
                try:
                    subprocess.run(["kill", "-9", pid], check=False)
                    log_info(f"Killed existing backend process (PID: {pid})")
                except:
                    pass
            time.sleep(2)  # Wait for process to fully terminate
        else:
            log_info("No existing backend process found")
    except Exception as e:
        log_info("No existing backend to stop")

    # Start backend with rate limiting disabled
    if not start_backend():
        log_error("Failed to start backend, cannot run tests")
        stop_proxy()  # Stop proxy if it was started
        sys.exit(1)

    try:
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

        # Run cleanup script automatically
        print()
        log_info("Running cleanup script to remove test data...")
        try:
            cleanup_result = subprocess.run(
                ["python3", "cleanup.py"],
                cwd=Path(__file__).parent,
                timeout=60
            )
            if cleanup_result.returncode == 0:
                log_success("Test data cleaned up successfully")
            else:
                log_warning("Cleanup script finished with warnings")
        except subprocess.TimeoutExpired:
            log_warning("Cleanup script timeout")
        except Exception as e:
            log_warning(f"Could not run cleanup script: {e}")
            log_info("You can run it manually: python3 cleanup.py")

        print()

        # Exit with appropriate code
        return 0 if all_passed else 1

    finally:
        # Always stop backend and proxy
        log_info("\nCleaning up test environment...")
        stop_backend()
        stop_proxy()
        log_success("Test environment cleaned up, all processes stopped")


if __name__ == '__main__':
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        log_warning("\n\nTests interrupted by user")
        stop_backend()
        stop_proxy()
        sys.exit(1)
    except Exception as e:
        log_error(f"Fatal error: {e}")
        import traceback
        traceback.print_exc()
        stop_backend()
        stop_proxy()
        sys.exit(1)
