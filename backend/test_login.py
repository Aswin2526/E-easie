import urllib.request
import json
import ssl

url = "http://127.0.0.1:8000/api/users/login/"
data = json.dumps({"email": "admin@eeasie.com", "password": "admin123"}).encode("utf-8")
headers = {"Content-Type": "application/json"}
req = urllib.request.Request(url, data=data, headers=headers, method="POST")

try:
    with urllib.request.urlopen(req) as response:
        print("Success:", response.read().decode("utf-8"))
except urllib.error.HTTPError as e:
    print("Error:", e.code, e.read().decode("utf-8"))
