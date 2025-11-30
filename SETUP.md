# Quick Setup Guide

## Prerequisites Checklist

- [ ] Python 3.10+ installed
- [ ] Node.js 16+ and npm installed
- [ ] Google Gemini API Key ([Get it here](https://makersuite.google.com/app/apikey))
- [ ] Webcam available

## Installation Steps

### 1. Get Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Configure API Key

Create a `.env` file in the `backend` directory:
```bash
# Windows
echo GOOGLE_API_KEY=your_api_key_here > .env

# Linux/Mac
echo "GOOGLE_API_KEY=your_api_key_here" > .env
```

Or set as environment variable:
- **Windows PowerShell**: `$env:GOOGLE_API_KEY="your_api_key_here"`
- **Windows CMD**: `set GOOGLE_API_KEY=your_api_key_here`
- **Linux/Mac**: `export GOOGLE_API_KEY=your_api_key_here`

### 4. Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Option 1: Using Scripts (Windows)

**Terminal 1** (Backend):
```bash
cd backend
start_backend.bat
```

**Terminal 2** (Frontend):
```bash
cd frontend
start_frontend.bat
```

### Option 2: Manual Commands

**Terminal 1** (Backend):
```bash
cd backend
# Activate venv first
uvicorn main:app --reload
```

**Terminal 2** (Frontend):
```bash
cd frontend
npm start
```

## Verify Installation

1. Backend should show: `Uvicorn running on http://0.0.0.0:8000`
2. Frontend should open browser at: `http://localhost:3000`
3. Check backend health: Visit `http://localhost:8000` in browser
4. Check AI status: Visit `http://localhost:8000/ai-status` in browser

## Common Issues

### "Module not found" errors
- Ensure virtual environment is activated
- Reinstall: `pip install -r requirements.txt`

### "Google Gemini API error"
- Verify API key is set: Check `.env` file or environment variable
- Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Check API quota in Google Cloud Console
- Ensure internet connection (Gemini requires internet)

### Port already in use
- Backend: Change port in `uvicorn main:app --reload --port 8001`
- Frontend: Set `PORT=3001` in environment or edit `package.json`

### Webcam not working
- Grant browser permissions
- Check if another app is using camera
- Try different browser

## Next Steps

Once both services are running:
1. Open `http://localhost:3000` in browser
2. Allow camera access
3. Start chatting with the AI interviewer!
