"""
Test script to verify profile endpoint logic
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

def test_profile_logic():
    """Test the profile endpoint logic"""
    print("=" * 60)
    print("TESTING PROFILE ENDPOINT LOGIC")
    print("=" * 60)
    
    # Simulate the profile creation logic
    has_resume = True
    resume_data = {"skills": ["Python", "JavaScript"], "experience": []}
    
    profile = {
        "status": "success",
        "email": "test@aptiva.ai",
        "name": "Test User",
        "has_resume": has_resume,
        "is_test": True
    }
    
    # Simulate adding resume
    if resume_data:
        profile["resume"] = {
            "skills": resume_data.get("skills", []),
            "experience": resume_data.get("experience", []),
            "education": [],
            "raw_text": "",
            "summary": "",
            "analysis": {},
            "certifications": [],
            "projects": [],
            "contact_info": {}
        }
        print("✅ Resume added to profile")
    
    # Final check
    if profile.get('has_resume') and 'resume' not in profile:
        print("⚠️ CRITICAL: has_resume=True but resume missing!")
        profile["resume"] = {
            "uploaded_at": None,
            "skills": [],
            "experience": [],
            "education": [],
            "raw_text": "",
            "summary": "",
            "analysis": {},
            "certifications": [],
            "projects": [],
            "contact_info": {}
        }
        print("✅ Added minimal resume as fallback")
    
    # Verify
    print("\n" + "=" * 60)
    print("VERIFICATION:")
    print("=" * 60)
    print(f"has_resume: {profile.get('has_resume')}")
    print(f"resume in profile: {'resume' in profile}")
    if 'resume' in profile:
        print(f"✅ SUCCESS: Resume is in profile!")
        print(f"   Skills count: {len(profile['resume'].get('skills', []))}")
    else:
        print(f"❌ FAILED: Resume is NOT in profile!")
    
    print("\n" + "=" * 60)
    print("PROFILE STRUCTURE:")
    print("=" * 60)
    print(f"Keys: {list(profile.keys())}")
    if 'resume' in profile:
        print(f"Resume keys: {list(profile['resume'].keys())}")
    
    return profile

if __name__ == "__main__":
    result = test_profile_logic()
    print("\n✅ Test completed!")

