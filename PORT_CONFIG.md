# Port Configuration Guide

## Default Ports

- **Backend API**: `8000`
- **Frontend React App**: `3000`
- **Ollama**: Uses default port (usually 11434)

These ports are chosen to avoid conflicts with common services (5000, 5001, etc.).

## Changing Backend Port

### Option 1: Command Line
```bash
cd backend
uvicorn main:app --reload --port 8001
```

### Option 2: Update Scripts
Edit `backend/start_backend.bat` or `backend/start_backend.sh`:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### Option 3: Update main.py
Edit `backend/main.py` line 140:
```python
uvicorn.run(app, host="0.0.0.0", port=8001)
```

**Important**: After changing backend port, update frontend configuration!

## Changing Frontend Port

### Option 1: Environment Variable
Create `frontend/.env` file:
```
PORT=3001
```

### Option 2: Command Line
```bash
# Windows
set PORT=3001 && npm start

# Linux/Mac
PORT=3001 npm start
```

### Option 3: Update package.json
Edit `frontend/package.json`:
```json
"scripts": {
  "start": "set PORT=3001 && react-scripts start"
}
```

## Updating Frontend to Match Backend Port

If you change the backend port, update `frontend/src/App.js`:

```javascript
// Change these lines (around line 7-8)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8001';
```

Or create `frontend/.env`:
```
REACT_APP_API_URL=http://localhost:8001
REACT_APP_WS_URL=ws://localhost:8001
```

## Quick Port Check

Check if ports are in use:

**Windows**:
```powershell
netstat -ano | findstr :8000
netstat -ano | findstr :3000
```

**Linux/Mac**:
```bash
lsof -i :8000
lsof -i :3000
```

## Recommended Port Ranges

- **Backend**: 8000-8999 (avoid 5000-5001)
- **Frontend**: 3000-3999
- **Development**: Use ports above 1024 (no admin required)

