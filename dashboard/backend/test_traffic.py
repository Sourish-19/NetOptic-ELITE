import urllib.request
import json

API_URL = "http://127.0.0.1:5000/api"

def test_traffic():
    url = f"{API_URL}/traffic/1"
    print(f"GET {url}")
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            print(f"Traffic Points: {len(data)}")
            if len(data) > 0:
                print("SUCCESS: Traffic received.")
    except Exception as e:
        print(f"ERROR Traffic: {e}")

def test_optimize():
    url = f"{API_URL}/optimize"
    payload = json.dumps({"buffer_size_us": 250}).encode()
    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
    print(f"\nPOST {url}")
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            print(f"Optimization keys: {list(data.keys())}")
            if "1" in data:
                 print("SUCCESS: Optimize received.")
    except Exception as e:
        print(f"ERROR Optimize: {e}")

if __name__ == "__main__":
    test_traffic()
    test_optimize()
