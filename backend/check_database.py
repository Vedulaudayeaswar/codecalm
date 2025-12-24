"""
Database Inspector - Check tables and data in codecalm.db
"""
import sqlite3
from datetime import datetime
import os

# Database is in the instance folder
DB_FILE = os.path.join("instance", "codecalm.db")

def inspect_database():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    print("\n" + "="*60)
    print("📊 CODECALM DATABASE INSPECTOR")
    print("="*60)
    
    # List all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print(f"\n✅ Tables found: {len(tables)}")
    for table in tables:
        print(f"   - {table[0]}")
    
    # Check users
    print("\n" + "-"*60)
    print("👥 USERS TABLE")
    print("-"*60)
    cursor.execute("SELECT id, email, full_name, role, created_at FROM users;")
    users = cursor.fetchall()
    print(f"Total users: {len(users)}")
    for user in users:
        print(f"   ID: {user[0]} | Email: {user[1]} | Name: {user[2]} | Role: {user[3]}")
    
    # Check sessions
    print("\n" + "-"*60)
    print("🔐 SESSIONS TABLE")
    print("-"*60)
    cursor.execute("SELECT id, user_id, ip_address, created_at, revoked FROM sessions;")
    sessions = cursor.fetchall()
    print(f"Total sessions: {len(sessions)}")
    for session in sessions:
        status = "❌ Revoked" if session[4] else "✅ Active"
        print(f"   ID: {session[0]} | User: {session[1]} | IP: {session[2]} | {status}")
    
    # Check conversations
    print("\n" + "-"*60)
    print("💬 CONVERSATIONS TABLE")
    print("-"*60)
    cursor.execute("SELECT id, user_id, assistant_type, title, created_at FROM conversations;")
    conversations = cursor.fetchall()
    print(f"Total conversations: {len(conversations)}")
    if conversations:
        for conv in conversations:
            print(f"   ID: {conv[0]} | User: {conv[1]} | Assistant: {conv[2]} | Title: {conv[3]}")
    else:
        print("   ⚠️  No conversations yet")
    
    # Check messages
    print("\n" + "-"*60)
    print("📨 MESSAGES TABLE")
    print("-"*60)
    cursor.execute("SELECT id, conversation_id, sender, content, created_at FROM messages;")
    messages = cursor.fetchall()
    print(f"Total messages: {len(messages)}")
    if messages:
        for msg in messages[:10]:  # Show first 10
            content_preview = msg[3][:50] + "..." if len(msg[3]) > 50 else msg[3]
            print(f"   ID: {msg[0]} | Conv: {msg[1]} | {msg[2]}: {content_preview}")
        if len(messages) > 10:
            print(f"   ... and {len(messages) - 10} more messages")
    else:
        print("   ⚠️  No messages yet")
    
    # Check routing logs
    print("\n" + "-"*60)
    print("🔀 ROUTING LOGS TABLE")
    print("-"*60)
    cursor.execute("SELECT id, conversation_id, selected_model, query_type, created_at FROM routing_logs;")
    logs = cursor.fetchall()
    print(f"Total routing logs: {len(logs)}")
    if logs:
        for log in logs[:5]:  # Show first 5
            print(f"   ID: {log[0]} | Conv: {log[1]} | Model: {log[2]} | Type: {log[3]}")
    else:
        print("   ℹ️  No routing logs yet")
    
    print("\n" + "="*60)
    print("✅ Database inspection complete!")
    print("="*60 + "\n")
    
    conn.close()

if __name__ == "__main__":
    try:
        inspect_database()
    except Exception as e:
        print(f"\n❌ Error: {e}")
