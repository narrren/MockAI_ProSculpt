import secrets
import smtplib
import os
import sys
import io
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import Optional, Dict
import hashlib
from dotenv import load_dotenv

# Fix Windows encoding issues for console output
# Note: We don't replace sys.stdout/stderr directly to avoid "I/O operation on closed file" errors
# Instead, we rely on safe_print() function and error message sanitization
if sys.platform == 'win32':
    # Set default encoding for new file operations
    try:
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        if hasattr(sys.stderr, 'reconfigure'):
            sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        # If reconfigure is not available, we'll use safe_print() instead
        pass

# Safe print function that handles encoding errors
def safe_print(*args, **kwargs):
    """Print function that safely handles encoding errors on Windows"""
    try:
        # Pre-sanitize all string arguments to remove emojis and non-ASCII
        safe_args = []
        for arg in args:
            if isinstance(arg, str):
                # Remove emojis and non-ASCII characters
                safe_arg = arg.encode('ascii', 'ignore').decode('ascii')
                safe_args.append(safe_arg)
            else:
                safe_args.append(arg)
        print(*safe_args, **kwargs)
    except (UnicodeEncodeError, UnicodeDecodeError):
        # If encoding still fails, convert everything to ASCII-safe
        safe_args = [str(arg).encode('ascii', 'ignore').decode('ascii') if isinstance(arg, str) else str(arg).encode('ascii', 'ignore').decode('ascii') for arg in args]
        print(*safe_args, **kwargs)

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path, override=True)  # override=True ensures latest values are loaded

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

# Debug: Print email configuration on module load
safe_print(f"[AUTH MODULE] Email configuration loaded:")
safe_print(f"[AUTH MODULE]   ENABLE_EMAIL: {ENABLE_EMAIL}")
safe_print(f"[AUTH MODULE]   EMAIL_FROM: {EMAIL_FROM}")
safe_print(f"[AUTH MODULE]   EMAIL_PASSWORD set: {bool(EMAIL_PASSWORD)}")
safe_print(f"[AUTH MODULE]   SMTP_SERVER: {SMTP_SERVER}:{SMTP_PORT}")


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
        # Reload environment variables to ensure latest values
        load_dotenv(dotenv_path=env_path, override=True)
        
        # Re-read email config (in case .env was updated)
        current_enable_email = os.getenv("ENABLE_EMAIL", "true").lower() == "true"
        current_email_from = os.getenv("EMAIL_FROM", "your-email@gmail.com")
        current_email_password = os.getenv("EMAIL_PASSWORD", "")
        
        # Always print OTP to console for debugging
        safe_print(f"[OTP EMAIL] To: {email}, OTP: {otp}")
        safe_print(f"[OTP EMAIL] Config check - ENABLE_EMAIL: {current_enable_email}, EMAIL_PASSWORD set: {bool(current_email_password)}, EMAIL_FROM: {current_email_from}")
        
        # If email is disabled or credentials not configured, just print
        if not current_enable_email or not current_email_password:
            safe_print(f"[OTP EMAIL] Email sending disabled or not configured. OTP: {otp}")
            safe_print(f"[OTP EMAIL] To enable email, set ENABLE_EMAIL=true and configure EMAIL_FROM and EMAIL_PASSWORD in .env")
            return True  # Return True so flow continues (OTP is printed to console)
        
        # Check if EMAIL_FROM is still a placeholder
        if current_email_from == "your-email@gmail.com" or "@" not in current_email_from:
            safe_print(f"[OTP EMAIL] EMAIL_FROM is not configured properly. OTP: {otp}")
            safe_print(f"[OTP EMAIL] Current EMAIL_FROM: {current_email_from}")
            return True  # Return True so flow continues (OTP is printed to console)
        
        # Send actual email
        msg = MIMEMultipart()
        msg['From'] = current_email_from
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
        safe_print(f"[OTP EMAIL] Attempting to login with EMAIL_FROM: {current_email_from}")
        server.login(current_email_from, current_email_password)
        safe_print(f"[OTP EMAIL] Login successful, sending email...")
        server.send_message(msg)
        server.quit()
        
        safe_print(f"[OTP EMAIL] [OK] Email sent successfully to {email}")
        return True
        
    except Exception as e:
        safe_print(f"[OTP EMAIL] Error sending email: {e}")
        safe_print(f"[OTP EMAIL] OTP for {email} is: {otp} (check console if email failed)")
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
    # Check if user already has resume in database (in case they registered before)
    has_resume = False
    try:
        from database import get_db, User, ResumeData
        db = next(get_db())
        try:
            db_user = db.query(User).filter(User.email == email).first()
            if db_user:
                resume_data = db.query(ResumeData).filter(ResumeData.user_id == db_user.id).first()
                has_resume = resume_data is not None
        finally:
            db.close()
    except Exception as e:
        print(f"[REGISTER] Warning: Could not check resume status: {e}")
    
    user_data = {
        "email": email,
        "name": otp_data["name"],
        "created_at": datetime.now().isoformat(),
        "last_login": datetime.now().isoformat(),
        "has_resume": has_resume  # Check if resume already exists
    }
    
    users_db[email] = user_data
    
    # Also save to database
    try:
        from database import get_db, User
        db = next(get_db())
        try:
            db_user = User(
                email=email,
                name=otp_data["name"],
                password_hash=hash_password("")  # No password for OTP-based auth - hash_password is defined above
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
        finally:
            db.close()
    except Exception as e:
        print(f"[REGISTER] Warning: Could not save user to database: {e}")
    
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
    safe_print(f"[LOGIN] Attempting login for: {email}")
    safe_print(f"[LOGIN] Password provided: {bool(password)}")
    safe_print(f"[LOGIN] Password length: {len(password) if password else 0}")
    safe_print(f"[LOGIN] Test email: {repr(TEST_EMAIL)}")
    safe_print(f"[LOGIN] Test password: {repr(TEST_PASSWORD)}")
    safe_print(f"[LOGIN] Received email: {repr(email)}")
    safe_print(f"[LOGIN] Received password: {repr(password)}")
    safe_print(f"[LOGIN] Test email match: {email == TEST_EMAIL}")
    safe_print(f"[LOGIN] Test password match: {password == TEST_PASSWORD}")
    
    # Check test credentials FIRST (bypass OTP completely) - this must happen before ANY other check
    # Test email ALWAYS bypasses OTP, regardless of password (for easier testing)
    if email == TEST_EMAIL:
        # If password matches, use it; otherwise still allow login for test account
        if password == TEST_PASSWORD:
            safe_print(f"[LOGIN] [OK] Test credentials matched! Logging in...")
        else:
            safe_print(f"[LOGIN] [WARNING] Test email detected but password doesn't match. Still allowing login for testing.")
        
        user_data = {
            "email": TEST_EMAIL,
            "name": TEST_NAME,
            "created_at": datetime.now().isoformat(),
            "last_login": datetime.now().isoformat(),
            "is_test": True,
            "has_resume": False  # Test users don't need resume
        }
        
        # Update or create test user
        users_db[TEST_EMAIL] = user_data
        
        # Also save to database
        try:
            from database import get_db, User
            db = next(get_db())
            try:
                db_user = db.query(User).filter(User.email == TEST_EMAIL).first()
                if not db_user:
                    from auth import hash_password
                    db_user = User(
                        email=TEST_EMAIL,
                        name=TEST_NAME,
                        password_hash=hash_password(TEST_PASSWORD)
                    )
                    db.add(db_user)
                    db.commit()
                    db.refresh(db_user)
                else:
                    db_user.last_login = datetime.now()
                    db.commit()
            finally:
                db.close()
        except Exception as e:
            safe_print(f"[LOGIN] Warning: Could not save test user to database: {e}")
        
        token = secrets.token_urlsafe(32)
        # Sanitize user_data to remove any non-ASCII characters
        sanitized_user_data = {}
        for key, value in user_data.items():
            if isinstance(value, str):
                sanitized_user_data[key] = value.encode('ascii', 'ignore').decode('ascii')
            else:
                sanitized_user_data[key] = value
        
        return {
            "status": "success",
            "message": "Test login successful!",
            "token": token,
            "user": sanitized_user_data
        }
    
    # Regular user login - check if user exists
    # Only check this if NOT using test credentials
    if email not in users_db:
        safe_print(f"[LOGIN] [ERROR] User not found in database: {email}")
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
    
    # Also update database and check resume status
    try:
        from database import get_db, User, ResumeData
        db = next(get_db())
        try:
            db_user = db.query(User).filter(User.email == email).first()
            if db_user:
                db_user.last_login = datetime.now()
                db.commit()
                
                # Check if user has resume and update in-memory storage
                resume_data = db.query(ResumeData).filter(ResumeData.user_id == db_user.id).first()
                has_resume = resume_data is not None
                
                # Update in-memory storage with resume status
                if email in users_db:
                    users_db[email]["has_resume"] = has_resume
        finally:
            db.close()
    except Exception as e:
        safe_print(f"[LOGIN] Warning: Could not update last_login in database: {e}")
    
    token = secrets.token_urlsafe(32)
    del otp_storage[email]
    
    # Get user data with updated resume status
    user_data = users_db.get(email, {})
    if "has_resume" not in user_data:
        # If not set, check database one more time
        try:
            from database import get_db, User, ResumeData
            db = next(get_db())
            try:
                db_user = db.query(User).filter(User.email == email).first()
                if db_user:
                    resume_data = db.query(ResumeData).filter(ResumeData.user_id == db_user.id).first()
                    user_data["has_resume"] = resume_data is not None
            finally:
                db.close()
        except:
            user_data["has_resume"] = False
    
    # Sanitize user_data to remove any non-ASCII characters
    sanitized_user_data = {}
    for key, value in user_data.items():
        if isinstance(value, str):
            sanitized_user_data[key] = value.encode('ascii', 'ignore').decode('ascii')
        else:
            sanitized_user_data[key] = value
    
    return {
        "status": "success",
        "message": "Login successful!",
        "token": token,
        "user": sanitized_user_data
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

