# Testing the HeyGen Token Fix

## Prerequisites
1. Ensure you have a valid HeyGen API key in `backend/.env`:
   ```
   HEYGEN_API_KEY=your_actual_api_key_here
   ```

2. Ensure both backend and frontend dependencies are installed:
   ```bash
   # Backend
   cd backend
   pip install -r requirements.txt
   
   # Frontend
   cd ../frontend
   npm install
   ```

## Step-by-Step Testing

### 1. Start the Backend
```bash
cd backend
python main.py
```

**Expected Output:**
```
==================================================
Initializing InterviewerAI...
InterviewerAI initialized with model: gpt-4
==================================================
INFO:     Started server process [...]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 2. Start the Frontend (in a new terminal)
```bash
cd frontend
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

### 3. Test the Avatar

1. **Open browser:** Navigate to `http://localhost:3000`

2. **Login:** Use test credentials:
   - Email: `test@aptiva.ai`
   - Password: `test123`

3. **Start Interview:** Click "Start Interview" or similar button

4. **Wait for Avatar:** The avatar should initialize (takes 10-30 seconds)

5. **Check Console:** Open browser DevTools (F12) and look for:
   ```
   [Avatar] Initialization complete, waiting for video track...
   [Avatar] Avatar ready
   ```

6. **Verify Speech:** The avatar should speak the initial greeting without errors

7. **Check for 401 Errors:** In the console, you should NOT see:
   ❌ `POST https://api.heygen.com/v1/streaming.task 401 (Unauthorized)`
   
   Instead, you should see:
   ✅ `Sending text to avatar: "Hello! Welcome to your technical interview..."`
   ✅ `Text sent to avatar`

### 4. Backend Logs to Monitor

In the backend terminal, you should see:
```
[HEYGEN TOKEN] API key loaded: ... (length: ...)
[HEYGEN TOKEN] Success: Token obtained (length: ...)
[HEYGEN TASK] Text sent to session ...: Hello! Welcome to your technical interview...
```

**No errors like:**
- ❌ `[HEYGEN TASK ERROR] 401`
- ❌ `HeyGen API authentication failed`

## Troubleshooting

### If you still see 401 errors:

1. **Check API Key:**
   ```bash
   cd backend
   cat .env | grep HEYGEN_API_KEY
   ```
   - Ensure the key is valid and not expired
   - Ensure there are no extra spaces or quotes

2. **Verify Backend Endpoint:**
   - Open browser DevTools → Network tab
   - Look for requests to `/api/heygen/task`
   - Should show status 200, not 401

3. **Check HeyGen Account:**
   - Login to HeyGen dashboard
   - Verify API key is active
   - Check if you've hit rate limits or quota

### If avatar doesn't initialize:

1. **Check for concurrent session limit:**
   - Close all browser tabs with the app
   - Wait 30 seconds
   - Refresh and try again

2. **Check backend logs:**
   - Look for `[HEYGEN TOKEN]` messages
   - Verify token is being obtained successfully

### If webcam errors persist:

This is a separate issue - see `CONSOLE_ERRORS_STATUS.md` for details.
- Close other apps using the camera
- Grant browser camera permissions
- The interview will work fine without the camera (proctoring feature only)

## Success Criteria

✅ Avatar initializes without errors
✅ Avatar speaks the initial greeting
✅ No 401 errors in console
✅ Backend logs show successful token generation
✅ Backend logs show successful task sending
✅ Multiple messages work without token expiration

## What Changed

The fix ensures that every time the avatar needs to speak:
1. Backend gets a fresh token from HeyGen API (using the API key)
2. Backend uses that fresh token to send the text
3. Frontend doesn't need to manage tokens at all

This eliminates the token expiration issue completely!

