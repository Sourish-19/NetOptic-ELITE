import urllib.request
import json
import urllib.error

API_URL = "http://127.0.0.1:5000/api/auth"

def test_signup():
    url = f"{API_URL}/signup"
    # Use a random email to avoid collision on repeated runs
    import random
    rand_int = random.randint(1000, 9999)
    email = f"testuser{rand_int}@example.com"
    payload = json.dumps({
        "email": email,
        "password": "password123",
        "name": "Test User"
    }).encode()
    
    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
    print(f"POST {url} ({email})")
    
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            print(f"Response: {data}")
            if "token" in data:
                print("SUCCESS: Signup successful.")
                return email
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.read().decode()}")
    except Exception as e:
        print(f"ERROR: {e}")
    return None

def test_login(email):
    if not email: return
    url = f"{API_URL}/login"
    payload = json.dumps({
        "email": email,
        "password": "password123"
    }).encode()
    
    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
    print(f"\nPOST {url}")
    
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            print(f"Response: {data}")
            if "token" in data:
                print("SUCCESS: Login successful.")
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.read().decode()}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    email = test_signup()
    test_login(email)
