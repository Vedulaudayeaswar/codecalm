"""
Database Configuration for CodeCalm Platform

Environment Variables Required:
- DATABASE_URL: PostgreSQL connection string
  Example: postgresql://username:password@localhost:5432/codecalm
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class DatabaseConfig:
    """Database configuration settings"""
    
    # Get DATABASE_URL from environment
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///codecalm.db')
    
    # Fix for Render PostgreSQL URL (postgres:// -> postgresql://)
    if DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
    
    # PostgreSQL or SQLite connection
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    
    # SQLAlchemy settings
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.getenv('FLASK_ENV') == 'development'  # Log SQL queries in dev mode
    
    # Connection pool settings (only for PostgreSQL)
    is_postgres = DATABASE_URL.startswith('postgresql://')
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_recycle': 3600,
        'pool_pre_ping': True,
        'max_overflow': 20
    } if is_postgres else {}
    
    # Session configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    SESSION_TYPE = 'filesystem'
    
    @staticmethod
    def init_app(app):
        """Initialize app with database config"""
        app.config['SQLALCHEMY_DATABASE_URI'] = DatabaseConfig.SQLALCHEMY_DATABASE_URI
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = DatabaseConfig.SQLALCHEMY_TRACK_MODIFICATIONS
        app.config['SQLALCHEMY_ECHO'] = DatabaseConfig.SQLALCHEMY_ECHO
        app.config['SQLALCHEMY_ENGINE_OPTIONS'] = DatabaseConfig.SQLALCHEMY_ENGINE_OPTIONS
        app.config['SECRET_KEY'] = DatabaseConfig.SECRET_KEY
        
        print(f"✅ Database configured: {DatabaseConfig.get_db_name()}")
    
    @staticmethod
    def get_db_name():
        """Extract database name from connection string"""
        uri = DatabaseConfig.SQLALCHEMY_DATABASE_URI
        if uri:
            # Extract database name from URI
            parts = uri.split('/')
            if len(parts) > 3:
                return parts[-1].split('?')[0]
        return 'unknown'


# Example .env file template
ENV_TEMPLATE = """
# CodeCalm Database Configuration
# Copy this to .env and fill in your values

# PostgreSQL Connection
DATABASE_URL=postgresql://username:password@localhost:5432/codecalm

# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your-secret-key-here-change-in-production

# Groq API (for AI features)
GROQ_API_KEY=your-groq-api-key-here

# Optional: Additional API Keys
ANTHROPIC_API_KEY=your-anthropic-key-here
OPENAI_API_KEY=your-openai-key-here
GOOGLE_API_KEY=your-google-key-here
"""
