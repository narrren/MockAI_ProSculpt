# HeyGen Token Authentication Fix

## Problem
The application was experiencing a 401 Unauthorized error when sending text to the HeyGen avatar:

```
InterviewerAvatar.js:682  POST https://api.heygen.com/v1/streaming.task 401 (Unauthorized)
Error: HeyGen API authentication failed (401). The session token may have expired.
```

## Root Cause
The frontend was calling the HeyGen API directly using a session token that was obtained once during initialization. HeyGen session tokens have a short expiration time, and when the token expired, subsequent requests to send text to the avatar would fail with a 401 error.

## Solution
Created a new backend proxy endpoint `/api/heygen/task` that:
1. Gets a fresh session token for each request using the HeyGen API key
2. Uses that fresh token to send the text to the avatar
3. Handles authentication errors properly

This approach ensures that:
- The API key (which doesn't expire) is stored securely on the backend
- Each text-to-avatar request uses a fresh, valid token
- The frontend doesn't need to manage token refresh logic

## Changes Made

### Backend (`backend/main.py`)
Added a new endpoint after the `/api/heygen/stop` endpoint:

```python
class HeyGenTaskRequest(BaseModel):
    session_id: str
    text: str
    task_type: str = "repeat"


@app.post("/api/heygen/task")
async def send_heygen_task(data: HeyGenTaskRequest):
    """Send text to HeyGen avatar to speak (proxied to use fresh token server-side)"""
    # Gets fresh token from HeyGen API
    # Sends task with fresh token
    # Returns success/error response
```

### Frontend (`frontend/src/components/InterviewerAvatar.js`)
Modified the `sendTextToAvatar` function to use the backend proxy instead of calling HeyGen API directly:

**Before:**
```javascript
const response = await fetch(`${HEYGEN_CONFIG.serverUrl}/v1/streaming.task`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${sessionTokenRef.current}`,  // Expired token!
  },
  body: JSON.stringify({
    session_id: sessionInfoRef.current.session_id,
    text: text,
    task_type: "repeat"
  }),
});
```

**After:**
```javascript
const response = await fetch(`${apiUrl || 'http://localhost:8000'}/api/heygen/task`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    session_id: sessionInfoRef.current.session_id,
    text: text,
    task_type: "repeat"
  }),
});
```

## Testing
After applying this fix:
1. Start the backend: `cd backend && python main.py`
2. Start the frontend: `cd frontend && npm start`
3. Login and start an interview
4. The avatar should now speak without 401 errors
5. Multiple messages should work without token expiration issues

## Benefits
- ✅ Eliminates token expiration errors
- ✅ Centralizes authentication logic on the backend
- ✅ Keeps API key secure (never exposed to frontend)
- ✅ Consistent with other HeyGen endpoints (`/start`, `/stop`, etc.)
- ✅ Automatic token refresh for every request

## Related Files
- `backend/main.py` - Added `/api/heygen/task` endpoint
- `frontend/src/components/InterviewerAvatar.js` - Updated `sendTextToAvatar()` function

