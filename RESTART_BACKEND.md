# How to Restart the Backend Server

## IMPORTANT: The backend server MUST be restarted after installing Ollama models!

## Steps to Restart:

1. **Find the terminal/command prompt where the backend is running**
   - Look for a terminal showing: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
   - Or look for: `INFO: Uvicorn running on http://0.0.0.0:8000`

2. **Stop the server:**
   - Press `Ctrl + C` in that terminal
   - Wait for it to stop completely

3. **Restart the server:**
   ```powershell
   cd backend
   .\venv\Scripts\Activate.ps1
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

4. **Verify it's working:**
   - Open your browser and go to: `http://localhost:8000/ai-status`
   - You should see the current model and available models
   - The status should be "ready"

## Alternative: If you can't find the running server

1. Close all terminal windows
2. Open a NEW terminal/PowerShell
3. Navigate to the project:
   ```powershell
   cd C:\Users\naren\Desktop\MockAI_ProSculpt\backend
   ```
4. Activate virtual environment:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
5. Start the server:
   ```powershell
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## Check Status

After restarting, visit: `http://localhost:8000/ai-status` to verify the model is detected.

