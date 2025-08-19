#!/usr/bin/env python3
"""
Debug script to test the verification system
"""
import asyncio
import sys
import os
from datetime import datetime, timezone

# Add the backend directory to the path
sys.path.insert(0, '/home/hasan181/personal/my_project/reviewinn_project/reviewinn-backend')

from database import get_db, SessionLocal
from services.verification_service import verification_service
from models.user import User

async def test_verification():
    """Test the verification system with debug info"""
    db = SessionLocal()
    
    try:
        # Test email
        test_email = "mahamudulhasan42@gmail.com"
        
        print(f"Testing verification for: {test_email}")
        
        # Check user exists
        user = db.query(User).filter(User.email == test_email).first()
        if not user:
            print("ERROR: User not found!")
            return
            
        print(f"User found: ID={user.user_id}, verified={user.is_verified}")
        
        # Send verification code
        print("\n1. Sending verification code...")
        response = await verification_service.send_email_verification_code(test_email, db)
        print(f"Response: {response.message}")
        
        # Check the codes storage to see what code was generated
        key = verification_service.get_code_key(test_email, "email_verification")
        if key in verification_service.codes_storage:
            code_data = verification_service.codes_storage[key]
            print(f"Generated code: {code_data.code}")
            print(f"Code expires at: {code_data.expires_at}")
            print(f"Current attempts: {code_data.attempts}")
            
            # Test with correct code
            print(f"\n2. Testing with correct code: {code_data.code}")
            try:
                success = await verification_service.verify_email_code(test_email, code_data.code, db)
                print(f"Verification result: {success}")
                
                # Check user status after verification
                db.refresh(user)
                print(f"User after verification: verified={user.is_verified}, verified_at={user.email_verified_at}")
                
            except Exception as e:
                print(f"Verification error: {e}")
                
        else:
            print("ERROR: No code found in storage!")
            
        # Also test with the hardcoded code 123456
        print(f"\n3. Testing with code '123456'...")
        try:
            success = await verification_service.verify_email_code(test_email, "123456", db)
            print(f"Verification with 123456 result: {success}")
        except Exception as e:
            print(f"Verification with 123456 error: {e}")
            
    except Exception as e:
        print(f"Test error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_verification())