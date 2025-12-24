"""
SQLAlchemy Database Models for CodeCalm Platform

Tables:
- users: User registration and authentication
- sessions: Login sessions and JWT tracking
- conversations: High-level chat sessions per user per assistant
- messages: Individual messages within conversations
- routing_logs: Multi-LLM routing decisions and analytics
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import secrets

db = SQLAlchemy()

# =============================================================================
# USER MANAGEMENT
# =============================================================================

class User(db.Model):
    """
    User registration and authentication table
    """
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    hashed_password = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='student')  # student, parent, professional
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    # Relationships
    sessions = db.relationship('Session', backref='user', lazy=True, cascade='all, delete-orphan')
    conversations = db.relationship('Conversation', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    def set_password(self, password):
        """Hash and store password securely using bcrypt"""
        self.hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
    
    def check_password(self, password):
        """Verify password against stored hash"""
        return check_password_hash(self.hashed_password, password)
    
    def to_dict(self, include_sensitive=False):
        """Convert user object to dictionary"""
        data = {
            'id': self.id,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role,
            'created_at': self.created_at.isoformat(),
            'is_active': self.is_active
        }
        if include_sensitive:
            data['updated_at'] = self.updated_at.isoformat()
        return data


class Session(db.Model):
    """
    Login session tracking with JWT/token support
    """
    __tablename__ = 'sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    session_token = db.Column(db.String(255), unique=True, nullable=False, index=True)
    user_agent = db.Column(db.String(500))
    ip_address = db.Column(db.String(45))  # IPv6 compatible
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    revoked = db.Column(db.Boolean, default=False, nullable=False)
    
    def __repr__(self):
        return f'<Session {self.session_token[:20]}... for User {self.user_id}>'
    
    @staticmethod
    def generate_token():
        """Generate a secure random session token"""
        return secrets.token_urlsafe(32)
    
    def is_valid(self):
        """Check if session is still valid"""
        return not self.revoked and datetime.utcnow() < self.expires_at
    
    def revoke(self):
        """Revoke this session"""
        self.revoked = True
        db.session.commit()
    
    def to_dict(self):
        """Convert session to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'expires_at': self.expires_at.isoformat(),
            'is_valid': self.is_valid()
        }


# =============================================================================
# CHAT HISTORY MANAGEMENT
# =============================================================================

class Conversation(db.Model):
    """
    High-level chat sessions per user per AI assistant
    """
    __tablename__ = 'conversations'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    assistant_type = db.Column(db.String(50), nullable=False, index=True)  # mental, codegent, parent, professional, student, fitness
    title = db.Column(db.String(255), nullable=False, default='New Conversation')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = db.Column(db.DateTime, nullable=True)  # Soft delete
    
    # Relationships
    messages = db.relationship('Message', backref='conversation', lazy=True, cascade='all, delete-orphan')
    routing_logs = db.relationship('RoutingLog', backref='conversation', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Conversation {self.id}: {self.title} ({self.assistant_type})>'
    
    def is_deleted(self):
        """Check if conversation is soft-deleted"""
        return self.deleted_at is not None
    
    def soft_delete(self):
        """Soft delete this conversation"""
        self.deleted_at = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self, include_messages=False):
        """Convert conversation to dictionary"""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'assistant_type': self.assistant_type,
            'title': self.title,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'message_count': len(self.messages)
        }
        if include_messages:
            data['messages'] = [msg.to_dict() for msg in self.messages if not msg.deleted_at]
        return data


class Message(db.Model):
    """
    Individual messages within conversations
    """
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False, index=True)
    sender = db.Column(db.String(20), nullable=False)  # user, system, assistant
    content = db.Column(db.Text, nullable=False)
    model_used = db.Column(db.String(100))  # e.g., "groq-llama-70b", "gpt-4", "claude-3"
    tokens = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    deleted_at = db.Column(db.DateTime, nullable=True)  # Soft delete
    
    # Relationships
    routing_log = db.relationship('RoutingLog', backref='message', uselist=False, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Message {self.id} from {self.sender} in Conversation {self.conversation_id}>'
    
    def soft_delete(self):
        """Soft delete this message"""
        self.deleted_at = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self):
        """Convert message to dictionary"""
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'sender': self.sender,
            'content': self.content,
            'model_used': self.model_used,
            'tokens': self.tokens,
            'created_at': self.created_at.isoformat()
        }


# =============================================================================
# ANALYTICS & ROUTING
# =============================================================================

class RoutingLog(db.Model):
    """
    Multi-LLM routing decision logs for analytics
    """
    __tablename__ = 'routing_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False, index=True)
    message_id = db.Column(db.Integer, db.ForeignKey('messages.id', ondelete='CASCADE'), nullable=True, index=True)
    selected_model = db.Column(db.String(100), nullable=False)  # claude-3, gpt-4, gemini-pro, groq-llama
    query_type = db.Column(db.String(50))  # coding, teaching, general, mental_health, fitness
    latency_ms = db.Column(db.Integer, default=0)
    cost_estimate = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    reasoning = db.Column(db.Text)  # Why this model was selected
    
    def __repr__(self):
        return f'<RoutingLog {self.id}: {self.selected_model} for Conversation {self.conversation_id}>'
    
    def to_dict(self):
        """Convert routing log to dictionary"""
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'message_id': self.message_id,
            'selected_model': self.selected_model,
            'query_type': self.query_type,
            'latency_ms': self.latency_ms,
            'cost_estimate': self.cost_estimate,
            'created_at': self.created_at.isoformat(),
            'reasoning': self.reasoning
        }


# =============================================================================
# DATABASE INITIALIZATION HELPER
# =============================================================================

def init_db(app):
    """
    Initialize database with Flask app
    
    Usage:
        from models import init_db
        init_db(app)
    """
    db.init_app(app)
    
    with app.app_context():
        # Create all tables
        db.create_all()
        print("✅ Database tables created successfully")
        
        # Print table info
        print("\n📊 Database Schema:")
        print("   - users (registration & authentication)")
        print("   - sessions (login tracking)")
        print("   - conversations (chat sessions)")
        print("   - messages (individual messages)")
        print("   - routing_logs (LLM routing analytics)")
