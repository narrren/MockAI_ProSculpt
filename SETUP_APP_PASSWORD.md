# App Password Setup for testaptiva.ai@gmail.com

## Problem
Google App Passwords are only available for accounts with **2-Step Verification** enabled.

## Solution: Enable 2-Step Verification

### Step 1: Enable 2-Step Verification
1. Go to: https://myaccount.google.com/security
2. Sign in with: **testaptiva.ai@gmail.com**
3. Scroll to **"2-Step Verification"** section
4. Click **"Get started"** or **"Turn on"**
5. Follow the setup:
   - Add your phone number
   - Verify with code sent to your phone
   - Confirm to enable

### Step 2: Generate App Password
1. After 2-Step is enabled, go to: https://myaccount.google.com/apppasswords
2. Sign in with: **testaptiva.ai@gmail.com**
3. Select:
   - **App**: Mail
   - **Device**: Other (Custom name)
   - **Name**: "Aptiva Backend"
4. Click **"Generate"**
5. Copy the **16-character password** (looks like: `abcd efgh ijkl mnop`)

### Step 3: Update Backend
1. Open `backend/.env`
2. Update:
   ```
   EMAIL_FROM=testaptiva.ai@gmail.com
   EMAIL_PASSWORD=your_new_16_char_app_password
   ```
   (Remove spaces from the app password)

### Step 4: Restart Backend
Restart your backend server for changes to take effect.

---

## Alternative: Use Existing App Password

If you want to use the existing app password (`enpzjntulfgnwaqj`), you can send emails **FROM** `naren.dey2005@gmail.com` instead:

1. Update `backend/.env`:
   ```
   EMAIL_FROM=naren.dey2005@gmail.com
   EMAIL_PASSWORD=enpzjntulfgnwaqj
   ```

2. Restart backend

**Note**: Emails will come FROM `naren.dey2005@gmail.com`, not `testaptiva.ai@gmail.com`.

---

## Quick Links
- Security Settings: https://myaccount.google.com/security
- App Passwords: https://myaccount.google.com/apppasswords

