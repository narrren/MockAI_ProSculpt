# 🚀 Quick Start Guide - Aptiva

## ⚡ Fast Setup (5 minutes)

### Step 1: Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment (if not exists):**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment:**
   - **Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Windows (CMD):**
     ```cmd
     venv\Scripts\activate.bat
     ```
   - **Linux/Mac:**
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure API Key:**
   - Create `backend/.env` file:
     ```env
     GOOGLE_API_KEY=your_gemini_api_key_here
     ```
   - Get API key from: https://makersuite.google.com/app/apikey

6. **Start backend server:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   
   You should see:
   ```
   INFO:     Uvicorn running on http://0.0.0.0:8000
   ```

### Step 2: Frontend Setup

1. **Open a NEW terminal window**

2. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start frontend:**
   ```bash
   npm start
   ```
   
   The app will open automatically at `http://localhost:3000`

### Step 3: Verify Setup

1. **Check backend health:**
   - Open browser: `http://localhost:8000/health`
   - Should see: `{"status":"healthy","backend":"running",...}`

2. **Check frontend:**
   - Should open automatically at `http://localhost:3000`
   - Login page should appear

3. **Test login:**
   - Use test credentials: `test@prosculpt.com` / `test123`
   - Or register a new account

## 🎯 Troubleshooting

### Backend Not Starting

**Error: "Port 8000 already in use"**
```bash
# Find and kill process using port 8000
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or use a different port:
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

**Error: "Module not found"**
```bash
# Make sure virtual environment is activated
# Reinstall dependencies:
pip install -r requirements.txt
```

**Error: "GOOGLE_API_KEY not found"**
- Create `backend/.env` file with your API key
- Restart the backend server

### Frontend Not Starting

**Error: "Port 3000 already in use"**
```bash
# Use a different port:
PORT=3001 npm start
```

**Error: "Cannot connect to backend"**
- Check if backend is running on port 8000
- Verify `http://localhost:8000/health` returns healthy status
- Check browser console for CORS errors

### Login Timeout Error

**"Request timeout. Please check if the backend server is running"**

1. **Verify backend is running:**
   - Check terminal where you started backend
   - Should see: `Uvicorn running on http://0.0.0.0:8000`

2. **Check backend health:**
   - Open: `http://localhost:8000/health`
   - Should return: `{"status":"healthy"}`

3. **Check firewall/antivirus:**
   - May be blocking localhost connections
   - Temporarily disable to test

4. **Try different port:**
   - If 8000 is blocked, use 8001
   - Update `frontend/src/App.js` and `frontend/src/pages/Login.js`:
     ```javascript
     const API_URL = 'http://localhost:8001';
     ```

## 📋 Features Available

✅ **Authentication** - Email OTP login/signup
✅ **AI Interviewer** - Google Gemini powered
✅ **Real-time Proctoring** - Face detection, violations
✅ **Code Execution** - Multi-language support
✅ **Code Evaluation** - AI-powered feedback
✅ **Skill Heatmap** - Real-time skill assessment
✅ **Career Blueprint** - Personalized roadmap
✅ **Personality Modes** - 5 interviewer styles
✅ **Communication Metrics** - Filler words, clarity
✅ **Integrity Score** - Proctoring analysis
✅ **Theme Toggle** - Light/Dark mode
✅ **Multi-language** - EN, ES, FR, HI

## 🎨 UI Features

- Modern, professional design
- Responsive layout
- Smooth animations
- Dark/Light theme
- Real-time updates
- Flash alerts
- Floating chatbox

## 🔧 Development

**Backend:**
- FastAPI with auto-reload
- Changes auto-reload on save
- Check terminal for errors

**Frontend:**
- React with hot-reload
- Changes appear instantly
- Check browser console for errors

## 📝 Next Steps

1. Complete interview to see analytics
2. Try different personality modes
3. Generate career blueprint
4. Check proctoring insights
5. Review communication metrics

## 🆘 Still Having Issues?

1. **Check both terminals** - Backend and Frontend must be running
2. **Check ports** - 8000 (backend) and 3000 (frontend)
3. **Check API key** - Must be in `backend/.env`
4. **Check browser console** - For frontend errors
5. **Check backend terminal** - For backend errors

---

**Ready to interview!** 🎉
