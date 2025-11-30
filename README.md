# Aptiva

AI-Powered Interview Intelligence Platform with real-time proctoring capabilities. Built with open-source tools to provide a comprehensive interview experience.

## 🎯 Features

- **AI-Powered Interviewer**: Uses Google Gemini for intelligent, contextual interviews
- **Real-Time Proctoring**: MediaPipe + OpenCV for face detection, gaze tracking, and violation alerts
- **Code Execution Engine**: Safe Python code execution with timeout protection
- **Modern UI**: React-based interface with Monaco code editor (VS Code-like experience)
- **WebSocket Communication**: Real-time video streaming and proctoring alerts

## 🛠️ Tech Stack

### Backend
- **FastAPI**: High-performance async API server
- **Google Gemini**: Cloud-based AI model for interviewer responses
- **MediaPipe**: Face detection and tracking
- **OpenCV**: Computer vision processing
- **Python 3.10+**: Backend language

### Frontend
- **React 18**: UI framework
- **Monaco Editor**: VS Code-like code editor
- **React Webcam**: Webcam access
- **Axios**: HTTP client

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Python 3.10+** installed
2. **Node.js 16+** and npm installed
3. **Google Gemini API Key** ([Get it here](https://makersuite.google.com/app/apikey))
4. **Webcam** for proctoring features

## 🚀 Setup Instructions

### Step 1: Get Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

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

### Step 1: Configure API Key

Create a `.env` file in the `backend` directory:
```bash
cd backend
echo GOOGLE_API_KEY=your_api_key_here > .env
```

Or set it as an environment variable:
- **Windows PowerShell**: `$env:GOOGLE_API_KEY="your_api_key_here"`
- **Windows CMD**: `set GOOGLE_API_KEY=your_api_key_here`
- **Linux/Mac**: `export GOOGLE_API_KEY=your_api_key_here`

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

### Changing the AI Model

Edit `backend/ai_interviewer.py`:
```python
self.model_name = "gemini-pro"  # or "gemini-pro-vision" for multimodal
```

Available Gemini models:
- `gemini-pro`: Text-only model (default)
- `gemini-pro-vision`: Multimodal model (text + images)

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
- Ensure `GOOGLE_API_KEY` is set in environment variables or `.env` file
- Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Check API quota and billing in Google Cloud Console
- Verify internet connection (Gemini requires internet access)

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

## 🚧 Future Enhancements

- [ ] Docker containerization for code execution
- [ ] SQL query execution with sample databases
- [ ] Audio integrity monitoring (whisper detection)
- [ ] System design diagramming (Excalidraw integration)
- [ ] Multiple programming language support
- [ ] Interview session recording and playback
- [ ] Performance analytics dashboard

## 📝 License

This project is open source and available for educational purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues or questions, please open an issue on the repository.

---

**Built with ❤️ using open-source tools**

