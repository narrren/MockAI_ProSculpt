# How to Fix the Ollama Error - Step by Step

## The Problem
You're getting: "Error connecting to Ollama: model 'llama3' not found"

## Root Cause
Multiple old backend servers are running, and they're using the old default model 'llama3' instead of the newly installed 'llama3.2'.

## Solution - Complete Clean Restart

### Step 1: Close ALL Terminal Windows
1. Close **EVERY** PowerShell, Command Prompt, and Terminal window
2. This ensures no old servers are running

### Step 2: Open ONE New PowerShell Window
- Press `Win + X` → Select "Windows PowerShell" or "Terminal"

### Step 3: Navigate and Start Server
Run these commands **one at a time**:

```powershell
cd C:\Users\naren\Desktop\MockAI_ProSculpt\backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 4: Verify in the Terminal
Look for these lines in the terminal output:
```
==================================================
Initializing InterviewerAI...
Using Ollama model: llama3.2
InterviewerAI initialized with model: llama3.2
==================================================
```

✅ **If you see `llama3.2`** → It's working! Try the chat now.
❌ **If you see `llama3`** → Close the terminal and repeat Step 1-3.

### Step 5: Test the Chat
1. Wait 5 seconds after seeing "Application startup complete"
2. Go to your browser
3. Try sending a message in the chat
4. It should work now!

## Alternative: Use the Helper Scripts

1. **Stop all servers:**
   ```powershell
   .\KILL_ALL_BACKEND.ps1
   ```

2. **Start fresh server:**
   ```powershell
   .\START_BACKEND.ps1
   ```

## Why This Happens
- The backend server loads the AI model when it **starts**
- If you installed the model **after** the server started, it won't see it
- Multiple servers can run at once, causing conflicts
- **Solution: Always restart the server after installing Ollama models**

## Still Not Working?
1. Check Ollama is running: `python backend/check_ollama.py`
2. Verify model is installed: Should show `llama3.2:latest`
3. Make sure you closed ALL terminal windows
4. Try restarting your computer (clears all processes)

