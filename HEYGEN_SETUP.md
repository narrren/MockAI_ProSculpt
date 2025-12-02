# HeyGen Avatar Setup Guide

## Overview
The avatar now uses HeyGen's professional video streaming service for realistic, human-like avatars with automatic lip-sync and natural expressions.

## Setup Steps

### 1. Get HeyGen API Key
1. Go to [HeyGen.com](https://www.heygen.com/)
2. Sign up for an account
3. Navigate to API settings
4. Generate an API key
5. Copy the API key

### 2. Add API Key to Backend
Add the following line to `backend/.env`:
```
HEYGEN_API_KEY=your_api_key_here
```

### 3. Install Dependencies
Make sure `httpx` is installed in your backend environment:
```bash
cd backend
pip install httpx>=0.24.0
```

Or install all requirements:
```bash
pip install -r requirements.txt
```

### 4. Restart Backend
Restart your backend server for changes to take effect:
```bash
# Windows PowerShell
.\venv\Scripts\Activate.ps1
python main.py

# Or use the start script
.\start_backend.bat
```

## Features

### Professional Avatar
- **Avatar ID**: `SilasHR_public` (professional business avatar)
- **Quality**: High-definition video streaming
- **Encoding**: H264 for optimal performance

### Real-Time Features
- ✅ Automatic lip-sync with speech
- ✅ Natural blinking and expressions
- ✅ Real-time video streaming
- ✅ WebSocket connection for updates
- ✅ High-quality video output

### How It Works
1. Component loads LiveKit client dynamically
2. Gets session token from backend
3. Creates HeyGen streaming session
4. Connects to LiveKit room for video stream
5. Sends text to avatar for automatic lip-sync
6. Displays video in React component

## Troubleshooting

### Avatar Not Loading
- Check that `HEYGEN_API_KEY` is set in `backend/.env`
- Verify backend is running and accessible
- Check browser console for errors
- Ensure LiveKit client loads (check Network tab)

### No Video Stream
- Check WebSocket connection status
- Verify HeyGen API key is valid
- Check backend logs for errors
- Ensure microphone permissions are granted

### API Key Errors
- Verify API key is correct in `.env` file
- Check that backend restarted after adding key
- Ensure no extra spaces in `.env` file
- Test API key directly with HeyGen API

## Avatar Configuration

You can change the avatar by modifying `HEYGEN_CONFIG.avatarId` in `frontend/src/components/InterviewerAvatar.js`:

```javascript
const HEYGEN_CONFIG = {
  serverUrl: "https://api.heygen.com",
  avatarId: "SilasHR_public", // Change this to your preferred avatar
  voiceId: "" // Optional: specify voice ID
};
```

## Notes
- The avatar uses HeyGen's professional video streaming
- Lip-sync is automatic when text is sent
- Video quality is optimized for web streaming
- The component handles cleanup automatically on unmount

