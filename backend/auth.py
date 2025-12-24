"""
Authentication Routes for CodeCalm Platform

Handles:
- User registration
- User login
- Session management
- Logout
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from models import db, User, Session
import re

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# =============================================================================
# VALIDATION HELPERS
# =============================================================================

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """
    Validate password strength
    Requirements: 
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    return True, "Valid"

def validate_role(role):
    """Validate user role"""
    valid_roles = ['student', 'parent', 'professional']
    return role.lower() in valid_roles


# =============================================================================
# REGISTRATION ROUTE
# =============================================================================

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user
    
    Request Body:
    {
        "email": "user@example.com",
        "password": "SecurePass123",
        "full_name": "John Doe",
        "role": "student"  // student, parent, or professional
    }
    
    Response:
    {
        "success": true,
        "message": "Registration successful",
        "user": {...}
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'full_name', 'role']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        full_name = data['full_name'].strip()
        role = data['role'].strip().lower()
        
        # Validate email format
        if not validate_email(email):
            return jsonify({
                'success': False,
                'message': 'Invalid email format'
            }), 400
        
        # Check if email already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({
                'success': False,
                'message': 'Email already registered'
            }), 409
        
        # Validate password strength
        is_valid, message = validate_password(password)
        if not is_valid:
            return jsonify({
                'success': False,
                'message': message
            }), 400
        
        # Validate role
        if not validate_role(role):
            return jsonify({
                'success': False,
                'message': 'Invalid role. Must be: student, parent, or professional'
            }), 400
        
        # Create new user
        new_user = User(
            email=email,
            full_name=full_name,
            role=role
        )
        new_user.set_password(password)  # Hash password
        
        # Save to database
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'user': new_user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Registration failed: {str(e)}'
        }), 500


# =============================================================================
# LOGIN ROUTE
# =============================================================================

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login user and create session
    
    Request Body:
    {
        "email": "user@example.com",
        "password": "SecurePass123"
    }
    
    Response:
    {
        "success": true,
        "message": "Login successful",
        "user": {...},
        "session": {...}
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'email' not in data or 'password' not in data:
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        
        # Find user by email
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'Invalid email or password'
            }), 401
        
        # Check if user is active
        if not user.is_active:
            return jsonify({
                'success': False,
                'message': 'Account is deactivated. Please contact support.'
            }), 403
        
        # Verify password
        if not user.check_password(password):
            return jsonify({
                'success': False,
                'message': 'Invalid email or password'
            }), 401
        
        # Create new session
        session_token = Session.generate_token()
        new_session = Session(
            user_id=user.id,
            session_token=session_token,
            user_agent=request.headers.get('User-Agent', 'Unknown'),
            ip_address=request.remote_addr,
            expires_at=datetime.utcnow() + timedelta(days=30)  # 30-day session
        )
        
        db.session.add(new_session)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': user.to_dict(),
            'session': {
                'token': session_token,
                'expires_at': new_session.expires_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Login failed: {str(e)}'
        }), 500


# =============================================================================
# LOGOUT ROUTE
# =============================================================================

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    Logout user and revoke session
    
    Request Headers:
    Authorization: Bearer <session_token>
    
    Response:
    {
        "success": true,
        "message": "Logout successful"
    }
    """
    try:
        # Get session token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'No session token provided'
            }), 401
        
        session_token = auth_header.split(' ')[1]
        
        # Find and revoke session
        session = Session.query.filter_by(session_token=session_token).first()
        
        if not session:
            return jsonify({
                'success': False,
                'message': 'Invalid session token'
            }), 401
        
        session.revoke()
        
        return jsonify({
            'success': True,
            'message': 'Logout successful'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Logout failed: {str(e)}'
        }), 500


# =============================================================================
# SESSION VALIDATION
# =============================================================================

@auth_bp.route('/validate', methods=['GET'])
def validate_session():
    """
    Validate session token
    
    Request Headers:
    Authorization: Bearer <session_token>
    
    Response:
    {
        "success": true,
        "valid": true,
        "user": {...}
    }
    """
    try:
        # Get session token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'valid': False,
                'message': 'No session token provided'
            }), 401
        
        session_token = auth_header.split(' ')[1]
        
        # Find session
        session = Session.query.filter_by(session_token=session_token).first()
        
        if not session or not session.is_valid():
            return jsonify({
                'success': False,
                'valid': False,
                'message': 'Invalid or expired session'
            }), 401
        
        # Get user
        user = User.query.get(session.user_id)
        
        if not user or not user.is_active:
            return jsonify({
                'success': False,
                'valid': False,
                'message': 'User not found or inactive'
            }), 401
        
        return jsonify({
            'success': True,
            'valid': True,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'valid': False,
            'message': f'Validation failed: {str(e)}'
        }), 500


# =============================================================================
# GET USER PROFILE
# =============================================================================

@auth_bp.route('/profile', methods=['GET'])
def get_profile():
    """
    Get current user profile
    
    Request Headers:
    Authorization: Bearer <session_token>
    
    Response:
    {
        "success": true,
        "user": {...}
    }
    """
    try:
        # Get session token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'No session token provided'
            }), 401
        
        session_token = auth_header.split(' ')[1]
        
        # Find session
        session = Session.query.filter_by(session_token=session_token).first()
        
        if not session or not session.is_valid():
            return jsonify({
                'success': False,
                'message': 'Invalid or expired session'
            }), 401
        
        # Get user
        user = User.query.get(session.user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        return jsonify({
            'success': True,
            'user': user.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to get profile: {str(e)}'
        }), 500
