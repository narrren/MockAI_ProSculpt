# Quick Start Guide - Fix Ollama Error

## The Problem
The backend server is using an old cached instance with model 'llama3' instead of the newly installed 'llama3.2'.

## The Solution - RESTART THE SERVER

### Step 1: Stop ALL Backend Processes

**Option A: Use the script (Easiest)**
```powershell
.\STOP_BACKEND.ps1
```

**Option B: Manual method**
1. Find ALL terminal windows running the backend
2. In each one, press `Ctrl + C` to stop
3. Or close all terminal windows

### Step 2: Start Fresh Server

**Option A: Use the script (Easiest)**
```powershell
.\START_BACKEND.ps1
```

**Option B: Manual method**
Open a NEW PowerShell terminal and run:
```powershell
cd C:\Users\naren\Desktop\MockAI_ProSculpt\backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 3: Verify It's Working

1. Wait 5-10 seconds for the server to start
2. Look at the terminal output - you should see:
   ```
   ==================================================
   Initializing InterviewerAI...
   Using Ollama model: llama3.2
   InterviewerAI initialized with model: llama3.2
   ==================================================
   ```
3. Test in browser: Go to `http://localhost:8000/ai-status`
4. Try the chat - it should work now!

## Important Notes

- **You MUST restart the server** after installing Ollama models
- The server loads the model when it starts, so old instances won't see new models
- If you see "model: llama3" in the startup logs, the server is using old code - restart it
- If you see "model: llama3.2" in the startup logs, it's working correctly!

## Troubleshooting

If it still doesn't work after restart:
1. Check that Ollama is running: `python backend/check_ollama.py`
2. Verify the model is installed: Should show `llama3.2:latest`
3. Make sure you're using the correct virtual environment
4. Clear Python cache: Delete `backend/__pycache__` folder

