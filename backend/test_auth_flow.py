"""
Test script to verify authentication and resume upload flow
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_auth_flow():
    print("=" * 60)
    print("TESTING AUTHENTICATION FLOW")
    print("=" * 60)
    
    # Step 1: Register user
    print("\n[1] Registering user...")
    register_data = {
        "email": "test_auth@example.com",
        "name": "Test User"
    }
    register_response = requests.post(f"{BASE_URL}/register", json=register_data)
    print(f"Status: {register_response.status_code}")
    print(f"Response: {register_response.json()}")
    
    if register_response.status_code != 200:
        print("[ERROR] Registration failed!")
        return
    
    register_result = register_response.json()
    otp = register_result.get("otp", "")
    print(f"[OK] Registration successful. OTP: {otp}")
    
    # Step 2: Verify OTP
    print("\n[2] Verifying OTP...")
    verify_data = {
        "email": "test_auth@example.com",
        "otp": otp
    }
    verify_response = requests.post(f"{BASE_URL}/verify-otp", json=verify_data)
    print(f"Status: {verify_response.status_code}")
    print(f"Response: {verify_response.json()}")
    
    if verify_response.status_code != 200:
        print("[ERROR] OTP verification failed!")
        return
    
    verify_result = verify_response.json()
    token = verify_result.get("token", "")
    print(f"[OK] OTP verified. Token: {token[:30]}...")
    
    if not token:
        print("[ERROR] No token received!")
        return
    
    # Step 3: Test resume upload (with dummy PDF)
    print("\n[3] Testing resume upload...")
    
    # Create a dummy PDF file
    dummy_pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 0\ntrailer\n<< /Size 0 /Root 1 0 R >>\nstartxref\n0\n%%EOF"
    
    files = {
        'file': ('test_resume.pdf', dummy_pdf_content, 'application/pdf')
    }
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    upload_response = requests.post(
        f"{BASE_URL}/resume/upload",
        files=files,
        headers=headers
    )
    
    print(f"Status: {upload_response.status_code}")
    try:
        print(f"Response: {upload_response.json()}")
    except:
        print(f"Response: {upload_response.text}")
    
    if upload_response.status_code == 200:
        print("[OK] Resume upload successful!")
    else:
        print(f"[ERROR] Resume upload failed! Status: {upload_response.status_code}")
        print(f"Error: {upload_response.text}")
    
    # Step 4: Test resume status
    print("\n[4] Testing resume status...")
    status_response = requests.get(
        f"{BASE_URL}/user/resume-status",
        headers=headers
    )
    print(f"Status: {status_response.status_code}")
    try:
        print(f"Response: {status_response.json()}")
    except:
        print(f"Response: {status_response.text}")
    
    if status_response.status_code == 200:
        print("[OK] Resume status check successful!")
    else:
        print(f"[ERROR] Resume status check failed!")
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    try:
        test_auth_flow()
    except Exception as e:
        print(f"[ERROR] Test failed with error: {e}")
        import traceback
        traceback.print_exc()

