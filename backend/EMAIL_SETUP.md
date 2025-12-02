# Email Configuration Guide for Aptiva

This guide will help you configure email sending for OTP verification.

## Quick Setup (Gmail)

### Step 1: Enable 2-Step Verification
1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** in the left sidebar
3. Under "Signing in to Google", enable **2-Step Verification** if not already enabled

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select **Mail** as the app
3. Select **Other (Custom name)** as the device
4. Enter "Aptiva OTP" as the name
5. Click **Generate**
6. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Configure .env File
Create or update `backend/.env` with the following:

```env
# Email Configuration
ENABLE_EMAIL=true
EMAIL_FROM=your-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
```

**Important:**
- Replace `your-email@gmail.com` with your actual Gmail address
- Replace `abcdefghijklmnop` with the 16-character App Password (remove spaces)
- Keep `ENABLE_EMAIL=true` to enable email sending

### Step 4: Restart Backend
After updating `.env`, restart your backend server for changes to take effect.

## Alternative Email Providers

### Outlook/Hotmail
```env
ENABLE_EMAIL=true
EMAIL_FROM=your-email@outlook.com
EMAIL_PASSWORD=your-app-password
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
```

### Yahoo Mail
```env
ENABLE_EMAIL=true
EMAIL_FROM=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
SMTP_SERVER=smtp.mail.yahoo.com
SMTP_PORT=587
```

### Custom SMTP Server
```env
ENABLE_EMAIL=true
EMAIL_FROM=your-email@yourdomain.com
EMAIL_PASSWORD=your-password
SMTP_SERVER=smtp.yourdomain.com
SMTP_PORT=587
```

## Testing

After configuration:
1. Try signing up with a new email
2. Check your inbox for the OTP email
3. Check backend console for any error messages

## Troubleshooting

### Email not sending?
1. Check backend console for error messages
2. Verify App Password is correct (no spaces)
3. Ensure 2-Step Verification is enabled (for Gmail)
4. Check that `ENABLE_EMAIL=true` in `.env`
5. Verify SMTP server and port are correct

### Still seeing OTP in UI?
- This means email sending failed
- Check backend console logs for specific error
- Verify all credentials in `.env` are correct

## Security Notes

- Never commit `.env` file to Git
- Use App Passwords, not your main account password
- App Passwords can be revoked anytime from Google Account settings

