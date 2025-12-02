# Aptiva

AI-Powered Interview Intelligence Platform with real-time proctoring capabilities. Built with open-source tools to provide a comprehensive interview experience.

## 🎯 Features

- **AI-Powered Interviewer**: Uses Google Gemini for intelligent, contextual interviews
- **Realistic Video Avatar**: HeyGen integration with real-time lip-sync and expressions
- **Real-Time Proctoring**: MediaPipe + OpenCV for face detection, gaze tracking, and violation alerts
- **Code Execution Engine**: Multi-language code execution (Python, JavaScript, Java, C++, C) with timeout protection
- **Modern UI**: Professional design system with dark mode, floating components, and responsive layout
- **Resume Management**: AI-powered resume parsing, profile management, and career analysis
- **Analytics Dashboard**: Real-time skill tracking, communication metrics, and career blueprint
- **WebSocket Communication**: Real-time video streaming and proctoring alerts

## 🛠️ Tech Stack

### Backend
- **FastAPI**: High-performance async API server
- **Google Gemini**: Cloud-based AI model for interviewer responses
- **HeyGen API**: Real-time video avatar generation
- **LiveKit**: WebRTC infrastructure for video streaming
- **MediaPipe**: Face detection and tracking
- **OpenCV**: Computer vision processing
- **SQLAlchemy**: Database ORM (SQLite/PostgreSQL)
- **httpx**: Async HTTP client for API calls
- **Python 3.10+**: Backend language

### Frontend
- **React 18**: UI framework
- **Monaco Editor**: VS Code-like code editor
- **React Webcam**: Webcam access
- **LiveKit Client**: Real-time video streaming
- **Axios**: HTTP client
- **Modern CSS**: Design tokens, dark mode, responsive layout

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Python 3.10+** installed
2. **Node.js 16+** and npm installed
3. **Google Gemini API Key** ([Get it here](https://makersuite.google.com/app/apikey))
4. **HeyGen API Key** (optional, for video avatar - [Get it here](https://www.heygen.com/))
5. **Gmail Account** with App Password (for email OTP - see [SETUP_APP_PASSWORD.md](SETUP_APP_PASSWORD.md))
6. **Webcam** for proctoring features

## 🚀 Setup Instructions

### Step 1: Get API Keys

**Google Gemini API Key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

**HeyGen API Key (Optional - for video avatar):**
1. Go to [HeyGen](https://www.heygen.com/)
2. Sign up for an account
3. Navigate to API settings
4. Generate an API key
5. Note: Free tier has quota limits

**Email Setup (for OTP):**
1. See [SETUP_APP_PASSWORD.md](SETUP_APP_PASSWORD.md) for detailed instructions
2. Enable 2-Step Verification on your Gmail account
3. Generate an App Password
4. Use the App Password in `backend/.env`

### Step 2: Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - **Windows**: `venv\Scripts\activate`
   - **Linux/Mac**: `source venv/bin/activate`

4. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

   **Note**: Some packages (like `torch` and `openai-whisper`) are large and may take time to download.

### Step 3: Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

## 🏃 Running the Application

You need to run two services simultaneously:

### Step 1: Configure Environment Variables

Create a `.env` file in the `backend` directory:
```bash
cd backend
```

Create `.env` file with:
```env
# Google Gemini API
GOOGLE_API_KEY=your_gemini_api_key_here

# HeyGen API (optional - for video avatar)
HEYGEN_API_KEY=your_heygen_api_key_here

# Email Configuration (for OTP)
ENABLE_EMAIL=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
```

**Note**: For Gmail, use an App Password (not your regular password). See [SETUP_APP_PASSWORD.md](SETUP_APP_PASSWORD.md) for instructions.

### Terminal 1: Backend Server
```bash
cd backend
# Activate virtual environment if not already active
uvicorn main:app --reload
```
The backend will be available at `http://localhost:8000`

**Note**: If port 8000 is in use, change it:
```bash
uvicorn main:app --reload --port 8001
```
Then update `frontend/src/App.js` to use the new port.

### Terminal 2: Frontend Server
```bash
cd frontend
npm start
```
The frontend will open automatically at `http://localhost:3000`

**Note**: If port 3000 is in use, React will prompt to use a different port, or set it manually:
```bash
# Windows
set PORT=3001 && npm start

# Linux/Mac
PORT=3001 npm start
```

## 📖 Usage Guide

1. **Start the Application**: Follow the steps above to start all three services.

2. **Grant Camera Permissions**: When the browser opens, allow camera access for proctoring.

3. **Begin Interview**: 
   - The AI interviewer will greet you
   - Type your responses in the chat interface
   - The AI will ask technical questions and coding problems

4. **Coding Challenges**:
   - When asked to write code, use the code editor on the right panel
   - Write Python code in the editor
   - Click "Run Code" to execute and see output
   - The AI will evaluate your solution

5. **Proctoring Alerts**:
   - The system monitors your face, gaze, and position
   - Alerts appear as red badges on the video feed if violations are detected:
     - No face detected
     - Multiple faces detected
     - Head turned away
     - Eyes closed
     - Face too close/far from camera

## 🏗️ Project Structure

```
Aptiva/
├── backend/
│   ├── main.py            # FastAPI server
│   ├── proctoring.py      # Face/eye detection logic
│   ├── ai_interviewer.py  # Google Gemini integration
│   ├── code_engine.py     # Code execution engine
│   └── requirements.txt   # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── VideoFeed.js      # Webcam component
│   │   │   ├── CodeEditor.js     # Monaco editor
│   │   │   └── ChatInterface.js  # Chat UI
│   │   ├── App.js                # Main app component
│   │   └── App.css               # Styles
│   └── package.json
├── prompts/
│   └── interviewer_persona.txt   # AI system prompt
└── README.md
```

## 🔧 Configuration

### Test Credentials

For testing purposes, use:
- **Email**: `test@aptiva.ai`
- **Password**: `aptivatesting`
- **Note**: Test account bypasses OTP and has a 3-question limit

### Changing the AI Model

Edit `backend/ai_interviewer.py`:
```python
self.model_name = "gemini-2.0-flash-exp"  # Current default
```

Available Gemini models:
- `gemini-2.0-flash-exp`: Latest experimental model (default)
- `gemini-2.0-flash`: Stable flash model
- `gemini-1.5-flash`: Previous generation

### Adjusting Proctoring Sensitivity

Edit `backend/proctoring.py` to modify thresholds:
- `deviation > 0.05`: Head turn sensitivity
- `eye_open < 0.002`: Eye closure threshold
- `normalized_size`: Face distance thresholds

### API Endpoints

- `POST /chat`: Send message to AI interviewer
- `POST /run_code`: Execute Python code
- `POST /run_sql`: Execute SQL query (uses sample database)
- `POST /reset_chat`: Reset conversation context
- `WebSocket /ws/video`: Real-time video proctoring stream

## 🐛 Troubleshooting

### Google Gemini API Error
- Ensure `GOOGLE_API_KEY` is set in `backend/.env` file
- Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Check API quota and billing in Google Cloud Console
- Verify internet connection (Gemini requires internet access)
- Restart backend after updating `.env` file

### HeyGen Avatar Not Loading
- Ensure `HEYGEN_API_KEY` is set in `backend/.env` file
- Check HeyGen account quota (free tier has limits)
- Avatar will automatically fall back to browser TTS if HeyGen fails
- See [HEYGEN_SETUP.md](HEYGEN_SETUP.md) for detailed setup instructions

### Email OTP Not Sending
- Ensure `EMAIL_FROM` and `EMAIL_PASSWORD` are set in `backend/.env`
- For Gmail, use App Password (not regular password)
- Enable 2-Step Verification on Gmail account first
- See [SETUP_APP_PASSWORD.md](SETUP_APP_PASSWORD.md) for instructions
- Restart backend after updating email configuration

### Webcam Not Working
- Grant browser camera permissions
- Check if another application is using the camera
- Try refreshing the page

### Port Already in Use
- **Backend (default: 8000)**: 
  ```bash
  uvicorn main:app --reload --port 8001
  ```
  Then update `frontend/src/App.js`:
  ```javascript
  const API_URL = 'http://localhost:8001';
  const WS_URL = 'ws://localhost:8001';
  ```
- **Frontend (default: 3000)**: 
  - Windows: `set PORT=3001 && npm start`
  - Linux/Mac: `PORT=3001 npm start`
  - Or create `frontend/.env` file with: `PORT=3001`
- See `PORT_CONFIG.md` for detailed port configuration guide

### Backend Dependencies Issues
- Ensure Python 3.10+ is installed
- Try upgrading pip: `pip install --upgrade pip`
- For MediaPipe issues on Windows, ensure Visual C++ Redistributable is installed

### Frontend Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Ensure Node.js 16+ is installed

## 🔒 Security Notes

⚠️ **Important**: This is an MVP for local development. For production:

1. **Code Execution**: The current `code_engine.py` uses subprocess which is not fully secure. Use Docker containers for production.
2. **CORS**: Currently allows all origins. Restrict in production.
3. **Input Validation**: Add more robust input validation.
4. **Rate Limiting**: Implement rate limiting for API endpoints.

## ✨ Recent Updates (v0.3.0)

- ✅ **UI Revamp**: Modern design system with CSS tokens, dark mode only
- ✅ **HeyGen Avatar**: Realistic video avatar with real-time lip-sync
- ✅ **Resume Management**: Upload, parse, and manage resumes with AI analysis
- ✅ **Profile Section**: View and edit profile, manage resumes
- ✅ **Test Account Limits**: 3-question limit for test users
- ✅ **Improved Error Handling**: Better error messages and fallbacks
- ✅ **Speech Queueing**: Prevents overlap between avatar and browser TTS
- ✅ **Compact UI**: Professional, space-efficient component design

## 🚧 Future Enhancements

- [ ] Docker containerization for code execution
- [ ] SQL query execution with sample databases
- [ ] Audio integrity monitoring (whisper detection)
- [ ] System design diagramming (Excalidraw integration)
- [ ] Interview session recording and playback
- [ ] Enhanced analytics dashboard
- [ ] Multi-language interview support

## 📝 License

This project is open source and available for educational purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues or questions, please open an issue on the repository.

---

**Built with ❤️ using open-source tools**

