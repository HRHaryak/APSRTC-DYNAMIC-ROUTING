"""
Simple local authentication service for testing.
NO PASSWORD HASHING - FOR DEVELOPMENT ONLY!
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from jose import JWTError, jwt
import json
import os

# Security configuration
SECRET_KEY = "apsrtc-dev-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours

# User database file
USERS_FILE = "backend/data/users.json"

# Default users (plain text passwords - FOR TESTING ONLY!)
DEFAULT_USERS = {
    "admin": {
        "username": "admin",
        "full_name": "System Administrator",
        "email": "admin@apsrtc.gov.in",
        "role": "admin",
        "password": "admin123",  # Plain text for testing
        "disabled": False,
        "created_at": datetime.now().isoformat()
    },
    "planner": {
        "username": "planner",
        "full_name": "Transport Planner",
        "email": "planner@apsrtc.gov.in",
        "role": "planner",
        "password": "planner123",
        "disabled": False,
        "created_at": datetime.now().isoformat()
    },
    "control_room": {
        "username": "control_room",
        "full_name": "Control Room Operator",
        "email": "control@apsrtc.gov.in",
        "role": "control_room",
        "password": "control123",
        "disabled": False,
        "created_at": datetime.now().isoformat()
    },
    "depot": {
        "username": "depot",
        "full_name": "Depot Manager",
        "email": "depot@apsrtc.gov.in",
        "role": "depot",
        "password": "depot123",
        "disabled": False,
        "created_at": datetime.now().isoformat()
    }
}


def ensure_users_file():
    """Ensure users file exists with default users."""
    os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
    
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'w') as f:
            json.dump(DEFAULT_USERS, f, indent=2)
        
        print(f"✓ Created default users file at {USERS_FILE}")
        print("  Default users: admin, planner, control_room, depot")
        print("  Default password for all: <username>123")


def load_users() -> Dict:
    """Load users from JSON file."""
    ensure_users_file()
    
    try:
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading users: {e}")
        return DEFAULT_USERS.copy()


def save_users(users: Dict):
    """Save users to JSON file."""
    ensure_users_file()
    
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)


def get_user(username: str) -> Optional[Dict]:
    """Get user by username."""
    users = load_users()
    return users.get(username)


def authenticate_user(username: str, password: str) -> Optional[Dict]:
    """Authenticate a user (plain text password for testing)."""
    user = get_user(username)
    
    if not user:
        return None
    
    # Simple plain text password check (FOR TESTING ONLY!)
    if user.get("password") != password:
        return None
    
    if user.get("disabled", False):
        return None
    
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[Dict]:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        
        if username is None:
            return None
        
        return payload
        
    except JWTError:
        return None


def create_user(username: str, password: str, full_name: str, email: str, role: str) -> Dict:
    """Create a new user."""
    users = load_users()
    
    if username in users:
        raise ValueError(f"User {username} already exists")
    
    if role not in ["admin", "planner", "control_room", "depot"]:
        raise ValueError(f"Invalid role: {role}")
    
    new_user = {
        "username": username,
        "full_name": full_name,
        "email": email,
        "role": role,
        "password": password,  # Plain text for testing
        "disabled": False,
        "created_at": datetime.now().isoformat()
    }
    
    users[username] = new_user
    save_users(users)
    
    # Return user without password
    user_data = new_user.copy()
    del user_data["password"]
    
    return user_data


def update_user(username: str, updates: Dict) -> Dict:
    """Update a user's information."""
    users = load_users()
    
    if username not in users:
        raise ValueError(f"User {username} not found")
    
    # Don't allow changing username
    if "username" in updates:
        del updates["username"]
    
    users[username].update(updates)
    save_users(users)
    
    # Return user without password
    user_data = users[username].copy()
    if "password" in user_data:
        del user_data["password"]
    
    return user_data


def delete_user(username: str):
    """Delete a user."""
    users = load_users()
    
    if username not in users:
        raise ValueError(f"User {username} not found")
    
    del users[username]
    save_users(users)


def list_users() -> List[Dict]:
    """List all users (without passwords)."""
    users = load_users()
    
    user_list = []
    for user in users.values():
        user_data = user.copy()
        if "password" in user_data:
            del user_data["password"]
        user_list.append(user_data)
    
    return user_list


# Initialize on import
ensure_users_file()
print("✓ Auth service initialized (TESTING MODE - Plain text passwords)")
