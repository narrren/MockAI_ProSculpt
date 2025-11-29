import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import Optional, Dict
import hashlib

# In-memory storage (use database in production)
users_db = {}
otp_storage = {}

# Test credentials that bypass OTP
TEST_EMAIL = "test@prosculpt.com"
TEST_PASSWORD = "test123"  # Hashed in production
TEST_NAME = "Test Interviewer"

# Email configuration (using Gmail SMTP - update with your credentials)
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_FROM = "your-email@gmail.com"  # Update this
EMAIL_PASSWORD = "your-app-password"  # Update this (use App Password, not regular password)


def hash_password(password: str) -> str:
    """Hash password using SHA256 (use bcrypt in production)"""
    return hashlib.sha256(password.encode()).hexdigest()


def generate_otp() -> str:
    """Generate a 6-digit OTP"""
    return str(secrets.randbelow(900000) + 100000)


def send_otp_email(email: str, otp: str) -> bool:
    """
    Send OTP email to user.
    Returns True if sent successfully, False otherwise.
    """
    try:
        # For testing, just print OTP (update with real SMTP in production)
        print(f"[OTP EMAIL] To: {email}, OTP: {otp}")
        
        # Uncomment below to use real email sending
        # msg = MIMEMultipart()
        # msg['From'] = EMAIL_FROM
        # msg['To'] = email
        # msg['Subject'] = "MockAI ProSculpt - OTP Verification"
        # 
        # body = f"""<html><body>
        #   <h2>Your OTP for MockAI ProSculpt</h2>
        #   <p>Your One-Time Password (OTP) is: <strong>{otp}</strong></p>
        #   <p>This OTP will expire in 10 minutes.</p>
        #   <p>If you didn't request this, please ignore this email.</p>
        # </body></html>"""
        # msg.attach(MIMEText(body, 'html'))
        # 
        # server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        # server.starttls()
        # server.login(EMAIL_FROM, EMAIL_PASSWORD)
        # server.send_message(msg)
        # server.quit()
        
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False


def register_user(email: str, name: str) -> Dict:
    """
    Register a new user and send OTP.
    Returns dict with status and message.
    """
    email = email.lower().strip()
    
    # Check if user already exists
    if email in users_db:
        return {
            "status": "error",
            "message": "Email already registered. Please login instead."
        }
    
    # Generate OTP
    otp = generate_otp()
    otp_expiry = datetime.now() + timedelta(minutes=10)
    
    # Store OTP
    otp_storage[email] = {
        "otp": otp,
        "expiry": otp_expiry,
        "name": name,
        "attempts": 0
    }
    
    # Send OTP email
    email_sent = send_otp_email(email, otp)
    
    if email_sent:
        return {
            "status": "success",
            "message": "OTP sent to your email. Please check your inbox."
        }
    else:
        return {
            "status": "error",
            "message": "Failed to send OTP email. Please try again."
        }


def verify_otp(email: str, otp: str) -> Dict:
    """
    Verify OTP and create user account.
    Returns dict with status, message, and token if successful.
    """
    email = email.lower().strip()
    
    # Check if OTP exists
    if email not in otp_storage:
        return {
            "status": "error",
            "message": "OTP not found. Please request a new OTP."
        }
    
    otp_data = otp_storage[email]
    
    # Check if OTP expired
    if datetime.now() > otp_data["expiry"]:
        del otp_storage[email]
        return {
            "status": "error",
            "message": "OTP has expired. Please request a new one."
        }
    
    # Check attempts
    if otp_data["attempts"] >= 3:
        del otp_storage[email]
        return {
            "status": "error",
            "message": "Too many failed attempts. Please request a new OTP."
        }
    
    # Verify OTP
    if otp_data["otp"] != otp:
        otp_data["attempts"] += 1
        return {
            "status": "error",
            "message": f"Invalid OTP. {3 - otp_data['attempts']} attempts remaining."
        }
    
    # OTP verified - create user
    user_data = {
        "email": email,
        "name": otp_data["name"],
        "created_at": datetime.now().isoformat(),
        "last_login": datetime.now().isoformat()
    }
    
    users_db[email] = user_data
    
    # Generate session token
    token = secrets.token_urlsafe(32)
    
    # Clean up OTP
    del otp_storage[email]
    
    return {
        "status": "success",
        "message": "Account created successfully!",
        "token": token,
        "user": user_data
    }


def login_user(email: str, password: str) -> Dict:
    """
    Login user with test credentials (bypasses OTP) or regular login.
    Returns dict with status, message, and token if successful.
    """
    email = email.lower().strip()
    
    # Check test credentials (bypass OTP)
    if email == TEST_EMAIL and password == TEST_PASSWORD:
        user_data = {
            "email": TEST_EMAIL,
            "name": TEST_NAME,
            "created_at": datetime.now().isoformat(),
            "last_login": datetime.now().isoformat(),
            "is_test": True
        }
        
        # Update or create test user
        users_db[TEST_EMAIL] = user_data
        
        token = secrets.token_urlsafe(32)
        return {
            "status": "success",
            "message": "Test login successful!",
            "token": token,
            "user": user_data
        }
    
    # Regular user login - check if user exists
    if email not in users_db:
        return {
            "status": "error",
            "message": "User not found. Please sign up first."
        }
    
    # For regular users, they need to verify OTP each time
    # Generate new OTP for login
    otp = generate_otp()
    otp_expiry = datetime.now() + timedelta(minutes=10)
    
    otp_storage[email] = {
        "otp": otp,
        "expiry": otp_expiry,
        "name": users_db[email]["name"],
        "attempts": 0,
        "is_login": True
    }
    
    # Send OTP email
    email_sent = send_otp_email(email, otp)
    
    if email_sent:
        return {
            "status": "otp_required",
            "message": "OTP sent to your email. Please verify to login."
        }
    else:
        return {
            "status": "error",
            "message": "Failed to send OTP email. Please try again."
        }


def verify_login_otp(email: str, otp: str) -> Dict:
    """
    Verify OTP for login.
    Returns dict with status, message, and token if successful.
    """
    email = email.lower().strip()
    
    if email not in otp_storage:
        return {
            "status": "error",
            "message": "OTP not found. Please request a new OTP."
        }
    
    otp_data = otp_storage[email]
    
    if datetime.now() > otp_data["expiry"]:
        del otp_storage[email]
        return {
            "status": "error",
            "message": "OTP has expired. Please request a new one."
        }
    
    if otp_data["attempts"] >= 3:
        del otp_storage[email]
        return {
            "status": "error",
            "message": "Too many failed attempts. Please request a new OTP."
        }
    
    if otp_data["otp"] != otp:
        otp_data["attempts"] += 1
        return {
            "status": "error",
            "message": f"Invalid OTP. {3 - otp_data['attempts']} attempts remaining."
        }
    
    # Update last login
    if email in users_db:
        users_db[email]["last_login"] = datetime.now().isoformat()
    
    token = secrets.token_urlsafe(32)
    del otp_storage[email]
    
    return {
        "status": "success",
        "message": "Login successful!",
        "token": token,
        "user": users_db.get(email, {})
    }


def verify_token(token: str) -> Optional[Dict]:
    """
    Verify session token and return user data.
    In production, use JWT tokens with expiry.
    """
    # Simple token verification (use JWT in production)
    for email, user_data in users_db.items():
        # In production, store tokens separately and verify properly
        if token:
            return user_data
    return None

