# Quick Email Setup for OTP

## Current Status
Your `.env` file has email configuration placeholders. You need to fill in your actual email credentials.

## Step-by-Step Setup (Gmail)

### 1. Get Gmail App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Sign in if needed
3. Select **Mail** as the app
4. Select **Other (Custom name)** as device
5. Type: `Aptiva OTP`
6. Click **Generate**
7. Copy the 16-character password (looks like: `abcd efgh ijkl mnop`)

**Note:** If you don't see "App passwords" option:
- Enable 2-Step Verification first: https://myaccount.google.com/security
- Then come back to App passwords

### 2. Update .env File
Open `backend/.env` and update these lines:

```env
EMAIL_FROM=your-actual-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

**Important:**
- Replace `your-actual-email@gmail.com` with your Gmail address
- Replace `abcdefghijklmnop` with the 16-character App Password (remove all spaces)
- Keep `ENABLE_EMAIL=true`
- Keep `SMTP_SERVER=smtp.gmail.com`
- Keep `SMTP_PORT=587`

### 3. Restart Backend
After saving `.env`, restart your backend server:
- Stop the current backend (Ctrl+C)
- Start it again

### 4. Test
1. Try signing up with a new email
2. Check your inbox for the OTP email
3. If email doesn't arrive, check backend console for errors

## Alternative: Use Setup Script

Run the interactive setup script:
```bash
cd backend
python setup_email.py
```

This will guide you through the setup process.

## Troubleshooting

**Email not sending?**
- Check backend console for error messages
- Verify App Password is correct (no spaces, 16 characters)
- Ensure 2-Step Verification is enabled
- Check that `ENABLE_EMAIL=true` in `.env`

**Still seeing OTP in UI?**
- Email sending failed - check backend console
- Verify all credentials are correct
- Try the setup script for guided configuration

## Other Email Providers

### Outlook/Hotmail
```env
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
EMAIL_FROM=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### Yahoo
```env
SMTP_SERVER=smtp.mail.yahoo.com
SMTP_PORT=587
EMAIL_FROM=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
```
