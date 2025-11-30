# OTP Troubleshooting Guide

## 🔍 Why Didn't I Receive an OTP Email?

If you signed up but didn't receive an OTP email, here's how to find it:

### Option 1: Check the Frontend (If Email Not Configured)

If email is not configured, the OTP will be displayed **directly on the signup page** after you submit your email. Look for a yellow box with the OTP code.

### Option 2: Check Backend Console

The OTP is **always printed to the backend console** for debugging. 

**To find it:**
1. Open the terminal/PowerShell where the backend server is running
2. Look for a line that says: `[OTP EMAIL] To: your-email@example.com, OTP: 123456`
3. Use that OTP code to verify your account

### Option 3: Configure Email (Recommended)

To receive OTP via email, configure email settings in `backend/.env`:

```env
# Email Configuration
ENABLE_EMAIL=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**For Gmail:**
1. Enable 2-Step Verification on your Google account
2. Generate an App Password:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Copy the 16-character password
3. Add to `.env`:
   ```env
   EMAIL_FROM=your-email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # 16-char app password (no spaces)
   ENABLE_EMAIL=true
   ```
4. Restart the backend server

## 📋 Quick Checklist

- [ ] Check the signup page for OTP (yellow box)
- [ ] Check backend console terminal output
- [ ] Check spam/junk folder (if email is configured)
- [ ] Verify email address is correct
- [ ] Check if email is configured in `.env` file

## 🐛 Common Issues

### "OTP not found" error
- OTP expires after 10 minutes
- Request a new OTP by signing up again
- Check that you're using the correct email address

### "Too many failed attempts"
- Maximum 3 failed OTP attempts
- Request a new OTP by signing up again

### Email not sending
- Check `.env` file has correct email credentials
- For Gmail: Use App Password, not regular password
- Check backend console for error messages
- OTP is always printed to console as backup

## 💡 Pro Tip

**For Development/Testing:**
- The OTP is always printed to the backend console
- You can use the console OTP even if email fails
- The frontend will show the OTP if email is not configured

## 📞 Still Having Issues?

1. **Check backend console** - OTP is always there
2. **Verify email configuration** - See `EMAIL_SETUP.md`
3. **Check spam folder** - Emails might be filtered
4. **Try a different email** - Some providers block automated emails

