import secrets
import smtplib
import os
import sys
import io
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
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
token_storage = {}  # Map token -> email for authentication

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


def validate_email_config() -> Dict[str, Any]:
    """
    Validate email configuration and test connection.
    Returns dict with 'valid' (bool) and 'message' (str).
    """
    try:
        # Reload environment variables
        load_dotenv(dotenv_path=env_path, override=True)
        
        current_enable_email = os.getenv("ENABLE_EMAIL", "true").lower() == "true"
        current_email_from = os.getenv("EMAIL_FROM", "your-email@gmail.com")
        current_email_password = os.getenv("EMAIL_PASSWORD", "")
        current_smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        current_smtp_port = int(os.getenv("SMTP_PORT", "587"))
        
        # Check if email is configured
        if not current_enable_email:
            return {
                "valid": False,
                "message": "Email is disabled (ENABLE_EMAIL=false)"
            }
        
        if not current_email_password:
            return {
                "valid": False,
                "message": "EMAIL_PASSWORD is not set"
            }
        
        if not current_email_from or current_email_from == "your-email@gmail.com" or "@" not in current_email_from:
            return {
                "valid": False,
                "message": f"EMAIL_FROM is not configured properly: {current_email_from}"
            }
        
        # Test SMTP connection
        try:
            safe_print(f"[EMAIL VALIDATION] Testing connection to {current_smtp_server}:{current_smtp_port}...")
            server = smtplib.SMTP(current_smtp_server, current_smtp_port, timeout=10)
            server.starttls()
            safe_print(f"[EMAIL VALIDATION] Testing authentication...")
            server.login(current_email_from, current_email_password)
            server.quit()
            
            safe_print(f"[EMAIL VALIDATION] [SUCCESS] Email configuration is valid!")
            return {
                "valid": True,
                "message": "Email configuration is valid and connection test successful"
            }
            
        except smtplib.SMTPAuthenticationError as auth_error:
            return {
                "valid": False,
                "message": f"Authentication failed: {auth_error}. Check EMAIL_PASSWORD (use App Password for Gmail)"
            }
        except Exception as conn_error:
            return {
                "valid": False,
                "message": f"Connection test failed: {conn_error}"
            }
            
    except Exception as e:
        return {
            "valid": False,
            "message": f"Validation error: {e}"
        }


def send_otp_email(email: str, otp: str) -> Dict[str, Any]:
    """
    Send OTP email to user.
    Returns dict with 'success' (bool) and 'message' (str).
    Always prints OTP to console for debugging.
    """
    # ALWAYS print OTP to console - this is the primary way to get OTP during development
    safe_print("=" * 60)
    safe_print(f"[OTP EMAIL] ===== OTP VERIFICATION CODE =====")
    safe_print(f"[OTP EMAIL] Email: {email}")
    safe_print(f"[OTP EMAIL] OTP Code: {otp}")
    safe_print(f"[OTP EMAIL] =====================================")
    safe_print("=" * 60)
    
    try:
        # Reload environment variables to ensure latest values
        load_dotenv(dotenv_path=env_path, override=True)
        
        # Re-read email config (in case .env was updated)
        current_enable_email = os.getenv("ENABLE_EMAIL", "true").lower() == "true"
        current_email_from = os.getenv("EMAIL_FROM", "your-email@gmail.com")
        current_email_password = os.getenv("EMAIL_PASSWORD", "")
        current_smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        current_smtp_port = int(os.getenv("SMTP_PORT", "587"))
        
        safe_print(f"[OTP EMAIL] Config - ENABLE_EMAIL: {current_enable_email}")
        safe_print(f"[OTP EMAIL] Config - EMAIL_FROM: {current_email_from}")
        safe_print(f"[OTP EMAIL] Config - EMAIL_PASSWORD set: {bool(current_email_password)}")
        safe_print(f"[OTP EMAIL] Config - SMTP_SERVER: {current_smtp_server}:{current_smtp_port}")
        
        # Check if email is properly configured
        email_configured = (
            current_enable_email and 
            current_email_password and 
            current_email_from and 
            current_email_from != "your-email@gmail.com" and 
            "@" in current_email_from
        )
        
        if not email_configured:
            safe_print(f"[OTP EMAIL] Email not configured - OTP is shown above in console")
            safe_print(f"[OTP EMAIL] To enable email sending, configure in backend/.env:")
            safe_print(f"[OTP EMAIL]   ENABLE_EMAIL=true")
            safe_print(f"[OTP EMAIL]   EMAIL_FROM=your-email@gmail.com")
            safe_print(f"[OTP EMAIL]   EMAIL_PASSWORD=your-app-password")
            safe_print(f"[OTP EMAIL]   SMTP_SERVER=smtp.gmail.com (or your provider)")
            safe_print(f"[OTP EMAIL]   SMTP_PORT=587")
            return {
                "success": True,  # Return True so flow continues
                "message": f"OTP sent to console (email not configured). OTP: {otp}",
                "otp": otp  # Include OTP in response
            }
        
        # Try to send actual email with retry logic
        max_retries = 3
        retry_delay = 2  # seconds
        
        for attempt in range(1, max_retries + 1):
            try:
                # Create email message
                msg = MIMEMultipart()
                msg['From'] = current_email_from
                msg['To'] = email
                msg['Subject'] = "Aptiva - OTP Verification Code"
                
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
                
                # Attempt to send email with retry
                safe_print(f"[OTP EMAIL] Attempt {attempt}/{max_retries}: Connecting to {current_smtp_server}:{current_smtp_port}...")
                
                server = None
                try:
                    # Create SMTP connection with longer timeout
                    server = smtplib.SMTP(current_smtp_server, current_smtp_port, timeout=30)
                    server.set_debuglevel(0)
                    
                    safe_print(f"[OTP EMAIL] Starting TLS...")
                    server.starttls()
                    
                    safe_print(f"[OTP EMAIL] Authenticating with {current_email_from}...")
                    server.login(current_email_from, current_email_password)
                    
                    safe_print(f"[OTP EMAIL] Sending email to {email}...")
                    server.send_message(msg)
                    
                    safe_print(f"[OTP EMAIL] [SUCCESS] Email sent successfully to {email} on attempt {attempt}")
                    
                    # Success! Return immediately
                    return {
                        "success": True,
                        "message": "OTP sent to your email. Please check your inbox.",
                        "otp": otp  # Still include OTP as backup
                    }
                    
                except smtplib.SMTPAuthenticationError as auth_error:
                    # Authentication errors won't be fixed by retrying
                    safe_print(f"[OTP EMAIL] [ERROR] Authentication failed: {auth_error}")
                    safe_print(f"[OTP EMAIL] [ERROR] Check your EMAIL_PASSWORD (use App Password for Gmail)")
                    safe_print(f"[OTP EMAIL] [ERROR] Verify EMAIL_FROM matches the account")
                    # Don't retry authentication errors
                    raise
                    
                except (smtplib.SMTPException, ConnectionError, TimeoutError, OSError) as smtp_error:
                    # Network/connection errors - retry these
                    error_msg = str(smtp_error)
                    safe_print(f"[OTP EMAIL] [ERROR] Attempt {attempt} failed: {error_msg}")
                    
                    if attempt < max_retries:
                        wait_time = retry_delay * attempt  # Exponential backoff
                        safe_print(f"[OTP EMAIL] Retrying in {wait_time} seconds...")
                        time.sleep(wait_time)
                        continue  # Try again
                    else:
                        # All retries exhausted
                        safe_print(f"[OTP EMAIL] [ERROR] All {max_retries} attempts failed")
                        raise
                        
                except Exception as email_error:
                    # Unexpected errors
                    error_msg = str(email_error)
                    safe_print(f"[OTP EMAIL] [ERROR] Unexpected error on attempt {attempt}: {error_msg}")
                    
                    if attempt < max_retries:
                        wait_time = retry_delay * attempt
                        safe_print(f"[OTP EMAIL] Retrying in {wait_time} seconds...")
                        time.sleep(wait_time)
                        continue
                    else:
                        safe_print(f"[OTP EMAIL] [ERROR] All {max_retries} attempts failed")
                        raise
                        
                finally:
                    # Always close the connection
                    if server:
                        try:
                            server.quit()
                        except:
                            pass
                            
            except smtplib.SMTPAuthenticationError as auth_error:
                # Authentication failed - don't retry, but still return success with OTP
                safe_print(f"[OTP EMAIL] [FATAL] Authentication failed - cannot send email")
                safe_print(f"[OTP EMAIL] [FATAL] Please check your email credentials in .env")
                safe_print(f"[OTP EMAIL] [FATAL] OTP is shown above in console: {otp}")
                return {
                    "success": True,  # Return True so flow continues
                    "message": f"Email authentication failed. Please check email configuration. OTP: {otp} (check console)",
                    "otp": otp
                }
                
            except Exception as final_error:
                # All retries exhausted or other fatal error
                if attempt >= max_retries:
                    safe_print(f"[OTP EMAIL] [FATAL] Failed to send email after {max_retries} attempts")
                    safe_print(f"[OTP EMAIL] [FATAL] Last error: {final_error}")
                    safe_print(f"[OTP EMAIL] [FATAL] OTP is shown above in console: {otp}")
                    return {
                        "success": True,  # Return True so flow continues
                        "message": f"Email sending failed after {max_retries} attempts. OTP: {otp} (check console)",
                        "otp": otp
                    }
        
    except Exception as e:
        safe_print(f"[OTP EMAIL] [CRITICAL ERROR] {e}")
        safe_print(f"[OTP EMAIL] OTP is shown above in console: {otp}")
        return {
            "success": True,  # Return True so flow continues
            "message": f"Error. OTP: {otp} (check console)",
            "otp": otp
        }


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
    
    # Send OTP email (always returns success with OTP in console/response)
    email_result = send_otp_email(email, otp)
    
    # Always return success - OTP is always available in console
    # Use "otp_sent" status for consistency with frontend expectations
    result = {
        "status": "otp_sent",  # Changed from "success" to "otp_sent" for frontend compatibility
        "message": email_result.get("message", "OTP sent. Please check your email or console.")
    }
    
    # ALWAYS include OTP in response (for backup if email fails or is delayed)
    # This ensures user can always proceed even if email doesn't arrive
    result["otp"] = otp
    
    # Update message if email not configured
    if "not configured" in email_result.get("message", "").lower():
        result["message"] = f"OTP: {otp} (Email not configured - check backend console for OTP)"
    
    return result


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
    token_storage[token] = email  # Store token -> email mapping
    
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
        token_storage[token] = email  # Store token -> email mapping
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
    
    # Regular user login - check if user exists in database first
    # Only check this if NOT using test credentials
    db_user = None
    try:
        from database import get_db, User, ResumeData
        db = next(get_db())
        try:
            db_user = db.query(User).filter(User.email == email).first()
            if db_user:
                # User exists in database, load into memory
                resume_data = db.query(ResumeData).filter(ResumeData.user_id == db_user.id).first()
                has_resume = resume_data is not None
                
                users_db[email] = {
                    "email": db_user.email,
                    "name": db_user.name,
                    "created_at": db_user.created_at.isoformat() if db_user.created_at else None,
                    "last_login": db_user.last_login.isoformat() if db_user.last_login else None,
                    "has_resume": has_resume
                }
            else:
                # User not in database
                if email not in users_db:
                    safe_print(f"[LOGIN] [ERROR] User not found in database: {email}")
                    return {
                        "status": "error",
                        "message": "User not found. Please sign up first."
                    }
        finally:
            db.close()
    except Exception as e:
        safe_print(f"[LOGIN] Warning: Could not check database: {e}")
        # Fallback to in-memory check
        if email not in users_db:
            safe_print(f"[LOGIN] [ERROR] User not found: {email}")
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
    
    # Send OTP email (always returns success with OTP in console/response)
    email_result = send_otp_email(email, otp)
    
    # Always return success - OTP is always available in console
    result = {
        "status": "otp_required",  # Keep "otp_required" for login flow
        "message": email_result.get("message", "OTP sent. Please check your email or console.")
    }
    
    # ALWAYS include OTP in response (for backup if email fails or is delayed)
    # This ensures user can always proceed even if email doesn't arrive
    result["otp"] = otp
    
    # Update message if email not configured
    if "not configured" in email_result.get("message", "").lower():
        result["message"] = f"OTP: {otp} (Email not configured - check backend console for OTP)"
    
    return result


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
    token_storage[token] = email  # Store token -> email mapping
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
    if not token:
        return None
    
    # Get email from token storage
    email = token_storage.get(token)
    if not email:
        return None
    
    # Get user data from in-memory storage
    if email in users_db:
        return users_db[email]
    
    # If not in memory, try to load from database
    try:
        from database import get_db, User, ResumeData
        db = next(get_db())
        try:
            db_user = db.query(User).filter(User.email == email).first()
            if db_user:
                # Check for resume
                resume_data = db.query(ResumeData).filter(ResumeData.user_id == db_user.id).first()
                has_resume = resume_data is not None
                
                # Create user data dict
                user_data = {
                    "email": db_user.email,
                    "name": db_user.name,
                    "created_at": db_user.created_at.isoformat() if db_user.created_at else None,
                    "last_login": db_user.last_login.isoformat() if db_user.last_login else None,
                    "has_resume": has_resume
                }
                
                # Store in memory for future use
                users_db[email] = user_data
                return user_data
        finally:
            db.close()
    except Exception as e:
        safe_print(f"[VERIFY_TOKEN] Error loading user from database: {e}")
    
    return None


def get_user_from_token(token: str) -> Optional[str]:
    """
    Get user email from token.
    Returns email if token is valid, None otherwise.
    """
    if not token:
        return None
    return token_storage.get(token)

