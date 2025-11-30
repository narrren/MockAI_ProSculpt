# Email OTP Setup Guide

## ✅ Email OTP System Enabled

The email OTP system is now active! Users will receive OTP codes via email for both registration and login.

## 📧 Configuration

### Option 1: Using Environment Variables (Recommended)

Add these to your `backend/.env` file:

```env
# Email Configuration
ENABLE_EMAIL=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Option 2: Gmail Setup

1. **Enable 2-Step Verification** on your Google account
2. **Generate App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password
3. **Update `.env` file**:
   ```env
   EMAIL_FROM=your-email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # Your 16-char app password (no spaces)
   ENABLE_EMAIL=true
   ```

### Option 3: Other Email Providers

**Outlook/Hotmail:**
```env
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
EMAIL_FROM=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

**Yahoo:**
```env
SMTP_SERVER=smtp.mail.yahoo.com
SMTP_PORT=587
EMAIL_FROM=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
```

**Custom SMTP:**
```env
SMTP_SERVER=your-smtp-server.com
SMTP_PORT=587
EMAIL_FROM=your-email@domain.com
EMAIL_PASSWORD=your-password
```

## 🔧 Testing Mode

If email is not configured or `ENABLE_EMAIL=false`, the system will:
- Print OTP to console (backend terminal)
- Still allow authentication to proceed
- Show OTP in backend logs

**To see OTP in console:**
- Check the backend terminal output
- Look for: `[OTP EMAIL] To: user@example.com, OTP: 123456`

## ✅ Verification

1. **Start the backend server**
2. **Try registering a new user**
3. **Check your email inbox** (or console if not configured)
4. **Enter the OTP** to complete registration

## 🔒 Security Notes

- **Never commit `.env` file** to Git (already in `.gitignore`)
- **Use App Passwords** for Gmail (not your regular password)
- **OTP expires in 10 minutes**
- **Maximum 3 failed attempts** before OTP is invalidated

## 🐛 Troubleshooting

### "Email sending disabled or not configured"
- Check that `ENABLE_EMAIL=true` in `.env`
- Verify `EMAIL_FROM` and `EMAIL_PASSWORD` are set
- Check backend console for OTP (it's printed there)

### "Authentication failed" when sending email
- Verify your email credentials are correct
- For Gmail: Use App Password, not regular password
- Check that 2-Step Verification is enabled (Gmail)
- Verify SMTP server and port are correct

### "Connection timeout"
- Check your internet connection
- Verify firewall isn't blocking SMTP port 587
- Try using port 465 with SSL instead

### Email not received
- Check spam/junk folder
- Verify email address is correct
- Check backend console for errors
- OTP is always printed to console as backup

## 📝 Example .env File

```env
# Google Gemini API
GOOGLE_API_KEY=your_gemini_api_key

# Email Configuration
ENABLE_EMAIL=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

## 🎉 Ready to Use!

Once configured, users will receive beautiful HTML emails with their OTP codes for secure authentication!

