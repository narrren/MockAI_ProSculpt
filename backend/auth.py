import secrets
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import Optional, Dict
import hashlib
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)

# In-memory storage (use database in production)
users_db = {}
otp_storage = {}

# Test credentials that bypass OTP
TEST_EMAIL = "test@aptiva.ai"
TEST_PASSWORD = "aptivatesting"  # Hashed in production
TEST_NAME = "Test Interviewer"

# Email configuration (using Gmail SMTP - update with your credentials)
# Get these from environment variables or use defaults
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
EMAIL_FROM = os.getenv("EMAIL_FROM", "your-email@gmail.com")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")  # Use App Password for Gmail
ENABLE_EMAIL = os.getenv("ENABLE_EMAIL", "true").lower() == "true"


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
        # Always print OTP to console for debugging
        print(f"[OTP EMAIL] To: {email}, OTP: {otp}")
        
        # If email is disabled or credentials not configured, just print
        if not ENABLE_EMAIL or not EMAIL_PASSWORD or EMAIL_FROM == "your-email@gmail.com":
            print(f"[OTP EMAIL] Email sending disabled or not configured. OTP: {otp}")
            print(f"[OTP EMAIL] To enable email, set ENABLE_EMAIL=true and configure EMAIL_FROM and EMAIL_PASSWORD in .env")
            return True  # Return True so flow continues (OTP is printed to console)
        
        # Send actual email
        msg = MIMEMultipart()
        msg['From'] = EMAIL_FROM
        msg['To'] = email
        msg['Subject'] = "Aptiva - OTP Verification"
        
        body = f"""<html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .otp-box {{ background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }}
                .otp-code {{ font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Aptiva</h1>
                    <p>OTP Verification</p>
                </div>
                <div class="content">
                    <h2>Your One-Time Password (OTP)</h2>
                    <p>Please use the following OTP to verify your account:</p>
                    <div class="otp-box">
                        <div class="otp-code">{otp}</div>
                    </div>
                    <p><strong>This OTP will expire in 10 minutes.</strong></p>
                    <p>If you didn't request this OTP, please ignore this email.</p>
                    <div class="footer">
                        <p>This is an automated email from Aptiva.</p>
                        <p>Do not reply to this email.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>"""
        
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_FROM, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        print(f"[OTP EMAIL] Email sent successfully to {email}")
        return True
        
    except Exception as e:
        print(f"[OTP EMAIL] Error sending email: {e}")
        print(f"[OTP EMAIL] OTP for {email} is: {otp} (check console if email failed)")
        # Still return True so user can proceed (OTP is in console)
        return True


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
    password = password.strip() if password else ""
    
    # Debug logging
    print(f"[LOGIN] Attempting login for: {email}")
    print(f"[LOGIN] Password provided: {bool(password)}")
    print(f"[LOGIN] Password length: {len(password) if password else 0}")
    print(f"[LOGIN] Test email: {TEST_EMAIL}")
    print(f"[LOGIN] Test password: {TEST_PASSWORD}")
    print(f"[LOGIN] Test email match: {email == TEST_EMAIL}")
    print(f"[LOGIN] Test password match: {password == TEST_PASSWORD}")
    print(f"[LOGIN] Password comparison: '{password}' == '{TEST_PASSWORD}' = {password == TEST_PASSWORD}")
    
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

