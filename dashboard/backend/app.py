from flask import Flask, jsonify, request
from flask_cors import CORS
try:
    from .logic import NetworkLogic
except ImportError:
    from logic import NetworkLogic
import os
from dotenv import load_dotenv
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Config
app.config["MONGO_URI"] = os.getenv("MONGO_URI")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "fallback-secret-key")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=1)

print(f"Loaded MONGO_URI: {app.config['MONGO_URI'][:20]}...")

# Fix for Render/MongoDB Atlas SSL Handshake Error (Updated Force Push)
import ssl
app.config["MONGO_TLS_ALLOW_INVALID_CERTIFICATES"] = True 
mongo = PyMongo(app, tls=True, tlsAllowInvalidCertificates=True)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Allow all origins for the hackathon demo to prevent any CORS issues
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize Logic (Loads Data)
# Assumes we run this from dashboard/backend, so data is up 2 levels
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "output")

logic = NetworkLogic(DATA_DIR)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        "status": "NetOptic Deployment Online",
        "endpoints": [
            "/api/topology",
            "/api/optimize",
            "/api/financials",
            "/health"
        ]
    })

@app.route('/api/topology', methods=['GET'])
def get_topology():
    return jsonify(logic.get_topology())

@app.route('/api/optimize', methods=['POST'])
def optimize():
    data = request.json
    buffer_us = data.get('buffer_size_us', 143)
    buffer_sec = float(buffer_us) / 1e6
    
    results = logic.find_optimal_capacity(buffer_sec)
    return jsonify(results)

@app.route('/api/financials', methods=['POST'])
def financials():
    data = request.json
    buffer_us = data.get('buffer_size_us', 143)
    cost_per_gbps = data.get('cost_per_gbps', 5000) # Default to $5000/Gbps (Enterprise/Telco scale)
    
    buffer_sec = float(buffer_us) / 1e6
    results = logic.calculate_financials(buffer_sec, cost_per_gbps)
    return jsonify(results)


@app.route('/api/stats/<link_id>', methods=['GET'])
def get_stats(link_id):
    data = logic.get_link_stats(link_id)
    return jsonify(data)

@app.route('/api/traffic/<link_id>', methods=['GET'])
def get_traffic(link_id):
    data = logic.get_traffic_sample(link_id)
    return jsonify(data)

@app.route('/api/images/<path:filename>')
def serve_image(filename):
    from flask import send_from_directory
    return send_from_directory(DATA_DIR, filename)

@app.route('/api/report/capacity', methods=['GET'])
def get_capacity_report():
    import pandas as pd
    try:
        csv_path = os.path.join(DATA_DIR, "link_capacity_estimates.csv")
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            return jsonify(df.to_dict(orient='records'))
        return jsonify([])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# === AUTH ROUTES ===

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    name = data.get('name', 'User')

    if not email or not password:
        return jsonify({"msg": "Missing email or password"}), 400

    if mongo.db.users.find_one({"email": email}):
        return jsonify({"msg": "Email already exists"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    user_id = mongo.db.users.insert_one({
        "email": email,
        "password": hashed_password,
        "name": name
    }).inserted_id

    access_token = create_access_token(identity=str(user_id))

    return jsonify({
        "msg": "User created successfully",
        "token": access_token,
        "user": {"email": email, "name": name}
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = mongo.db.users.find_one({"email": email})
    if not user:
        return jsonify({"msg": "Invalid credentials"}), 401

    if bcrypt.check_password_hash(user['password'], password):
        access_token = create_access_token(identity=str(user['_id']))
        return jsonify({
            "msg": "Login successful",
            "token": access_token,
            "user": {"email": email, "name": user.get('name', 'User')}
        }), 200
    else:
        return jsonify({"msg": "Invalid credentials"}), 401


if __name__ == '__main__':
    app.run(port=5000, debug=True)
