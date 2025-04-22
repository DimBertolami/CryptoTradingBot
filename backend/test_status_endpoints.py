import requests
import json
from datetime import datetime

# Base URL for the Flask server
BASE_URL = 'http://localhost:5001/trading'

# List of endpoints to test
endpoints = [
    '/backend_status',
    '/signals_status',
    '/paper_trading_status',
    '/database_status'
]

def test_endpoint(endpoint):
    url = BASE_URL + endpoint
    print(f"\nTesting endpoint: {url}")
    
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Response Data:")
            print(json.dumps(data, indent=2))
            
            # Verify response structure
            assert 'success' in data, "Response missing 'success' field"
            assert 'timestamp' in data, "Response missing 'timestamp' field"
            assert 'status' in data, "Response missing 'status' field"
            assert 'details' in data, "Response missing 'details' field"
            
            # Verify timestamp is valid
            try:
                datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))
            except ValueError:
                print("Warning: Invalid timestamp format")
                
            print("✅ Endpoint test passed")
            return True
        else:
            print(f"❌ Error: Status code {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {str(e)}")
        return False
    except json.JSONDecodeError:
        print("❌ Error: Invalid JSON response")
        return False
    except AssertionError as e:
        print(f"❌ Error: {str(e)}")
        return False

def main():
    print("Starting status endpoint tests...")
    all_passed = True
    
    for endpoint in endpoints:
        if not test_endpoint(endpoint):
            all_passed = False
    
    if all_passed:
        print("\nAll endpoint tests passed successfully!")
    else:
        print("\nSome endpoint tests failed. Please check the logs above.")

if __name__ == '__main__':
    main()