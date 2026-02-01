import urllib.request
import json
import urllib.error

API_URL = "http://127.0.0.1:5000/api"

def test_stats():
    # Test Link 1 Stats
    url = f"{API_URL}/stats/1"
    print(f"GET {url}")
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            print(f"Response: {data}")
            if data.get("p99_gbps", 0) > 0:
                print("SUCCESS: Stats received.")
            else:
                print("FAILURE: Stats are zero.")
    except Exception as e:
        print(f"ERROR: {e}")

def test_financials():
    # Test Financials (POST)
    url = f"{API_URL}/financials"
    payload = json.dumps({"buffer_size_us": 250, "cost_per_gbps": 1200}).encode()
    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
    print(f"\nPOST {url}")
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            print(f"Response keys: {list(data.keys())}")
            print(f"Savings: {data.get('estimated_savings')}")
            if data.get("estimated_savings", 0) > 0:
                print("SUCCESS: Financials received.")
            else:
                print("FAILURE: Financials are zero.")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_stats()
    test_financials()
