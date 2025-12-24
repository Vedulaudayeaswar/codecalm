"""
Database Setup Script for CodeCalm Platform

This script helps you initialize the PostgreSQL database for CodeCalm.

Steps:
1. Install PostgreSQL
2. Create database
3. Configure environment variables
4. Initialize tables
"""

import os
import sys
import subprocess
from pathlib import Path

def print_header(text):
    """Print formatted header"""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70 + "\n")

def check_postgresql():
    """Check if PostgreSQL is installed"""
    try:
        result = subprocess.run(['psql', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ PostgreSQL found: {result.stdout.strip()}")
            return True
        return False
    except FileNotFoundError:
        return False

def create_database():
    """Interactive database creation"""
    print("📋 Database Configuration")
    print("-" * 70)
    
    db_name = input("Enter database name [codecalm]: ").strip() or "codecalm"
    db_user = input("Enter database username [postgres]: ").strip() or "postgres"
    db_password = input("Enter database password: ").strip()
    db_host = input("Enter database host [localhost]: ").strip() or "localhost"
    db_port = input("Enter database port [5432]: ").strip() or "5432"
    
    # Create connection string
    database_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    
    print(f"\n✅ Database URL: {database_url.replace(db_password, '****')}")
    
    return database_url, db_name, db_user, db_password

def create_env_file(database_url):
    """Create or update .env file"""
    env_path = Path(__file__).parent / '.env'
    
    # Read existing .env if it exists
    env_vars = {}
    if env_path.exists():
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value
    
    # Update DATABASE_URL
    env_vars['DATABASE_URL'] = database_url
    
    # Ensure other required vars exist
    if 'SECRET_KEY' not in env_vars:
        import secrets
        env_vars['SECRET_KEY'] = secrets.token_hex(32)
    
    if 'FLASK_ENV' not in env_vars:
        env_vars['FLASK_ENV'] = 'development'
    
    # Write .env file
    with open(env_path, 'w') as f:
        f.write("# CodeCalm Database Configuration\n")
        f.write(f"# Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        for key, value in env_vars.items():
            f.write(f"{key}={value}\n")
    
    print(f"✅ Created/updated .env file at: {env_path}")

def create_database_postgresql(db_name, db_user, db_password):
    """Create PostgreSQL database"""
    print(f"\n📦 Creating database '{db_name}'...")
    
    # SQL command to create database
    create_db_sql = f"CREATE DATABASE {db_name};"
    
    print("\n🔧 Run this command in psql:")
    print("-" * 70)
    print(f"psql -U {db_user} -c \"{create_db_sql}\"")
    print("-" * 70)
    
    proceed = input("\nHave you created the database? (y/n): ").strip().lower()
    return proceed == 'y'

def initialize_tables():
    """Initialize database tables"""
    print("\n🗃️  Initializing database tables...")
    
    try:
        # Import app and db
        from main import app
        from models import db
        
        with app.app_context():
            db.create_all()
            print("✅ All tables created successfully!")
            
            # Print table info
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            
            print(f"\n📊 Created {len(tables)} tables:")
            for table in tables:
                columns = inspector.get_columns(table)
                print(f"   ✓ {table} ({len(columns)} columns)")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to create tables: {e}")
        return False

def main():
    """Main setup flow"""
    print_header("CodeCalm Database Setup")
    
    # Step 1: Check PostgreSQL
    if not check_postgresql():
        print("❌ PostgreSQL is not installed or not in PATH")
        print("\n📥 Install PostgreSQL:")
        print("   Windows: https://www.postgresql.org/download/windows/")
        print("   Mac: brew install postgresql")
        print("   Linux: sudo apt-get install postgresql")
        sys.exit(1)
    
    # Step 2: Get database configuration
    print_header("Step 1: Database Configuration")
    database_url, db_name, db_user, db_password = create_database()
    
    # Step 3: Create database
    print_header("Step 2: Create Database")
    if not create_database_postgresql(db_name, db_user, db_password):
        print("❌ Setup cancelled. Please create the database and run this script again.")
        sys.exit(1)
    
    # Step 4: Create .env file
    print_header("Step 3: Environment Configuration")
    create_env_file(database_url)
    
    # Step 5: Initialize tables
    print_header("Step 4: Initialize Tables")
    if not initialize_tables():
        print("❌ Failed to initialize tables. Check your database connection.")
        sys.exit(1)
    
    # Success!
    print_header("✅ Setup Complete!")
    print("Your CodeCalm database is ready to use!")
    print("\n📝 Next steps:")
    print("   1. Review the .env file and add API keys (GROQ_API_KEY, etc.)")
    print("   2. Run: python main.py")
    print("   3. Access the platform at http://localhost:5000")
    print("\n💡 API Endpoints:")
    print("   - POST /api/auth/register - Register new user")
    print("   - POST /api/auth/login - Login user")
    print("   - GET /api/chat/conversations - Get chat history")
    print("\n")

if __name__ == '__main__':
    from datetime import datetime
    main()
