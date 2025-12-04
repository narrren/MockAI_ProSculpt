# Email Setup Guide - OTP Verification

## Quick Setup

The OTP system **always works** - even without email configuration! The OTP is **always printed to the backend console** for easy access during development.

## How It Works

1. **Without Email Configuration (Default)**:
   - OTP is printed to backend console
   - OTP is included in API response
   - No email setup needed for development

2. **With Email Configuration**:
   - OTP is sent via email
   - OTP is also printed to console (for backup)
   - OTP is included in API response if email fails

## Setting Up Email (Optional)

### For Gmail:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Aptiva" as the name
   - Copy the 16-character password

3. **Update `backend/.env`**:
   ```env
   ENABLE_EMAIL=true
   EMAIL_FROM=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   ```

### For Outlook/Hotmail:

```env
ENABLE_EMAIL=true
EMAIL_FROM=your-email@outlook.com
EMAIL_PASSWORD=your-password
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
```

### For Other Providers:

Check your email provider's SMTP settings and update accordingly.

## Important Notes

- **OTP is ALWAYS visible in backend console** - check the terminal where backend is running
- **OTP is ALWAYS included in API response** if email is not configured
- **Email failures don't block the flow** - OTP is always available
- **No email setup required** for development/testing

## Troubleshooting

### Email Not Sending?

1. **Check backend console** - OTP is always printed there
2. **Check `.env` file** - Make sure all variables are set correctly
3. **For Gmail**: Use App Password, not regular password
4. **Check firewall** - SMTP port 587 must be open
5. **Check spam folder** - Emails might be filtered

### Still Having Issues?

- OTP is always available in backend console
- OTP is included in API response
- Email is optional - system works without it

## Example Console Output

```
============================================================
[OTP EMAIL] ===== OTP VERIFICATION CODE =====
[OTP EMAIL] Email: user@example.com
[OTP EMAIL] OTP Code: 123456
[OTP EMAIL] =====================================
============================================================
```

This OTP can be used immediately - no email needed!
