# Quick Setup Guide

## Prerequisites Checklist

- [ ] Python 3.10+ installed
- [ ] Node.js 16+ and npm installed
- [ ] Ollama installed ([Download](https://ollama.com))
- [ ] Webcam available

## Installation Steps

### 1. Install Ollama Model

Open a terminal and run:
```bash
ollama run llama3
```

This downloads ~4GB. Keep this terminal running.

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

### 3. Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Option 1: Using Scripts (Windows)

**Terminal 1** (Ollama):
```bash
ollama run llama3
```

**Terminal 2** (Backend):
```bash
cd backend
start_backend.bat
```

**Terminal 3** (Frontend):
```bash
cd frontend
start_frontend.bat
```

### Option 2: Manual Commands

**Terminal 1** (Ollama):
```bash
ollama run llama3
```

**Terminal 2** (Backend):
```bash
cd backend
# Activate venv first
uvicorn main:app --reload
```

**Terminal 3** (Frontend):
```bash
cd frontend
npm start
```

## Verify Installation

1. Backend should show: `Uvicorn running on http://0.0.0.0:8000`
2. Frontend should open browser at: `http://localhost:3000`
3. Check backend health: Visit `http://localhost:8000` in browser

## Common Issues

### "Module not found" errors
- Ensure virtual environment is activated
- Reinstall: `pip install -r requirements.txt`

### "Ollama connection error"
- Verify Ollama is running: `ollama list`
- Check model is installed: `ollama run llama3`

### Port already in use
- Backend: Change port in `uvicorn main:app --reload --port 8001`
- Frontend: Set `PORT=3001` in environment or edit `package.json`

### Webcam not working
- Grant browser permissions
- Check if another app is using camera
- Try different browser

## Next Steps

Once all three services are running:
1. Open `http://localhost:3000` in browser
2. Allow camera access
3. Start chatting with the AI interviewer!

