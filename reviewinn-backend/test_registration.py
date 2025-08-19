#!/usr/bin/env python3

import asyncio
import sys
import os

# Add the current directory to the path
sys.path.insert(0, '.')

from database import get_db
from auth.production_auth_system import get_auth_system
from fastapi import Request
from unittest.mock import MagicMock

async def test_registration():
    """Test the registration system in isolation"""
    print("Starting registration test...")
    
    try:
        # Create mock request
        print("Creating mock request...")
        request = MagicMock()
        request.client.host = '127.0.0.1'
        request.headers = {}
        
        # Get database session
        print("Getting database session...")
        db_gen = get_db()
        db = next(db_gen)
        print("✓ Database session created")
        
        # Get auth system
        print("Getting auth system...")
        auth_system = get_auth_system()
        print("✓ Auth system initialized")
        
        # Test registration
        print("Testing registration...")
        result = await auth_system.register_user(
            email='john@gmail.com',
            password='SecurePass123!',
            first_name='John',
            last_name='Doe',
            username=None,
            db=db,
            request=request
        )
        
        print(f"Registration result: {result}")
        print(f"Success: {result.success}")
        if not result.success:
            print(f"Error: {result.error_code} - {result.error_message}")
        else:
            print(f"User ID: {result.user_id}")
            
        db.close()
        return result.success
        
    except Exception as e:
        print(f"Error during registration test: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_registration())
    if success:
        print("✅ Registration test passed!")
        sys.exit(0)
    else:
        print("❌ Registration test failed!")
        sys.exit(1)