# Test Credentials

## Test Account (Bypasses OTP)

For testing purposes, you can use these credentials to login without OTP verification:

- **Email**: `test@aptiva.ai`
- **Password**: `test123`

**Note**: This account bypasses OTP verification and logs in directly. Only you (the developer) should know these credentials.

## Regular Users

All other users must:
1. Sign up with their email and name
2. Receive OTP via email
3. Verify OTP to create account
4. For each login, they receive a new OTP and must verify it

## OTP Information

- OTP is a 6-digit number
- OTP expires in 10 minutes
- Maximum 3 failed attempts before OTP is invalidated
- OTP is printed to console (backend terminal) for testing
- In production, configure SMTP settings in `backend/auth.py`

## Email Configuration

To enable real email sending, update `backend/auth.py`:
```python
EMAIL_FROM = "your-email@gmail.com"
EMAIL_PASSWORD = "your-app-password"  # Use Gmail App Password
```

Then uncomment the email sending code in the `send_otp_email` function.

