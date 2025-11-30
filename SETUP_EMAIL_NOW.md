# 📧 Setup Email OTP - Step by Step

## Current Status
Your `.env` file now has email configuration placeholders. You need to fill in your actual email credentials.

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Gmail App Password

1. **Go to Google Account**: https://myaccount.google.com/
2. **Click "Security"** (left sidebar)
3. **Enable 2-Step Verification** (if not already enabled)
   - Click "2-Step Verification"
   - Follow the setup steps
4. **Generate App Password**:
   - Go back to Security page
   - Click **"App passwords"** (under "Signing in to Google")
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Enter: **MockAI ProSculpt**
   - Click **Generate**
   - **COPY THE 16-CHARACTER PASSWORD** (you'll see it only once!)
     - It looks like: `abcd efgh ijkl mnop`
     - Remove spaces when using it

### Step 2: Update .env File

Open `backend/.env` file and replace these lines:

```env
EMAIL_FROM=your-email@gmail.com          ← Replace with YOUR Gmail address
EMAIL_PASSWORD=your-app-password-here    ← Replace with the 16-char app password (NO SPACES)
```

**Example:**
```env
EMAIL_FROM=john.doe@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

### Step 3: Restart Backend

1. **Stop the backend server** (press `Ctrl+C` in the terminal)
2. **Start it again**:
   ```powershell
   cd backend
   .\venv\Scripts\Activate.ps1
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Step 4: Test

1. Go to the signup page
2. Enter your email and name
3. Click "Send OTP"
4. **Check your email inbox** (and spam folder)
5. You should receive a beautiful HTML email with your OTP!

## ✅ Verification

After setup, when you sign up, you should see:
- ✅ "OTP sent to your email. Please check your inbox."
- ❌ NOT "Email not configured - OTP: 123456"

## 🔍 Troubleshooting

### Still seeing "Email not configured"?
- Check that `ENABLE_EMAIL=true` in `.env`
- Verify `EMAIL_FROM` has your actual email (not "your-email@gmail.com")
- Verify `EMAIL_PASSWORD` has the app password (no spaces, 16 characters)
- Make sure you restarted the backend after updating `.env`

### "Invalid credentials" error?
- You MUST use App Password, not your regular Gmail password
- Remove all spaces from the app password
- Make sure 2-Step Verification is enabled

### Email not received?
- Check spam/junk folder
- Verify email address is correct
- Check backend console for error messages
- OTP is always printed to console as backup

## 📝 Current .env Template

Your `.env` file should look like this:

```env
# Google Gemini API
GOOGLE_API_KEY=your_gemini_api_key_here

# Email Configuration
ENABLE_EMAIL=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=your-email@gmail.com          ← CHANGE THIS
EMAIL_PASSWORD=your-app-password-here     ← CHANGE THIS
```

## 🎉 Once Configured

You'll receive beautiful HTML emails with:
- Professional design
- Large, easy-to-read OTP code
- Clear expiration notice (10 minutes)
- MockAI ProSculpt branding

**Ready to set up? Follow the steps above!**

