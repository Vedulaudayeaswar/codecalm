"""
Simple Database Setup - No PostgreSQL Required!
Uses SQLite for easy local development
"""

import os
from pathlib import Path

def setup_sqlite_database():
    """Setup SQLite database for development (no PostgreSQL needed)"""
    
    print("=" * 70)
    print("  CodeCalm Database Setup - SQLite (Easy Mode)")
    print("=" * 70)
    print()
    
    # Update .env to use SQLite
    env_path = Path(__file__).parent / '.env'
    
    # Read existing .env
    with open(env_path, 'r') as f:
        lines = f.readlines()
    
    # Update DATABASE_URL to SQLite
    new_lines = []
    for line in lines:
        if line.startswith('DATABASE_URL='):
            new_lines.append('DATABASE_URL=sqlite:///codecalm.db\n')
            print("✅ Updated DATABASE_URL to use SQLite")
        else:
            new_lines.append(line)
    
    # Write back to .env
    with open(env_path, 'w') as f:
        f.writelines(new_lines)
    
    print("✅ .env file updated")
    print()
    
    # Create database tables
    print("Creating database tables...")
    try:
        from main import app
        from models import db
        
        with app.app_context():
            db.create_all()
            print("✅ All tables created successfully!")
            
            # Show tables
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            
            print(f"\n📊 Created {len(tables)} tables:")
            for table in tables:
                print(f"   ✓ {table}")
        
        print("\n" + "=" * 70)
        print("  ✅ SETUP COMPLETE!")
        print("=" * 70)
        print("\n📝 Next steps:")
        print("   1. Run: python main.py")
        print("   2. Visit: http://localhost:5000")
        print("\n💡 Database file: codecalm.db (SQLite)")
        print()
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error creating tables: {e}")
        return False

if __name__ == '__main__':
    setup_sqlite_database()
