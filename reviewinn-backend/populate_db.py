#!/usr/bin/env python3
"""
Script to populate the database with sample data for testing the circle functionality.
"""

import asyncio
import asyncpg
import os
from datetime import datetime, timedelta
import bcrypt
import sys

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/reviewsite_db')

async def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

async def populate_database():
    """Populate the database with sample data."""
    try:
        # Connect to database
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ Connected to database successfully")
        
        # Check if users already exist
        existing_users = await conn.fetchval("SELECT COUNT(*) FROM users WHERE email LIKE '%@example.com'")
        if existing_users > 0:
            print(f"⚠️  Found {existing_users} existing sample users. Skipping user creation.")
        else:
            print("📝 Creating sample users...")
            
            # Hash password for all sample users
            hashed_password = await hash_password('password123')
            
            # Insert sample users
            users_data = [
                ('Alice Johnson', 'alice@example.com', 'alice_j', 'https://images.unsplash.com/photo-1494790108755-2616b9e6ff88?w=150&h=150&fit=crop&crop=face', 'Passionate tech reviewer and early adopter', 3, 1250),
                ('Bob Smith', 'bob@example.com', 'bob_smith', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 'Food enthusiast and restaurant critic', 2, 850),
                ('Carol Davis', 'carol@example.com', 'carol_d', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 'Movie buff and entertainment reviewer', 4, 1800),
                ('David Wilson', 'david@example.com', 'david_w', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 'Travel writer and experience reviewer', 2, 650),
                ('Emma Thompson', 'emma@example.com', 'emma_t', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', 'Book reviewer and literary critic', 3, 1100),
                ('Frank Miller', 'frank@example.com', 'frank_m', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', 'Gaming expert and hardware reviewer', 5, 2200),
                ('Grace Lee', 'grace@example.com', 'grace_l', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face', 'Fashion and beauty product reviewer', 2, 750),
                ('Henry Clark', 'henry@example.com', 'henry_c', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop&crop=face', 'Automotive enthusiast and car reviewer', 3, 1350),
                ('Iris Wang', 'iris@example.com', 'iris_w', 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face', 'Health and wellness product reviewer', 4, 1650),
                ('Jack Brown', 'jack@example.com', 'jack_b', 'https://images.unsplash.com/photo-1507038772120-7fff76f79d79?w=150&h=150&fit=crop&crop=face', 'Home improvement and tools reviewer', 2, 550),
                ('Kate Martinez', 'kate@example.com', 'kate_m', 'https://images.unsplash.com/photo-1494790108755-2616b9e6ff88?w=150&h=150&fit=crop&crop=face', 'Sports equipment and fitness reviewer', 3, 1000),
                ('Leo Rodriguez', 'leo@example.com', 'leo_r', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 'Music gear and instrument reviewer', 4, 1450),
                ('Mia Johnson', 'mia@example.com', 'mia_j', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', 'Pet product and animal care reviewer', 2, 800),
                ('Noah Green', 'noah@example.com', 'noah_g', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', 'Outdoor gear and adventure reviewer', 3, 1200),
                ('Olivia Taylor', 'olivia@example.com', 'olivia_t', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face', 'Art supplies and craft reviewer', 4, 1750),
                ('Ryan Brown', 'ryan@example.com', 'ryan_b', 'https://images.unsplash.com/photo-1507038772120-7fff76f79d79?w=150&h=150&fit=crop&crop=face', 'Smart home and tech gadget reviewer', 5, 2100),
            ]
            
            for user_data in users_data:
                name, email, username, avatar, bio, level, points = user_data
                try:
                    await conn.execute("""
                        INSERT INTO users (name, email, username, avatar, bio, level, points, hashed_password) 
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        ON CONFLICT (email) DO NOTHING
                    """, name, email, username, avatar, bio, level, points, hashed_password)
                except Exception as e:
                    print(f"⚠️  Error inserting user {username}: {e}")
            
            print("✅ Sample users created successfully")
        
        # Note: Circle creation removed - system now uses peer-to-peer connections
        print("🔄 Circle system now uses peer-to-peer connections (no central circles needed)")
        
        # Verify the data
        user_count = await conn.fetchval("SELECT COUNT(*) FROM users WHERE email LIKE '%@example.com'")
        request_count = await conn.fetchval("SELECT COUNT(*) FROM social_circle_requests")
        
        print(f"\n📊 Database population summary:")
        print(f"   Users: {user_count}")
        print(f"   Circle Requests: {request_count}")
        
        # List some users with their IDs for reference
        users = await conn.fetch("SELECT user_id, name, username FROM users WHERE email LIKE '%@example.com' ORDER BY user_id LIMIT 10")
        print(f"\n👥 Sample users available for testing:")
        for user in users:
            print(f"   ID {user['user_id']}: {user['name']} (@{user['username']})")
        
        if len(users) > 10:
            remaining = user_count - 10
            print(f"   ... and {remaining} more users")
        
        await conn.close()
        print("\n✅ Database population completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error populating database: {e}")
        return False

async def main():
    """Main function."""
    print("🚀 Starting database population...")
    
    success = await populate_database()
    
    if success:
        print("\n🎉 All done! You can now test the circle functionality with real user data.")
        print("\n💡 Tips for testing:")
        print("   1. Open the ReviewInn frontend")
        print("   2. Navigate to the Circle page")
        print("   3. Go to the Suggestions tab")
        print("   4. Try clicking 'Add to Circle' buttons")
        print("   5. The user IDs should now be valid (13, 14, 15, 16, etc.)")
        sys.exit(0)
    else:
        print("\n💥 Database population failed. Please check the error messages above.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())