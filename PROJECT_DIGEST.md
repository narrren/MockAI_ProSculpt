# 📚 Aptiva - Complete Project Digest

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Dependencies](#dependencies)
5. [Backend Architecture](#backend-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [API Endpoints](#api-endpoints)
8. [Features](#features)
9. [Configuration](#configuration)
10. [File Descriptions](#file-descriptions)
11. [Services & Components](#services--components)
12. [Security Features](#security-features)
13. [Internationalization](#internationalization)
14. [Deployment](#deployment)

---

## 🎯 Project Overview

**Aptiva** is a comprehensive AI-powered interview intelligence platform with real-time proctoring capabilities. It provides a complete interview experience including AI interviewer, code execution, proctoring, and authentication.

### Key Characteristics
- **Type**: Full-stack web application
- **Architecture**: Client-Server (React Frontend + FastAPI Backend)
- **AI Model**: Google Gemini 2.5 Flash
- **Communication**: REST API + WebSocket
- **Authentication**: Email OTP-based
- **Code Execution**: Multi-language support (Python, JavaScript, Java, C++, C)
- **Proctoring**: Real-time face detection and violation monitoring

---

## 🛠️ Technology Stack

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.10+ | Backend programming language |
| **FastAPI** | 0.104.1+ | High-performance async web framework |
| **Uvicorn** | 0.24.0+ | ASGI server for FastAPI |
| **Google Generative AI** | 0.3.0+ | AI interviewer (Gemini API) |
| **OpenCV** | 4.8.0+ | Computer vision for proctoring |
| **MediaPipe** | 0.10.0+ | Face detection and tracking (optional) |
| **NumPy** | 1.24.0+ | Numerical computations |
| **SciPy** | 1.11.0+ | Scientific computing |
| **Pydantic** | 2.5.0+ | Data validation |
| **WebSockets** | 12.0+ | Real-time communication |
| **Python-dotenv** | 1.0.0+ | Environment variable management |
| **Email Validator** | 2.0.0+ | Email format validation |
| **Python-multipart** | 0.0.6+ | File upload support |

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI framework |
| **React DOM** | 18.2.0 | React rendering |
| **React Scripts** | 5.0.1 | Build tools and scripts |
| **Axios** | 1.6.2 | HTTP client for API calls |
| **Monaco Editor** | 4.6.0 | VS Code-like code editor |
| **React Webcam** | 7.2.0 | Webcam access and capture |
| **Socket.io Client** | 4.6.1 | WebSocket client (not actively used) |

### Development Tools

| Tool | Purpose |
|------|---------|
| **Node.js** | JavaScript runtime for frontend |
| **npm** | Package manager for frontend |
| **pip** | Package manager for Python |
| **Git** | Version control |
| **PowerShell** | Windows scripting (helper scripts) |

### External Services

| Service | Purpose |
|---------|---------|
| **Google Gemini API** | AI interviewer responses |
| **SMTP (Gmail/Outlook)** | Email OTP delivery |
| **Browser Web Speech API** | Text-to-speech and speech-to-text |

---

## 📁 Project Structure

```
Aptiva/
├── backend/                          # Python backend server
│   ├── __pycache__/                  # Python bytecode cache
│   ├── venv/                         # Python virtual environment
│   ├── ai_interviewer.py             # AI interviewer logic (Gemini)
│   ├── analytics.py                  # Skill scoring & career blueprint
│   ├── auth.py                       # Authentication & OTP system
│   ├── code_engine.py                 # Multi-language code execution
│   ├── code_revision.py               # AI-powered code improvement
│   ├── database.py                   # PostgreSQL/SQLAlchemy models
│   ├── gamification.py                # Leaderboard & streak tracking
│   ├── interview_session.py           # Session management & tracking
│   ├── main.py                       # FastAPI application & routes
│   ├── multi_file_editor.py           # Multi-file project support
│   ├── personalities.py               # Interviewer personality system
│   ├── proctoring.py                 # Face detection & proctoring
│   ├── realtime_feedback.py           # Real-time code feedback
│   ├── resume_parser.py              # PDF resume parsing
│   ├── system_design.py               # System design analysis (Gemini Vision)
│   ├── requirements.txt              # Python dependencies
│   ├── start_backend.bat             # Windows startup script
│   ├── start_backend.sh              # Linux/Mac startup script
│   └── .env                          # Environment variables (API keys, email config)
│
├── frontend/                         # React frontend application
│   ├── node_modules/                 # NPM dependencies
│   ├── public/                       # Static files
│   │   └── index.html                # HTML template
│   ├── src/                          # Source code
│   │   ├── components/               # React components
│   │   │   ├── AlertFlash.js/css     # Flash alert notifications
│   │   │   ├── Captcha.js/css        # Human verification CAPTCHA
│   │   │   ├── CareerBlueprint.js/css # Career roadmap generator
│   │   │   ├── ChatInterface.js/css  # Chat UI with speech
│   │   │   ├── CodeEditor.js/css     # Monaco code editor
│   │   │   ├── CodeRevision.js/css   # AI code improvement
│   │   │   ├── CommunicationMetrics.js/css # Communication analysis
│   │   │   ├── FloatingVideo.css     # Floating video styles
│   │   │   ├── IntegrityScore.js/css  # Integrity score display
│   │   │   ├── InterviewerAvatar.js/css # AI interviewer avatar
│   │   │   ├── InterviewRounds.js/css # Multi-round tracking
│   │   │   ├── LanguageSelector.js/css # Language switcher
│   │   │   ├── PersonalitySelector.js/css # Interviewer style selector
│   │   │   ├── ProctoringDashboard.js/css # Proctoring insights
│   │   │   ├── SkillHeatmap.js/css   # Real-time skill visualization
│   │   │   └── VideoFeed.js/css      # Webcam feed component
│   │   ├── i18n/                     # Internationalization
│   │   │   └── languages.js          # Translation dictionary
│   │   ├── pages/                    # Page components
│   │   │   ├── Auth.css              # Auth page styles
│   │   │   ├── Login.js               # Login page
│   │   │   └── Signup.js              # Signup page
│   │   ├── services/                 # Service modules
│   │   │   └── speechService.js       # Web Speech API wrapper
│   │   ├── App.js                    # Main application component
│   │   ├── App.css                    # Main app styles
│   │   ├── index.js                   # React entry point
│   │   └── index.css                  # Global styles
│   ├── package.json                  # NPM dependencies & scripts
│   ├── package-lock.json             # Locked dependency versions
│   ├── start_frontend.bat            # Windows startup script
│   └── start_frontend.sh             # Linux/Mac startup script
│
├── prompts/                          # AI prompts
│   └── interviewer_persona.txt       # AI interviewer system prompt
│
├── Documentation Files/
│   ├── README.md                     # Main project documentation
│   ├── SETUP.md                      # Setup instructions
│   ├── QUICK_START.md                # Quick start guide
│   ├── GEMINI_SETUP.md               # Gemini API setup
│   ├── EMAIL_SETUP.md                # Email configuration
│   ├── SETUP_EMAIL_NOW.md            # Quick email setup
│   ├── QUICK_EMAIL_SETUP.md          # Email setup guide
│   ├── OTP_TROUBLESHOOTING.md        # OTP troubleshooting
│   ├── API_KEY_SETUP.md              # API key configuration
│   ├── GIT_GUIDE.md                  # Git usage guide
│   ├── IMPLEMENTATION_COMPLETE.md    # Premium features guide
│   ├── PORT_CONFIG.md                # Port configuration
│   ├── PREMIUM_FEATURES.md           # Premium features documentation
│   ├── PROCTORING_FEATURES.md        # Proctoring documentation
│   ├── QUICK_START.md                # Quick start guide
│   ├── TEST_CREDENTIALS.md           # Test account info
│   ├── RESTART_BACKEND.md            # Backend restart guide
│   ├── BACKEND_STATUS.md             # Backend status info
│   └── PROJECT_DIGEST.md             # This file
│
└── Helper Scripts/
    ├── START_BACKEND.ps1             # PowerShell backend starter
    ├── STOP_BACKEND.ps1              # PowerShell backend stopper
    ├── KILL_ALL_BACKEND.ps1          # Aggressive backend killer
    └── UPDATE_GIT.ps1                # Git update helper
```

---

## 📦 Dependencies

### Backend Dependencies (`backend/requirements.txt`)

```txt
fastapi>=0.104.1              # Web framework
uvicorn[standard]>=0.24.0    # ASGI server
opencv-python>=4.8.0         # Computer vision
mediapipe>=0.10.0             # Face detection (optional)
google-generativeai>=0.3.0    # Google Gemini API
pydantic>=2.5.0               # Data validation
numpy>=1.24.0                 # Numerical computing
scipy>=1.11.0                 # Scientific computing
python-multipart>=0.0.6       # File uploads
websockets>=12.0              # WebSocket support
email-validator>=2.0.0        # Email validation
python-dotenv>=1.0.0          # Environment variables
reportlab>=4.0.0              # PDF generation (certificates)
diff-match-patch>=20230430    # Code diff visualization
```

### Frontend Dependencies (`frontend/package.json`)

```json
{
  "dependencies": {
    "@monaco-editor/react": "^4.6.0",      // Code editor
    "axios": "^1.6.2",                      // HTTP client
    "react": "^18.2.0",                     // UI framework
    "react-dom": "^18.2.0",                 // React rendering
    "react-scripts": "5.0.1",               // Build tools
    "react-webcam": "^7.2.0",               // Webcam access
    "socket.io-client": "^4.6.1"            // WebSocket client
  }
}
```

---

## 🏗️ Backend Architecture

### Core Modules

#### 1. `main.py` - FastAPI Application
- **Purpose**: Main application entry point, API routes, WebSocket handling
- **Key Components**:
  - FastAPI app initialization
  - CORS middleware configuration
  - API endpoint definitions
  - WebSocket endpoint for video proctoring
  - Request/response models (Pydantic)

#### 2. `ai_interviewer.py` - AI Interviewer
- **Purpose**: Manages AI conversation with Google Gemini
- **Key Features**:
  - Google Gemini API integration
  - Conversation context management
  - Coding question detection
  - Language detection from questions
  - Code evaluation using AI
- **Model**: `gemini-2.5-flash`
- **Methods**:
  - `chat()`: Send message to AI, get response
  - `is_coding_question()`: Detect if message is coding question
  - `detect_language_from_question()`: Detect programming language
  - `evaluate_code()`: Evaluate code correctness using AI

#### 3. `auth.py` - Authentication System
- **Purpose**: User registration, login, OTP management
- **Key Features**:
  - Email OTP generation and verification
  - User registration and login
  - SMTP email sending
  - Test credentials bypass
  - Session token management
- **Storage**: In-memory dictionaries (MVP)
- **OTP**: 6-digit numeric, 10-minute expiry, 3 attempt limit

#### 4. `proctoring.py` - Proctoring System
- **Purpose**: Real-time face detection and violation monitoring
- **Key Features**:
  - Face detection (MediaPipe or OpenCV fallback)
  - Head pose estimation
  - Eye closure detection (with cooldown)
  - Multiple face detection
  - Face distance monitoring (with cooldown)
  - Alert cooldown system (10 seconds)
  - Startup grace period (15 seconds - no alerts during initialization)
  - False positive prevention
- **Technologies**: MediaPipe (preferred), OpenCV (fallback)
- **Alert System**: 
  - 10-second cooldown between alerts
  - 15-second startup grace period
  - Deduplication to prevent spam
  - Configurable thresholds

#### 5. `code_engine.py` - Code Execution Engine
- **Purpose**: Safe execution of code in multiple languages
- **Supported Languages**:
  - Python (subprocess)
  - JavaScript (Node.js)
  - Java (javac + java)
  - C++ (g++)
  - C (gcc)
- **Features**:
  - Timeout protection (5-15 seconds)
  - Safe subprocess execution
  - Error handling
  - Output capture

#### 6. `interview_session.py` - Interview Session Manager
- **Purpose**: Tracks interview state, rounds, scores, and metrics
- **Key Features**:
  - Multi-round interview flow (MCQ, Technical, Coding, Behavioral, Summary)
  - Real-time skill tracking (0-100 for each skill)
  - Communication metrics tracking
  - Proctoring metrics aggregation
  - Integrity score calculation
  - Code attempt tracking
  - Session summary generation

#### 7. `analytics.py` - Analytics Engine
- **Purpose**: Analyzes interview data and generates insights
- **Key Features**:
  - Communication analysis (filler words, clarity, STAR format)
  - Skill score calculation
  - Career blueprint generation
  - Proctoring behavior analysis
  - Response time analysis
  - Job role compatibility scoring

#### 8. `personalities.py` - Personality System
- **Purpose**: Different interviewer styles for varied experiences
- **Available Personalities**:
  - Professional (default)
  - Tough FAANG
  - Friendly HR-style
  - Rapid-fire Competitive
  - Technical Architect
- **Features**: Dynamic prompt switching based on personality

#### 9. `code_revision.py` - Code Revision System
- **Purpose**: AI-powered code improvement and analysis
- **Key Features**:
  - Before/after code comparison
  - Improvement explanations
  - Diff generation
  - Optimization suggestions
  - Edge case handling recommendations

---

## 🎨 Frontend Architecture

### Main Application (`App.js`)

**State Management**:
- Authentication state
- User data
- Alerts and violations
- WebSocket connection
- Interviewer speaking state
- Coding question state
- Chat minimized state
- Video minimized state
- CAPTCHA verification state
- Session management
- Personality selection
- Current interview round
- Analytics panel visibility
- Backend connection status
- Theme (dark/light)

**Key Functions**:
- `handleLoginSuccess()`: Process successful login
- `handleSignupSuccess()`: Process successful signup
- `handleLogout()`: Clear session and logout
- `handleInterviewerMessage()`: Process AI messages
- `handleCodeViolation()`: Handle proctoring violations
- `handleCaptchaVerify()`: Process CAPTCHA verification

### Components

#### 1. `VideoFeed.js`
- **Purpose**: Webcam video feed display
- **Features**: Screenshot capture for proctoring, floating component
- **Library**: `react-webcam`
- **Location**: Floating in bottom-left corner

#### 2. `ChatInterface.js`
- **Purpose**: Chat UI with AI interviewer
- **Features**:
  - Message display
  - Text input
  - Voice input (Web Speech API)
  - Text-to-speech for AI responses
  - Subtitles display
  - Minimize/maximize functionality
- **Services**: `speechService.js`

#### 3. `CodeEditor.js`
- **Purpose**: Code editor for coding questions
- **Features**:
  - Monaco Editor integration
  - Multi-language support
  - Code execution
  - Code evaluation
  - Copy-paste blocking
  - Keyboard shortcut blocking
  - Output display
- **Library**: `@monaco-editor/react`

#### 4. `InterviewerAvatar.js`
- **Purpose**: Display AI interviewer avatar
- **Features**:
  - Speaking animation
  - Status indicators
  - Subtitle overlay
  - Professional design

#### 5. `AlertFlash.js`
- **Purpose**: Full-screen flash alerts
- **Features**:
  - Auto-dismiss (5 seconds)
  - Fade animations
  - Multiple alert support

#### 6. `Captcha.js`
- **Purpose**: Human verification
- **Features**:
  - Math-based CAPTCHA
  - Auto-refresh on wrong answer
  - Success animation
  - Attempt tracking

#### 7. `LanguageSelector.js`
- **Purpose**: Language selection dropdown
- **Features**: Multi-language support (EN, ES, FR, HI)

### Pages

#### 1. `Login.js`
- **Purpose**: User login page
- **Features**:
  - Email/password input
  - OTP verification
  - Test credentials support
  - Error handling
  - Language selector

#### 2. `Signup.js`
- **Purpose**: User registration page
- **Features**:
  - Name/email input
  - OTP verification
  - Error handling
  - Language selector

### Services

#### `speechService.js`
- **Purpose**: Web Speech API wrapper
- **Features**:
  - Text-to-speech (TTS)
  - Speech-to-text (STT)
  - Microphone permission handling
  - Browser compatibility checks
  - Voice selection

### Internationalization

#### `languages.js`
- **Purpose**: Translation system
- **Supported Languages**:
  - English (en)
  - Spanish (es)
  - French (fr)
  - Hindi (hi)
- **Features**: Centralized translation dictionary

---

## 🔌 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/register` | Register new user | `{email, name}` | `{status, message, otp?}` |
| POST | `/verify-otp` | Verify OTP for signup | `{email, otp}` | `{status, message, token, user}` |
| POST | `/login` | Login user | `{email, password?}` | `{status, message, token?, user?, otp?}` |
| POST | `/verify-login-otp` | Verify OTP for login | `{email, otp}` | `{status, message, token, user}` |
| GET | `/test-credentials` | Get test credentials | - | `{email, password, note}` |

### AI & Chat Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/chat` | Send message to AI | `{message}` | `{reply, is_coding_question, suggested_language}` |
| POST | `/reset_chat` | Reset conversation | - | `{status, message}` |
| GET | `/ai-status` | Check AI status | - | `{current_model, api_configured, api_connected, status, provider}` |

### Code Execution Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/run_code` | Execute code | `{code, language}` | `{status, output}` |
| POST | `/run_sql` | Execute SQL query | `{query}` | `{status, output}` |
| POST | `/evaluate_code` | Evaluate code correctness | `{code, language, question, expected_output?}` | `{status, is_correct, score, feedback, strengths, improvements}` |

### Proctoring Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| WebSocket | `/ws/video` | Real-time video proctoring | Base64 image frames | `{alerts: [...]}` |
| POST | `/report_violation` | Report violation | `{type, details, timestamp}` | `{status, message}` |

### Advanced Features Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/resume/upload` | Upload and parse resume PDF | `file: PDF, user_id?` | `{skills, experience, education, generated_questions}` |
| POST | `/system-design/analyze` | Analyze system design diagram | `{image_base64, problem_statement}` | `{score, feedback, raw_response}` |
| POST | `/multi-file/create/{session_id}` | Create multi-file project | `{files: {path: content}, entry_file, language}` | `{project_id, files, project_dir}` |
| POST | `/multi-file/execute/{session_id}` | Execute multi-file project | `entry_file, language` | `{status, output}` |
| GET | `/multi-file/tree/{session_id}` | Get file tree structure | - | `{file_tree: [...]}` |
| POST | `/multi-file/update/{session_id}` | Update file in project | `file_path, content` | `{status, message}` |
| POST | `/realtime-feedback/check/{session_id}` | Real-time code feedback | `{code, question}` | `{has_issue, feedback, severity?}` |
| GET | `/leaderboard` | Get global leaderboard | `limit?` | `{leaderboard: [...]}` |
| GET | `/user/stats/{user_id}` | Get user statistics | - | `{current_streak, longest_streak, total_interviews, best_score}` |
| POST | `/session/{session_id}/complete` | Complete session | `user_id` | `{status, scores}` |

### Utility Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/` | API root/info | - | `{message, status, endpoints}` |
| GET | `/health` | Backend health check | - | `{status, backend, timestamp}` |
| GET | `/docs` | Swagger UI | - | HTML documentation |

---

## ✨ Features

### 1. Authentication & Security
- ✅ Email OTP-based authentication
- ✅ User registration with email verification
- ✅ Login with OTP verification
- ✅ Test credentials bypass (for testing)
- ✅ Session token management
- ✅ CAPTCHA verification (human check)
- ✅ Always require login on page refresh

### 2. AI Interviewer
- ✅ Google Gemini 2.5 Flash integration
- ✅ Contextual conversation
- ✅ Coding question detection
- ✅ Language detection from questions
- ✅ Code evaluation and feedback
- ✅ System prompt customization
- ✅ Conversation history management

### 3. Proctoring System
- ✅ Real-time face detection
- ✅ Head movement detection
- ✅ Eye closure detection
- ✅ Multiple face detection
- ✅ Face distance monitoring
- ✅ Tab/window switching detection
- ✅ Window focus detection
- ✅ Copy-paste blocking
- ✅ Keyboard shortcut blocking
- ✅ Alert system with cooldown
- ✅ Toggle alerts on/off

### 4. Code Execution
- ✅ Multi-language support:
  - Python
  - JavaScript (Node.js)
  - Java
  - C++
  - C
- ✅ Safe code execution with timeout
- ✅ Output capture
- ✅ Error handling
- ✅ Code evaluation using AI
- ✅ Question-specific code editor
- ✅ Automatic language detection

### 5. User Interface
- ✅ Modern, elegant design
- ✅ Responsive layout
- ✅ Glassmorphism effects
- ✅ Animations and transitions
- ✅ Dark theme code editor
- ✅ Floating chatbox
- ✅ Minimize/maximize chat
- ✅ Flash alerts (auto-dismiss)
- ✅ Interviewer avatar with animations
- ✅ Subtitles for AI speech

### 6. Speech Features
- ✅ Text-to-speech (AI responses)
- ✅ Speech-to-text (user input)
- ✅ Microphone permission handling
- ✅ Voice selection
- ✅ Speaking animations
- ✅ Subtitle display

### 7. Premium Features (NEW)
- ✅ **AI Interview Blueprint**: Dynamic career path generator
  - Strengths/weaknesses analysis
  - Recommended courses with timelines
  - Job role compatibility scoring
  - Estimated improvement timeline
- ✅ **Personality Simulation Mode**: 5 interviewer styles
  - Professional (default)
  - Tough FAANG
  - Friendly HR-style
  - Rapid-fire Competitive
  - Technical Architect
- ✅ **Real-time Skill Heatmap**: Live analytics visualization
  - Problem-solving score
  - Communication score
  - Coding quality score
  - Conceptual knowledge score
  - Behavioral clarity score
- ✅ **AI-Guided Code Revision**: Before/after code improvement
  - AI-powered code analysis
  - Improvement explanations
  - Diff visualization
  - Optimization suggestions
- ✅ **Micro-Proctoring Insights Dashboard**: Behavior summary
  - Total violations count
  - Eye off-screen percentage
  - Attention level score
  - Confidence score
  - Violation pattern detection
- ✅ **Communication Metrics Analyzer**: Speech analysis
  - Filler word count and percentage
  - Clarity score
  - Structure score (STAR format detection)
  - Response time analysis
  - Answer length consistency
- ✅ **Integrity Score**: Combined analysis
  - Proctoring score
  - Code plagiarism score
  - Time consistency score
  - Window switch tracking
  - Overall integrity (0-100)
- ✅ **Multi-Round Interview Flow**: 5-round system
  - Round 1: MCQ Round
  - Round 2: Core Technical
  - Round 3: Coding Round
  - Round 4: Behavioral Round
  - Round 5: Summary
- ✅ **Interview Session Management**: Complete tracking
  - Session state management
  - Round progression
  - Skill metric tracking
  - Communication metrics
  - Proctoring metrics
  - Code attempt history

### 7. Internationalization
- ✅ Multi-language support:
  - English
  - Spanish
  - French
  - Hindi
- ✅ Language selector
- ✅ Centralized translations

### 8. Email System
- ✅ SMTP email sending
- ✅ HTML email templates
- ✅ OTP delivery
- ✅ Configurable email providers
- ✅ Console fallback (if email not configured)

---

## ⚙️ Configuration

### Environment Variables (`backend/.env`)

```env
# Google Gemini API
GOOGLE_API_KEY=your_gemini_api_key_here

# Email Configuration
ENABLE_EMAIL=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Frontend Configuration

**Environment Variables** (optional):
- `REACT_APP_API_URL`: Backend API URL (default: `http://localhost:8000`)
- `REACT_APP_WS_URL`: WebSocket URL (default: `ws://localhost:8000`)

**Port Configuration**:
- Backend: `8000` (configurable in `uvicorn` command)
- Frontend: `3000` (configurable via `PORT` env var or `package.json`)

### Test Credentials

- **Email**: `test@aptiva.ai`
- **Password**: `aptivatesting`
- **Note**: Bypasses OTP verification

---

## 📄 File Descriptions

### Backend Files

#### `main.py` (333 lines)
- FastAPI application
- All API endpoints
- WebSocket handler
- Request/response models
- CORS configuration

#### `ai_interviewer.py` (~200 lines)
- Google Gemini integration
- Conversation management
- Coding question detection
- Code evaluation
- Language detection

#### `auth.py` (~350 lines)
- User registration
- Login system
- OTP generation and verification
- Email sending
- Session management

#### `proctoring.py` (~200 lines)
- Face detection
- Violation detection
- Alert generation with cooldowns
- MediaPipe/OpenCV integration
- Startup grace period
- False positive prevention

#### `database.py` (~150 lines)
- SQLAlchemy models
- PostgreSQL/SQLite support
- User, Session, CodeAttempt models
- ResumeData, Leaderboard models

#### `resume_parser.py` (~120 lines)
- PDF parsing (pypdf + pdfminer)
- Skill extraction
- Experience extraction
- Question generation

#### `system_design.py` (~80 lines)
- Gemini Vision integration
- Architecture analysis
- Scoring system

#### `multi_file_editor.py` (~100 lines)
- Multi-file project management
- File tree navigation
- Project execution

#### `realtime_feedback.py` (~80 lines)
- Real-time code analysis
- Debounced checking
- Feedback generation

#### `gamification.py` (~100 lines)
- Leaderboard management
- Streak tracking
- User statistics

#### `code_engine.py` (~250 lines)
- Multi-language code execution
- Safe subprocess handling
- Timeout management
- SQL query execution

### Frontend Files

#### `App.js` (~400 lines)
- Main application component
- State management
- Routing logic
- WebSocket connection
- Event handlers

#### `ChatInterface.js` (~500 lines)
- Chat UI
- Message handling
- Speech integration
- Voice input/output

#### `CodeEditor.js` (~350 lines)
- Monaco editor integration
- Code execution
- Code evaluation
- Proctoring violations

#### `Login.js` (~280 lines)
- Login page
- OTP verification
- Error handling

#### `Signup.js` (~250 lines)
- Registration page
- OTP verification
- Error handling

#### `Captcha.js` (~120 lines)
- CAPTCHA component
- Math problem generation
- Verification logic

#### `speechService.js` (~200 lines)
- Web Speech API wrapper
- TTS/STT functions
- Permission handling

#### `languages.js` (~300 lines)
- Translation dictionary
- Language management
- Translation function

---

## 🔒 Security Features

### Authentication Security
- Email OTP verification
- 6-digit OTP codes
- 10-minute OTP expiry
- 3 attempt limit
- Session tokens
- Password hashing (SHA256)

### Proctoring Security
- Copy-paste blocking
- Keyboard shortcut blocking
- Tab switching detection
- Window focus detection
- Right-click blocking
- Developer tools blocking

### Code Execution Security
- Subprocess isolation
- Timeout protection
- Input validation
- Safe file handling

### Application Security
- CORS configuration
- Input sanitization
- Error handling
- CAPTCHA verification

---

## 🌍 Internationalization

### Supported Languages
1. **English (en)** - Default
2. **Spanish (es)** - Español
3. **French (fr)** - Français
4. **Hindi (hi)** - हिंदी

### Translation Keys
- Authentication (login, signup, OTP)
- Application UI (title, buttons, labels)
- Chat interface
- Code editor
- Alerts and messages
- Proctoring messages

---

## 🚀 Deployment

### Development Setup

1. **Backend**:
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate  # Windows
   pip install -r requirements.txt
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm start
   ```

### Production Considerations

- Use environment variables for secrets
- Configure proper CORS origins
- Use HTTPS
- Implement rate limiting
- Use database instead of in-memory storage
- Use JWT tokens with expiry
- Implement proper logging
- Use Docker for code execution isolation
- Configure proper email service
- Set up monitoring and alerts

---

## 📊 Statistics

- **Total Files**: ~50+ files
- **Backend Lines**: ~1,500+ lines
- **Frontend Lines**: ~3,000+ lines
- **Components**: 8 React components
- **Pages**: 2 pages (Login, Signup)
- **API Endpoints**: 15+ endpoints
- **Supported Languages**: 5 programming languages
- **UI Languages**: 4 languages
- **Dependencies**: 12 backend, 7 frontend

---

## 🎓 Learning Resources

### Technologies Used
- FastAPI: https://fastapi.tiangolo.com/
- React: https://react.dev/
- Google Gemini: https://ai.google.dev/
- Monaco Editor: https://microsoft.github.io/monaco-editor/
- OpenCV: https://opencv.org/
- MediaPipe: https://mediapipe.dev/

---

## 📝 Notes

- This is an MVP (Minimum Viable Product)
- Uses in-memory storage (not production-ready)
- Email OTP can fallback to console output
- Proctoring uses basic face detection
- Code execution is sandboxed but not fully isolated
- Test credentials bypass OTP for development

---

## 🔄 Version History

- **v0.1.0**: Initial MVP release
  - Basic AI interviewer
  - Proctoring system
  - Code execution
  - Authentication
  - Multi-language support
  - Email OTP
  - CAPTCHA verification

- **v0.2.0**: Premium Features Release (Current)
  - AI Interview Blueprint (career roadmap)
  - Personality Simulation Mode (5 styles)
  - Real-time Skill Heatmap
  - AI-Guided Code Revision
  - Micro-Proctoring Insights Dashboard
  - Communication Metrics Analyzer
  - Integrity Score system
  - Multi-Round Interview Flow
  - Interview Session Management
  - Floating UI components (video + chat)
  - Dark/Light theme toggle
  - Backend health check endpoint
  - Enhanced analytics engine
  - Code diff visualization

---

**Last Updated**: November 30, 2025
**Project Status**: Active Development - Premium Features Complete
**License**: Open Source (Educational)

---

*This digest contains every component, technology, and feature of the Aptiva project.*

