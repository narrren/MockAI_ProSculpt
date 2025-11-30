# Quick Email Setup Guide

## 🚀 Quick Setup (Gmail)

### Step 1: Enable 2-Step Verification
1. Go to [Google Account](https://myaccount.google.com/)
2. Click **Security** (left sidebar)
3. Under "Signing in to Google", click **2-Step Verification**
4. Follow the steps to enable it

### Step 2: Generate App Password
1. Still in **Security** settings
2. Under "Signing in to Google", click **App passwords**
   - If you don't see this, make sure 2-Step Verification is enabled first
3. Select app: **Mail**
4. Select device: **Other (Custom name)**
5. Enter name: **Aptiva**
6. Click **Generate**
7. **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)
   - ⚠️ You can only see this once! Copy it now!

### Step 3: Update .env File
Open `backend/.env` and add/update these lines:

```env
# Email Configuration
ENABLE_EMAIL=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=your-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

**Important:**
- Replace `your-email@gmail.com` with your actual Gmail address
- Replace `abcdefghijklmnop` with the 16-character app password (remove spaces)
- Make sure there are NO spaces in the app password

### Step 4: Restart Backend
After updating `.env`, restart your backend server:
1. Stop the current backend (Ctrl+C)
2. Start it again: `uvicorn main:app --reload`

### Step 5: Test
1. Try signing up with your email
2. Check your inbox for the OTP email
3. Check spam folder if not in inbox

## ✅ Example .env File

```env
# Google Gemini API
GOOGLE_API_KEY=your_gemini_api_key_here

# Email Configuration
ENABLE_EMAIL=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=yourname@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

## 🔍 Troubleshooting

### "Invalid credentials" error
- Make sure you're using the **App Password**, not your regular Gmail password
- Remove all spaces from the app password
- Verify 2-Step Verification is enabled

### "Connection refused" error
- Check your internet connection
- Verify firewall isn't blocking port 587
- Try port 465 with SSL (change SMTP_PORT to 465)

### Email still not received
- Check spam/junk folder
- Verify email address is correct
- Check backend console for error messages
- OTP is always printed to console as backup

## 📧 Other Email Providers

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

