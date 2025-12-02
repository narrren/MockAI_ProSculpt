from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from proctoring import Proctor
from ai_interviewer import InterviewerAI
from code_engine import execute_code, execute_sql_query
from auth import (
    register_user, verify_otp, login_user, verify_login_otp, 
    verify_token, TEST_EMAIL, TEST_PASSWORD
)
from interview_session import InterviewSession, active_sessions
from analytics import AnalyticsEngine
from personalities import get_personality_prompt, get_personality_info, list_personalities
from code_revision import CodeRevision
from database import init_db, get_db, User, InterviewSession as DBSession, ResumeData, Leaderboard, UserStreak
from resume_parser import ResumeParser
from system_design import SystemDesignAnalyzer
from multi_file_editor import MultiFileEditor
from realtime_feedback import RealtimeFeedback
from gamification import GamificationEngine
import cv2
import numpy as np
import base64
import os
from pydantic import BaseModel
from typing import Optional, Dict, List
import time
from datetime import datetime
import tempfile
from dotenv import load_dotenv
import sys
import io

# Fix Windows encoding issues for console output
# Note: We don't replace sys.stdout/stderr directly to avoid "I/O operation on closed file" errors
# Instead, we rely on safe_print() function and error message sanitization
if sys.platform == 'win32':
    # Set default encoding for new file operations
    try:
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        if hasattr(sys.stderr, 'reconfigure'):
            sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        # If reconfigure is not available, we'll use safe_print() instead
        pass

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)


app = FastAPI()

# Enable CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Initialize AI and Proctor
system_prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", "interviewer_persona.txt")
print("=" * 50)
print("Initializing InterviewerAI...")
ai = InterviewerAI(system_prompt_path=system_prompt_path)
print(f"InterviewerAI initialized with model: {ai.model_name}")
print("=" * 50)
proctor = Proctor()
code_revision = CodeRevision()
resume_parser = ResumeParser()
system_design_analyzer = SystemDesignAnalyzer()
multi_file_editor = MultiFileEditor()
realtime_feedback = RealtimeFeedback()

# Initialize database
init_db()


class ChatMessage(BaseModel):
    message: str
    user_id: Optional[str] = None  # For tracking test accounts


class CodeRequest(BaseModel):
    code: str
    language: Optional[str] = "python"

class CodeEvaluationRequest(BaseModel):
    code: str
    language: str
    question: str
    expected_output: Optional[str] = None
    user_id: Optional[str] = None


class SQLRequest(BaseModel):
    query: str


class RegisterRequest(BaseModel):
    email: str
    name: str


class OTPVerifyRequest(BaseModel):
    email: str
    otp: str


class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = None


class SystemDesignRequest(BaseModel):
    image_base64: str
    problem_statement: Optional[str] = None


class MultiFileProjectRequest(BaseModel):
    files: Dict[str, str]  # file_path -> file_content


class RealtimeCodeCheckRequest(BaseModel):
    code: str
    question: str


security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify token and return user"""
    token = credentials.credentials
    user = verify_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user


@app.get("/")
async def root():
    return {
        "message": "Aptiva API",
        "status": "running",
        "endpoints": {
            "chat": "/chat",
            "run_code": "/run_code",
            "run_sql": "/run_sql",
            "websocket": "/ws/video",
            "auth": "/register, /verify-otp, /login, /verify-login-otp"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for frontend"""
    return {
        "status": "healthy",
        "backend": "running",
        "timestamp": datetime.now().isoformat()
    }


# Authentication Endpoints
@app.post("/register")
async def register_endpoint(data: RegisterRequest):
    """Register a new user and send OTP"""
    result = register_user(data.email, data.name)
    
    # If OTP was generated but email might not have been sent, include OTP in response for testing
    # (Only if email is not configured - for development/testing purposes)
    import os
    # Only include OTP in response if email is NOT properly configured (for testing/fallback)
    from auth import ENABLE_EMAIL, EMAIL_PASSWORD, EMAIL_FROM
    email_configured = ENABLE_EMAIL and EMAIL_PASSWORD and EMAIL_FROM and EMAIL_FROM != "your-email@gmail.com" and "@" in EMAIL_FROM
    
    # Debug logging
    print(f"[API /register] Email config check:")
    print(f"[API /register]   ENABLE_EMAIL: {ENABLE_EMAIL}")
    print(f"[API /register]   EMAIL_PASSWORD set: {bool(EMAIL_PASSWORD)}")
    print(f"[API /register]   EMAIL_FROM: {EMAIL_FROM}")
    print(f"[API /register]   email_configured: {email_configured}")
    
    if result.get("status") == "success" and not email_configured:
        # Get the OTP from storage to include in response (for testing only when email not configured)
        from auth import otp_storage
        if data.email.lower().strip() in otp_storage:
            result["otp"] = otp_storage[data.email.lower().strip()]["otp"]
            result["message"] += f" (Email not configured - OTP: {result['otp']} - Check backend console for details)"
    
    return result


@app.post("/verify-otp")
async def verify_otp_endpoint(data: OTPVerifyRequest):
    """Verify OTP and create account"""
    result = verify_otp(data.email, data.otp)
    return result


def sanitize_string(s):
    """Remove all non-ASCII characters from a string"""
    if not isinstance(s, str):
        s = str(s)
    try:
        return s.encode('ascii', 'ignore').decode('ascii')
    except Exception:
        return ""

@app.post("/login")
async def login_endpoint(data: LoginRequest):
    """Login user (test credentials bypass OTP, others require OTP)"""
    try:
        # Debug logging with safe encoding
        try:
            print(f"[API /login] Received login request:")
            print(f"[API /login] Email: {data.email}")
            print(f"[API /login] Password: {'*' * len(data.password) if data.password else '(empty)'}")
        except UnicodeEncodeError:
            pass  # Skip debug logging if encoding fails
        
        # Call login_user and catch any exceptions immediately
        try:
            result = login_user(data.email, data.password or "")
        except Exception as login_error:
            # Immediately sanitize the exception before it propagates
            error_msg = sanitize_string(str(login_error))
            if not error_msg:
                error_msg = "Login failed"
            raise Exception(error_msg) from None
        
        # Only include OTP in response if email is NOT properly configured (for testing/fallback)
        from auth import ENABLE_EMAIL, EMAIL_PASSWORD, EMAIL_FROM, otp_storage
        email_configured = ENABLE_EMAIL and EMAIL_PASSWORD and EMAIL_FROM and EMAIL_FROM != "your-email@gmail.com" and "@" in EMAIL_FROM
        
        # Debug logging with safe encoding
        try:
            print(f"[API /login] Email config check:")
            print(f"[API /login]   ENABLE_EMAIL: {ENABLE_EMAIL}")
            print(f"[API /login]   EMAIL_PASSWORD set: {bool(EMAIL_PASSWORD)}")
            print(f"[API /login]   EMAIL_FROM: {EMAIL_FROM}")
            print(f"[API /login]   email_configured: {email_configured}")
        except UnicodeEncodeError:
            pass  # Skip debug logging if encoding fails
        
        if result.get("status") == "otp_required" and not email_configured:
            # Get the OTP from storage to include in response (for testing only when email not configured)
            email_lower = data.email.lower().strip()
            if email_lower in otp_storage:
                result["otp"] = otp_storage[email_lower]["otp"]
                result["message"] += f" (Email not configured - OTP: {result['otp']} - Check backend console for details)"
        
        # Sanitize ALL result fields to ensure no emojis
        if isinstance(result, dict):
            for key, value in result.items():
                if isinstance(value, str):
                    result[key] = sanitize_string(value)
                elif isinstance(value, dict):
                    for sub_key, sub_value in value.items():
                        if isinstance(sub_value, str):
                            value[sub_key] = sanitize_string(sub_value)
        
        return result
    except Exception as e:
        # Sanitize error message immediately - before any operations
        error_msg = sanitize_string(str(e))
        if not error_msg or len(error_msg.strip()) == 0:
            error_msg = "An error occurred during login. Please check backend logs."
        
        # Try to log safely
        try:
            print(f"[API /login] Error: {error_msg}")
        except Exception:
            pass  # Skip logging if it fails
        
        # Raise HTTPException with sanitized message
        raise HTTPException(status_code=500, detail=f"Internal server error: {error_msg}")


@app.post("/verify-login-otp")
async def verify_login_otp_endpoint(data: OTPVerifyRequest):
    """Verify OTP for login"""
    result = verify_login_otp(data.email, data.otp)
    return result


@app.get("/test-credentials")
async def get_test_credentials():
    """Get test credentials info (for testing only)"""
    return {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "note": "These credentials bypass OTP verification"
    }


@app.get("/ai-status")
async def get_ai_status():
    """Check AI model status"""
    import os
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    
    try:
        if not api_key:
            return {
                "current_model": ai.model_name,
                "api_configured": False,
                "status": "error",
                "message": "Google Gemini API key not configured. Set GOOGLE_API_KEY environment variable."
            }
        
        # Test API connection
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        try:
            model = genai.GenerativeModel(ai.model_name)
            # Just check if model is accessible - don't access .text to avoid errors
            test_response = model.generate_content("test", generation_config={"max_output_tokens": 1})
            # Check if response is valid (don't access .text as it might fail)
            if not test_response or not hasattr(test_response, 'candidates'):
                raise Exception("Invalid API response")
        except Exception as test_error:
            # Try fallback model
            try:
                print(f"[AI Status] Model {ai.model_name} failed, trying gemini-2.0-flash")
                model = genai.GenerativeModel("gemini-2.0-flash")
                test_response = model.generate_content("test", generation_config={"max_output_tokens": 1})
                if not test_response or not hasattr(test_response, 'candidates'):
                    raise Exception("Invalid API response")
                ai.model_name = "gemini-2.0-flash"
            except Exception as fallback_error:
                raise test_error
        
        return {
            "current_model": ai.model_name,
            "api_configured": True,
            "api_connected": True,
            "status": "ready",
            "provider": "Google Gemini"
        }
    except Exception as e:
        return {
            "current_model": ai.model_name,
            "api_configured": bool(api_key),
            "api_connected": False,
            "error": str(e),
            "status": "error",
            "provider": "Google Gemini"
        }


# Track question count for test accounts
test_account_question_count = {}  # {user_email: count}

@app.post("/chat")
async def chat_endpoint(data: ChatMessage):
    """Handle chat messages with the AI interviewer"""
    import time
    
    user_text = data.message
    start_time = time.time()
    
    # Get or create session for user
    user_id = data.user_id or "anonymous"
    is_new_session = user_id not in active_sessions
    if is_new_session:
        # Auto-create session if it doesn't exist
        active_sessions[user_id] = InterviewSession(
            user_id=user_id,
            interview_mode="standard",
            personality="professional"
        )
        # Reset AI context for new session
        ai.context = []
        print(f"[Chat] New session for {user_id}, resetting AI context")
    
    session = active_sessions[user_id]
    
    # Check if this is the first message (welcome message was already sent by frontend)
    # If user says "yes" or confirms readiness, make sure AI asks the first question
    user_text_lower = user_text.lower().strip()
    is_readiness_confirmation = any(phrase in user_text_lower for phrase in [
        "yes", "ready", "i'm ready", "im ready", "let's begin", "lets begin", 
        "sure", "okay", "ok", "yeah", "yep", "absolutely"
    ])
    
    # If it's a readiness confirmation and we have minimal context, ensure AI asks first question
    if is_readiness_confirmation and len(ai.context) <= 2:
        print(f"[Chat] User confirmed readiness, ensuring AI asks first question")
        # Reset context slightly to ensure fresh start
        if len(ai.context) > 0:
            # Keep only the welcome message if it exists
            ai.context = [msg for msg in ai.context if 'ready' in msg.get('parts', [''])[0].lower() or 'welcome' in msg.get('parts', [''])[0].lower()]
    
    # Check if this is a test account and limit questions
    is_test_account = False
    user_email = None
    
    if data.user_id:
        # Check if user is test account
        from auth import TEST_EMAIL, users_db
        user_email = data.user_id
        if user_email == TEST_EMAIL or (user_email in users_db and users_db[user_email].get("is_test", False)):
            is_test_account = True
            
            # Initialize question count if not exists
            if user_email not in test_account_question_count:
                test_account_question_count[user_email] = 0
            
            # Check if we've reached the limit (3 questions)
            # Count questions from AI responses (not user messages)
            # We'll count when AI responds, so check before generating response
            if test_account_question_count[user_email] >= 3:
                return {
                    "reply": "Thank you for testing Aptiva! You've completed the test interview with 3 questions. This is a test account limitation. For a full interview experience, please sign up with a regular account.",
                    "is_coding_question": False,
                    "suggested_language": None,
                    "test_limit_reached": True
                }
    
    # Track user response in session
    session.conversation_history.append({
        "role": "user",
        "content": user_text,
        "timestamp": time.time()
    })
    
    # Get AI response
    response = ai.chat(user_text)
    response_time = time.time() - start_time
    
    # Track AI response in session
    session.conversation_history.append({
        "role": "assistant",
        "content": response,
        "timestamp": time.time()
    })
    
    # Analyze communication metrics from user response
    comm_analysis = AnalyticsEngine.analyze_communication(user_text, response_time)
    session.communication.update({
        "filler_word_count": session.communication.get("filler_word_count", 0) + comm_analysis["filler_word_count"],
        "clarity_score": (session.communication.get("clarity_score", 0) + comm_analysis["clarity_score"]) / 2,
        "structure_score": (session.communication.get("structure_score", 0) + comm_analysis["structure_score"]) / 2,
    })
    session.record_response_time(response_time)
    
    # Update communication skill
    avg_clarity = session.communication.get("clarity_score", 0)
    avg_structure = session.communication.get("structure_score", 0)
    session.update_skill("communication", (avg_clarity + avg_structure) / 2)
    
    # Increment question count for test accounts (only for AI responses that are questions)
    # Don't count the initial welcome message - only count actual questions
    if is_test_account and user_email:
        # Check if the response is a question (contains question mark or is asking something)
        # Exclude welcome messages and greetings
        is_welcome = any(phrase in response.lower() for phrase in [
            "welcome", "hello", "hi there", "greetings", "ready to begin"
        ])
        
        if not is_welcome and ("?" in response or ai.is_coding_question(response)):
            test_account_question_count[user_email] = test_account_question_count.get(user_email, 0) + 1
            print(f"[TEST ACCOUNT] Question count for {user_email}: {test_account_question_count[user_email]}/3")
            
            # If this was the 3rd question, add a note
            if test_account_question_count[user_email] == 3:
                response += "\n\n[Note: This is your final question as a test account. After answering, the test interview will be complete.]"
    
    # Detect if the response contains a coding question
    is_coding_question = ai.is_coding_question(response)
    suggested_language = ai.detect_language_from_question(response) if is_coding_question else None
    
    # If it's a coding question, add it to the current round
    if is_coding_question:
        session.add_question(session.current_round, response)
    
    return {
        "reply": response,
        "is_coding_question": is_coding_question,
        "suggested_language": suggested_language
    }


@app.post("/run_code")
async def run_code_endpoint(data: CodeRequest):
    """Execute code in the specified language"""
    code = data.code
    language = data.language or "python"
    
    result = execute_code(code, language)
    return result


@app.post("/run_sql")
async def run_sql_endpoint(data: SQLRequest):
    """Execute SQL query safely"""
    query = data.query
    result = execute_sql_query(query)
    return result


@app.post("/evaluate_code")
async def evaluate_code_endpoint(data: CodeEvaluationRequest):
    """Evaluate if the code correctly solves the given question"""
    try:
        # Use AI to evaluate the code
        evaluation = ai.evaluate_code(
            code=data.code,
            language=data.language,
            question=data.question,
            expected_output=data.expected_output
        )
        
        # Update session with code attempt and score
        # Try to find session by user_id if provided, or use a default
        user_id = data.user_id or "anonymous"
        if user_id in active_sessions:
            session = active_sessions[user_id]
            
            # Extract score from evaluation (0-100)
            score = 0
            if evaluation.get("is_correct"):
                score = 85  # Good score for correct code
            elif "partial" in evaluation.get("feedback", "").lower():
                score = 60  # Partial credit
            else:
                score = 30  # Low score for incorrect
            
            # Add code attempt to session
            session.add_code_attempt(
                code=data.code,
                question=data.question,
                score=score,
                language=data.language
            )
            
            # Update problem solving and coding quality skills
            if session.code_scores:
                avg_score = sum(session.code_scores) / len(session.code_scores)
                session.update_skill("problem_solving", avg_score)
                session.update_skill("coding_quality", avg_score)
        
        return evaluation
    except Exception as e:
        return {
            "status": "error",
            "feedback": f"Error evaluating code: {str(e)}",
            "is_correct": False
        }


@app.post("/reset_chat")
async def reset_chat():
    """Reset the conversation context"""
    ai.reset_context()
    return {"message": "Chat context reset"}


@app.post("/report_violation")
async def report_violation(data: dict):
    """Report a proctoring violation from frontend"""
    violation_type = data.get("type")
    violation_details = data.get("details", "")
    timestamp = data.get("timestamp")
    
    # Log violation (in production, store in database)
    print(f"VIOLATION DETECTED: {violation_type} - {violation_details} at {timestamp}")
    
    return {
        "status": "recorded",
        "message": f"Violation {violation_type} has been logged"
    }


# WebSocket for Real-time Video Proctoring
@app.websocket("/ws/video")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Receive base64 frame from frontend
            data = await websocket.receive_text()
            
            # Handle base64 image data
            if data.startswith('data:image'):
                try:
                    # Extract base64 data
                    header, encoded = data.split(',', 1)
                    img_data = base64.b64decode(encoded)
                    np_arr = np.frombuffer(img_data, np.uint8)
                    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                    
                    if frame is not None and frame.size > 0:
                        # Analyze frame for proctoring violations
                        alerts = proctor.analyze_frame(frame)
                        
                        # Send back alerts if any (deduplicate to prevent spam)
                        if alerts:
                            # Filter out duplicate alerts in the same batch
                            unique_alerts = list(set(alerts))
                            await websocket.send_json({"alerts": unique_alerts})
                        # Don't send empty alerts - let frontend handle state
                    else:
                        print("Warning: Decoded frame is None or empty")
                        await websocket.send_json({"error": "Failed to decode image"})
                except Exception as e:
                    print(f"Error processing frame: {e}")
                    await websocket.send_json({"error": f"Error processing frame: {str(e)}"})
            else:
                # Handle text messages (e.g., ping/pong for connection keepalive)
                if data == "ping":
                    await websocket.send_text("pong")
                    
    except WebSocketDisconnect:
        print("Client disconnected from video stream")
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
        try:
            await websocket.close()
        except:
            pass


# ====== NEW PREMIUM FEATURES ENDPOINTS ======

class SessionRequest(BaseModel):
    user_id: str
    interview_mode: Optional[str] = "standard"
    personality: Optional[str] = "professional"

class PersonalityRequest(BaseModel):
    personality: str

class CodeRevisionRequest(BaseModel):
    code: str
    question: str
    language: Optional[str] = "python"

class ScenarioRequest(BaseModel):
    scenario_type: str  # "startup", "corporate", "conflict", "deadline"


@app.post("/session/start")
async def start_session(data: SessionRequest):
    """Start a new interview session"""
    session = InterviewSession(
        user_id=data.user_id,
        interview_mode=data.interview_mode,
        personality=data.personality
    )
    active_sessions[data.user_id] = session
    
    # Initialize AI with personality
    personality_prompt = get_personality_prompt(data.personality)
    ai.system_prompt = personality_prompt
    ai.model = None  # Force re-initialization with new prompt
    
    return {
        "session_id": session.session_id,
        "current_round": session.current_round,
        "personality": get_personality_info(data.personality)
    }


@app.get("/personalities")
async def get_personalities():
    """List all available interviewer personalities"""
    return {"personalities": list_personalities()}


@app.post("/code/improve")
async def improve_code(data: CodeRevisionRequest):
    """Get AI-guided code revision"""
    result = code_revision.improve_code(
        original_code=data.code,
        question=data.question,
        language=data.language
    )
    return result


@app.get("/session/{user_id}/skills")
async def get_skills(user_id: str):
    """Get real-time skill heatmap"""
    # Try to get active session, or create a default one
    if user_id not in active_sessions:
        # Return default empty skills if no session
        return {
            "skills": {
                "problem_solving": 0,
                "communication": 0,
                "coding_quality": 0,
                "conceptual_knowledge": 0,
                "behavioral_clarity": 0
            },
            "communication": {
                "filler_word_count": 0,
                "answer_length_avg": 0,
                "clarity_score": 0,
                "structure_score": 0,
                "response_times": []
            },
            "integrity": {
                "proctoring_score": 100,
                "code_plagiarism_score": 100,
                "time_consistency": 100,
                "window_switches": 0,
                "overall_score": 100
            }
        }
    
    session = active_sessions[user_id]
    
    # Calculate current skill scores
    session_data = session.to_dict()
    final_skills = AnalyticsEngine.calculate_skill_scores(session_data)
    session.skills.update(final_skills)
    
    return {
        "skills": session.skills,
        "communication": session.communication,
        "integrity": session.integrity
    }


@app.get("/session/{user_id}/blueprint")
async def get_career_blueprint(user_id: str):
    """Generate AI Interview Blueprint"""
    # Try to get active session, or create a default one with some data
    if user_id not in active_sessions:
        # Create a default session with minimal data for demo
        session = InterviewSession(user_id=user_id)
        # Add some default scores so blueprint can be generated
        session.skills = {
            "problem_solving": 50,
            "communication": 50,
            "coding_quality": 50,
            "conceptual_knowledge": 50,
            "behavioral_clarity": 50
        }
        active_sessions[user_id] = session
    else:
        session = active_sessions[user_id]
    
    session_data = session.to_dict()
    
    # Calculate final skill scores
    final_skills = AnalyticsEngine.calculate_skill_scores(session_data)
    session.skills.update(final_skills)
    
    # Generate blueprint
    blueprint = AnalyticsEngine.generate_career_blueprint(session.to_dict())
    session.strengths = blueprint.get("strengths", [])
    session.weaknesses = blueprint.get("weaknesses", [])
    session.recommendations = blueprint.get("recommendations", [])
    
    return blueprint


@app.get("/session/{user_id}/communication-metrics")
async def get_communication_metrics(user_id: str):
    """Get communication metrics"""
    if user_id not in active_sessions:
        return {
            "filler_word_count": 0,
            "filler_percentage": 0,
            "clarity_score": 0,
            "structure_score": 0,
            "average_response_time": 0,
            "star_format_detected": False
        }
    
    session = active_sessions[user_id]
    comm = session.communication
    
    return {
        "filler_word_count": comm.get("filler_word_count", 0),
        "filler_percentage": comm.get("filler_percentage", 0),
        "clarity_score": comm.get("clarity_score", 0),
        "structure_score": comm.get("structure_score", 0),
        "average_response_time": comm.get("answer_length_avg", 0),
        "star_format_detected": comm.get("structure_score", 0) >= 75
    }


@app.get("/session/{user_id}/integrity-score")
async def get_integrity_score(user_id: str):
    """Get integrity score"""
    if user_id not in active_sessions:
        return {
            "overall_score": 100,
            "breakdown": {
                "proctoring_score": 100,
                "code_plagiarism_score": 100,
                "time_consistency": 100,
                "window_switches": 0
            },
            "total_violations": 0
        }
    
    session = active_sessions[user_id]
    integrity = session.integrity
    proctoring = session.proctoring
    
    return {
        "overall_score": integrity.get("overall_score", 100),
        "breakdown": {
            "proctoring_score": integrity.get("proctoring_score", 100),
            "code_plagiarism_score": integrity.get("code_plagiarism_score", 100),
            "time_consistency": integrity.get("time_consistency", 100),
            "window_switches": integrity.get("window_switches", 0)
        },
        "total_violations": proctoring.get("total_violations", 0)
    }


@app.get("/session/{user_id}/proctoring-insights")
async def get_proctoring_insights(user_id: str):
    """Get proctoring insights"""
    if user_id not in active_sessions:
        return {
            "summary": {
                "total_violations": 0,
                "attention_score": 100,
                "confidence_score": 100,
                "eye_off_screen_percent": 0
            },
            "integrity_score": 100,
            "patterns": [],
            "violation_breakdown": {}
        }
    
    session = active_sessions[user_id]
    proctoring = session.proctoring
    integrity = session.integrity
    
    # Analyze proctoring behavior
    insights = AnalyticsEngine.analyze_proctoring_behavior(proctoring)
    
    return {
        "summary": {
            "total_violations": proctoring.get("total_violations", 0),
            "attention_score": insights.get("attention_score", 100),
            "confidence_score": insights.get("confidence_score", 100),
            "eye_off_screen_percent": proctoring.get("eye_off_screen_percent", 0)
        },
        "integrity_score": integrity.get("overall_score", 100),
        "patterns": insights.get("patterns", []),
        "violation_breakdown": insights.get("violation_breakdown", {})
    }


# ===== Advanced Features Endpoints =====

@app.post("/resume/upload")
async def upload_resume(file: UploadFile = File(...), user_id: str = Form(...)):
    """Upload and parse resume PDF"""
    try:
        if not user_id:
            return {
                "status": "error",
                "error": "user_id is required"
            }
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        # Parse resume
        result = resume_parser.parse_pdf(tmp_path)
        
        if result.get("error"):
            os.unlink(tmp_path)
            return {
                "status": "error",
                "error": result["error"]
            }
        
        # Get user from database by email
        db = next(get_db())
        try:
            user = db.query(User).filter(User.email == user_id.lower().strip()).first()
            if not user:
                os.unlink(tmp_path)
                return {
                    "status": "error",
                    "error": "User not found"
                }
            
            # Save or update resume data with comprehensive analysis
            resume_data = db.query(ResumeData).filter(ResumeData.user_id == user.id).first()
            
            # Prepare comprehensive resume data
            resume_dict = {
                "skills": result.get("skills", []),
                "experience": result.get("experience", []),
                "education": result.get("education", []),
                "raw_text": result.get("raw_text", ""),
                "analysis": result.get("analysis", {}),
                "summary": result.get("summary", ""),
                "certifications": result.get("certifications", []),
                "projects": result.get("projects", []),
                "contact_info": result.get("contact_info", {})
            }
            
            if resume_data:
                resume_data.skills = resume_dict["skills"]
                resume_data.experience = resume_dict["experience"]
                resume_data.education = resume_dict["education"]
                resume_data.raw_text = resume_dict["raw_text"]
                # Store additional analysis in raw_text or create a new field (for now, append to raw_text metadata)
                # In production, you might want to add separate columns for these
                resume_data.uploaded_at = datetime.now()
                print(f"[RESUME UPLOAD] Updated resume with {len(resume_dict['skills'])} skills, {len(resume_dict['experience'])} experiences")
                print(f"[RESUME UPLOAD] Analysis summary: {resume_dict.get('summary', 'N/A')[:100]}...")
            else:
                resume_data = ResumeData(
                    user_id=user.id,
                    skills=resume_dict["skills"],
                    experience=resume_dict["experience"],
                    education=resume_dict["education"],
                    raw_text=resume_dict["raw_text"],
                    uploaded_at=datetime.now()
                )
                db.add(resume_data)
                print(f"[RESUME UPLOAD] Created new resume record with {len(resume_dict['skills'])} skills")
            
            # Store additional analysis data (we'll extend the JSON fields or add metadata)
            # For now, we'll include it in the response
            
            # Mark user as having uploaded resume in auth system
            from auth import users_db
            if user.email in users_db:
                users_db[user.email]["has_resume"] = True
                users_db[user.email]["resume_uploaded_at"] = datetime.now().isoformat()
            
            db.commit()
            db.refresh(resume_data)  # Refresh to ensure data is available
            
            print(f"[RESUME UPLOAD] [OK] Resume fully analyzed and saved for user {user.email}")
            print(f"[RESUME UPLOAD]   - Skills: {len(resume_dict['skills'])}")
            print(f"[RESUME UPLOAD]   - Experience entries: {len(resume_dict['experience'])}")
            print(f"[RESUME UPLOAD]   - Education entries: {len(resume_dict['education'])}")
            print(f"[RESUME UPLOAD]   - Certifications: {len(resume_dict.get('certifications', []))}")
            print(f"[RESUME UPLOAD]   - Projects: {len(resume_dict.get('projects', []))}")
            if resume_dict.get('analysis'):
                analysis = resume_dict['analysis']
                print(f"[RESUME UPLOAD]   - Career Level: {analysis.get('career_level', 'N/A')}")
                print(f"[RESUME UPLOAD]   - Years of Experience: {analysis.get('years_of_experience', 'N/A')}")
        finally:
            db.close()
        
        # Generate interview questions based on comprehensive analysis
        questions = resume_parser.generate_interview_questions(
            resume_dict["skills"],
            resume_dict["experience"]
        )
        
        # Cleanup
        os.unlink(tmp_path)
        
        return {
            "status": "success",
            "message": "Resume uploaded and fully analyzed successfully",
            "skills": resume_dict["skills"],
            "experience": resume_dict["experience"],
            "education": resume_dict["education"],
            "summary": resume_dict.get("summary", ""),
            "analysis": resume_dict.get("analysis", {}),
            "certifications": resume_dict.get("certifications", []),
            "projects": resume_dict.get("projects", []),
            "generated_questions": questions,
            "stats": {
                "total_skills": len(resume_dict["skills"]),
                "total_experience": len(resume_dict["experience"]),
                "total_education": len(resume_dict["education"]),
                "total_certifications": len(resume_dict.get("certifications", [])),
                "total_projects": len(resume_dict.get("projects", []))
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "error": str(e)
        }


@app.get("/user/{user_id}/resume-status")
async def get_resume_status(user_id: str):
    """Check if user has uploaded a resume"""
    try:
        from auth import users_db, TEST_EMAIL
        from urllib.parse import unquote
        # FastAPI automatically decodes URL-encoded path parameters
        email = unquote(user_id).lower().strip()
        print(f"[RESUME STATUS] Received user_id: {user_id}, decoded: {email}")
        
        # For test users, check in-memory first, then database
        if email == TEST_EMAIL:
            db = next(get_db())
            try:
                user = db.query(User).filter(User.email == email).first()
                if user:
                    resume_data = db.query(ResumeData).filter(ResumeData.user_id == user.id).first()
                    return {
                        "has_resume": resume_data is not None
                    }
                # Test user not in DB yet, return False (they can upload later)
                return {
                    "has_resume": False
                }
            finally:
                db.close()
        
        # Regular user - check database
        db = next(get_db())
        try:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                return {
                    "has_resume": False,
                    "message": "User not found"
                }
            
            resume_data = db.query(ResumeData).filter(ResumeData.user_id == user.id).first()
            has_resume = resume_data is not None
            
            result = {
                "has_resume": has_resume
            }
            
            if has_resume:
                result["uploaded_at"] = resume_data.uploaded_at.isoformat() if resume_data.uploaded_at else None
                result["skills_count"] = len(resume_data.skills) if resume_data.skills else 0
            
            return result
        finally:
            db.close()
    except Exception as e:
        return {
            "has_resume": False,
            "error": str(e)
        }


@app.get("/user/{user_id}/profile")
async def get_user_profile(user_id: str):
    """Get user profile information"""
    try:
        from auth import users_db, TEST_EMAIL, hash_password
        from urllib.parse import unquote
        # FastAPI automatically decodes URL-encoded path parameters, but let's be explicit
        email = unquote(user_id).lower().strip()
        print(f"[PROFILE ENDPOINT] Received user_id: {user_id}")
        print(f"[PROFILE ENDPOINT] Decoded email: {email}")
        
        # Check if this is a test user and get from in-memory storage first
        if email == TEST_EMAIL:
            if email in users_db:
                user_data = users_db[email]
                # Try to get resume from database if user exists there
                db = next(get_db())
                try:
                    db_user = db.query(User).filter(User.email == email).first()
                    resume_data = None
                    if db_user:
                        resume_data = db.query(ResumeData).filter(ResumeData.user_id == db_user.id).first()
                    
                    profile = {
                        "status": "success",
                        "email": user_data.get("email", email),
                        "name": user_data.get("name", "Test User"),
                        "created_at": user_data.get("created_at"),
                        "last_login": user_data.get("last_login"),
                        "has_resume": resume_data is not None,
                        "is_test": True
                    }
                    
                    if resume_data:
                        profile["resume"] = {
                            "uploaded_at": resume_data.uploaded_at.isoformat() if resume_data.uploaded_at else None,
                            "skills": resume_data.skills or [],
                            "experience": resume_data.experience or [],
                            "education": resume_data.education or [],
                            "raw_text": resume_data.raw_text or ""
                        }
                    
                    return profile
                finally:
                    db.close()
            else:
                # Test user not in memory, return default profile
                return {
                    "status": "success",
                    "email": email,
                    "name": "Test User",
                    "created_at": None,
                    "last_login": None,
                    "has_resume": False,
                    "is_test": True
                }
        
        # Regular user - check database
        db = next(get_db())
        try:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                # User not in database, check if in memory (might be new)
                if email in users_db:
                    user_data = users_db[email]
                    return {
                        "status": "success",
                        "email": user_data.get("email", email),
                        "name": user_data.get("name", "User"),
                        "created_at": user_data.get("created_at"),
                        "last_login": user_data.get("last_login"),
                        "has_resume": False
                    }
                return {
                    "status": "error",
                    "message": "User not found"
                }
            
            resume_data = db.query(ResumeData).filter(ResumeData.user_id == user.id).first()
            has_resume = resume_data is not None
            
            profile = {
                "status": "success",
                "email": user.email,
                "name": user.name,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "last_login": user.last_login.isoformat() if user.last_login else None,
                "has_resume": has_resume
            }
            
            if resume_data and has_resume:
                profile["resume"] = {
                    "uploaded_at": resume_data.uploaded_at.isoformat() if resume_data.uploaded_at else None,
                    "skills": resume_data.skills or [],
                    "experience": resume_data.experience or [],
                    "education": resume_data.education or [],
                    "raw_text": resume_data.raw_text or ""
                }
                print(f"[PROFILE] [OK] Resume found for {email}")
                print(f"[PROFILE]   - Skills: {len(resume_data.skills or [])}")
                print(f"[PROFILE]   - Experience: {len(resume_data.experience or [])}")
                print(f"[PROFILE]   - Education: {len(resume_data.education or [])}")
                print(f"[PROFILE]   - Uploaded at: {resume_data.uploaded_at}")
            else:
                print(f"[PROFILE] [ERROR] No resume found for {email}")
                print(f"[PROFILE]   - User ID: {user.id}")
                print(f"[PROFILE]   - Resume data query result: {resume_data}")
            
            return profile
        finally:
            db.close()
    except Exception as e:
        import traceback
        print(f"[PROFILE ERROR] {str(e)}")
        traceback.print_exc()
        # Return a fallback profile for any user on error
        try:
            from auth import users_db, TEST_EMAIL
            from urllib.parse import unquote
            email = unquote(user_id).lower().strip()
            
            # Check in-memory storage
            if email in users_db:
                user_data = users_db[email]
                return {
                    "status": "success",
                    "email": user_data.get("email", email),
                    "name": user_data.get("name", "User"),
                    "created_at": user_data.get("created_at"),
                    "last_login": user_data.get("last_login"),
                    "has_resume": user_data.get("has_resume", False),
                    "is_test": email == TEST_EMAIL
                }
            
            # Default fallback
            return {
                "status": "success",
                "email": email,
                "name": "User",
                "created_at": None,
                "last_login": None,
                "has_resume": False
            }
        except Exception as fallback_error:
            print(f"[PROFILE FALLBACK ERROR] {str(fallback_error)}")
            return {
                "status": "error",
                "error": str(e)
            }


@app.delete("/user/{user_id}/resume")
async def delete_resume(user_id: str):
    """Delete user's resume"""
    try:
        from urllib.parse import unquote
        # FastAPI automatically decodes URL-encoded path parameters
        email = unquote(user_id).lower().strip()
        print(f"[DELETE RESUME] Received user_id: {user_id}, decoded: {email}")
        db = next(get_db())
        try:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                return {
                    "status": "error",
                    "message": "User not found"
                }
            
            resume_data = db.query(ResumeData).filter(ResumeData.user_id == user.id).first()
            if resume_data:
                db.delete(resume_data)
                db.commit()
                
                # Update auth system
                from auth import users_db
                if user.email in users_db:
                    users_db[user.email]["has_resume"] = False
                    users_db[user.email].pop("resume_uploaded_at", None)
                
                return {
                    "status": "success",
                    "message": "Resume deleted successfully"
                }
            else:
                return {
                    "status": "error",
                    "message": "No resume found"
                }
        finally:
            db.close()
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


@app.post("/system-design/analyze")
async def analyze_system_design(request: SystemDesignRequest):
    """Analyze system design diagram using Gemini Vision"""
    result = system_design_analyzer.analyze_design(
        request.image_base64,
        request.problem_statement
    )
    return result


@app.post("/multi-file/create/{session_id}")
async def create_multi_file_project(request: MultiFileProjectRequest, session_id: str):
    """Create a multi-file code project"""
    result = multi_file_editor.create_project(session_id, request.files)
    return result


@app.post("/multi-file/execute/{session_id}")
async def execute_multi_file_project(session_id: str, entry_file: str, language: str):
    """Execute a multi-file project"""
    result = multi_file_editor.execute_project(session_id, entry_file, language)
    return result


@app.get("/multi-file/tree/{session_id}")
async def get_file_tree(session_id: str):
    """Get file tree structure"""
    tree = multi_file_editor.get_file_tree(session_id)
    return {"file_tree": tree}


@app.post("/multi-file/update/{session_id}")
async def update_file(session_id: str, file_path: str, content: str):
    """Update a file in the project"""
    result = multi_file_editor.update_file(session_id, file_path, content)
    return result


@app.post("/realtime-feedback/check/{session_id}")
async def check_realtime_feedback(request: RealtimeCodeCheckRequest, session_id: str):
    """Check code for real-time feedback"""
    result = realtime_feedback.check_code(
        session_id,
        request.code,
        request.question
    )
    if result:
        return result
    return {"has_issue": False}


@app.get("/leaderboard")
async def get_leaderboard(limit: int = 10):
    """Get global leaderboard"""
    leaderboard = GamificationEngine.get_leaderboard(limit)
    return {"leaderboard": leaderboard}


@app.get("/user/stats/{user_id}")
async def get_user_stats(user_id: int):
    """Get user statistics and streaks"""
    db = next(get_db())
    try:
        stats = GamificationEngine.get_user_stats(user_id, db)
        return stats
    finally:
        db.close()


@app.post("/session/{session_id}/complete")
async def complete_session(session_id: str, user_id: int):
    """Complete session and update leaderboard/streaks"""
    db = next(get_db())
    try:
        # Get session
        session = active_sessions.get(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Calculate scores
        scores = {
            "overall": (
                session.skill_scores.get("problem_solving", 0) +
                session.skill_scores.get("communication", 0) +
                session.skill_scores.get("coding_quality", 0)
            ) / 3,
            "coding": session.skill_scores.get("coding_quality", 0),
            "communication": session.skill_scores.get("communication", 0),
            "integrity": session.integrity_score
        }
        
        # Add to leaderboard
        db_session = db.query(DBSession).filter(DBSession.session_id == session_id).first()
        if db_session:
            GamificationEngine.add_to_leaderboard(user_id, db_session.id, scores, db)
        
        # Update streak
        GamificationEngine.update_streak(user_id, db)
        
        return {"status": "success", "scores": scores}
    finally:
        db.close()


@app.post("/api/heygen/token")
async def get_heygen_token():
    """Get HeyGen session token"""
    try:
        import os
        from dotenv import load_dotenv
        
        # Reload .env to get latest values
        env_path = os.path.join(os.path.dirname(__file__), '.env')
        load_dotenv(dotenv_path=env_path, override=True)
        
        heygen_api_key = os.getenv("HEYGEN_API_KEY")
        
        # Debug: Log API key status (without exposing full key)
        if heygen_api_key:
            key_preview = heygen_api_key[:20] + "..." + heygen_api_key[-10:] if len(heygen_api_key) > 30 else "***"
            print(f"[HEYGEN TOKEN] API key loaded: {key_preview} (length: {len(heygen_api_key)})")
        else:
            print(f"[HEYGEN TOKEN] WARNING: API key not found in environment!")
        
        if not heygen_api_key:
            error_msg = "HeyGen API key not configured. Please add HEYGEN_API_KEY to backend/.env"
            print(f"[HEYGEN TOKEN] {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)
        
        # Get session token from HeyGen
        import httpx
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "https://api.heygen.com/v1/streaming.create_token",
                headers={
                    "Content-Type": "application/json",
                    "X-Api-Key": heygen_api_key,
                },
            )
            
            if response.status_code == 401:
                error_msg = "HeyGen API key is invalid or expired. Please check your HEYGEN_API_KEY in backend/.env"
                print(f"[HEYGEN TOKEN] {error_msg}")
                raise HTTPException(status_code=401, detail=error_msg)
            
            if response.status_code != 200:
                error_text = response.text[:200] if hasattr(response, 'text') else "Unknown error"
                error_msg = f"Failed to get HeyGen token: HTTP {response.status_code} - {error_text}"
                print(f"[HEYGEN TOKEN] {error_msg}")
                raise HTTPException(status_code=response.status_code, detail=error_msg)
            
            data = response.json()
            token = data.get("data", {}).get("token")
            
            if not token:
                error_msg = f"HeyGen API returned invalid response: {data}"
                print(f"[HEYGEN TOKEN] {error_msg}")
                raise HTTPException(status_code=500, detail="HeyGen API returned invalid response")
            
            print(f"[HEYGEN TOKEN] Success: Token obtained (length: {len(token)})")
            return {"token": token}
            
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e).encode('ascii', 'ignore').decode('ascii')
        print(f"[HEYGEN TOKEN ERROR] {error_msg}")
        raise HTTPException(status_code=500, detail=f"Error getting HeyGen token: {error_msg}")


class HeyGenStartRequest(BaseModel):
    session_id: str
    session_token: str

@app.post("/api/heygen/start")
async def start_heygen_session(data: HeyGenStartRequest):
    """Start HeyGen streaming session (proxied to use API key server-side)"""
    try:
        import os
        from dotenv import load_dotenv
        
        # Reload .env to get latest values
        env_path = os.path.join(os.path.dirname(__file__), '.env')
        load_dotenv(dotenv_path=env_path, override=True)
        
        heygen_api_key = os.getenv("HEYGEN_API_KEY")
        
        if not heygen_api_key:
            raise HTTPException(status_code=500, detail="HeyGen API key not configured")
        
        # Use API key directly for streaming.start (more reliable than session token)
        import httpx
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "https://api.heygen.com/v1/streaming.start",
                headers={
                    "Content-Type": "application/json",
                    "X-Api-Key": heygen_api_key,  # Use API key instead of session token
                },
                json={"session_id": data.session_id},
            )
            
            if response.status_code == 401:
                error_detail = response.json().get("detail", "Unauthorized")
                raise HTTPException(status_code=401, detail=f"HeyGen API authentication failed: {error_detail}. Check your API key.")
            
            if response.status_code != 200:
                error_detail = response.text()
                raise HTTPException(status_code=response.status_code, detail=f"Failed to start HeyGen session: {error_detail}")
            
            result = response.json()
            print(f"[HEYGEN START] Session {data.session_id} started successfully")
            return {"status": "success", "data": result}
            
    except HTTPException as he:
        print(f"[HEYGEN START ERROR] {he.detail}")
        raise he
    except Exception as e:
        error_msg = str(e).encode('ascii', 'ignore').decode('ascii')
        print(f"[HEYGEN START ERROR] {error_msg}")
        raise HTTPException(status_code=500, detail=f"Error starting HeyGen session: {error_msg}")

@app.post("/api/heygen/stop-all")
async def stop_all_heygen_sessions():
    """Stop all active HeyGen sessions for this API key (helps with concurrent limit)"""
    try:
        import os
        from dotenv import load_dotenv
        
        # Reload .env to get latest values
        env_path = os.path.join(os.path.dirname(__file__), '.env')
        load_dotenv(dotenv_path=env_path, override=True)
        
        heygen_api_key = os.getenv("HEYGEN_API_KEY")
        
        if not heygen_api_key:
            raise HTTPException(status_code=500, detail="HeyGen API key not configured")
        
        # Get a fresh token to stop sessions
        import httpx
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Get token
            token_response = await client.post(
                "https://api.heygen.com/v1/streaming.create_token",
                headers={
                    "Content-Type": "application/json",
                    "X-Api-Key": heygen_api_key,
                },
            )
            
            if token_response.status_code != 200:
                # If we can't get a token, we can't stop sessions
                print(f"[HEYGEN STOP-ALL] Could not get token: {token_response.status_code}")
                return {"status": "warning", "message": "Could not get token to stop sessions"}
            
            token_data = token_response.json()
            token = token_data.get("data", {}).get("token")
            
            if not token:
                return {"status": "warning", "message": "Invalid token response"}
            
            # Note: HeyGen doesn't have a "list all sessions" endpoint
            # So we can't automatically stop all sessions
            # But we can return success to indicate we're ready for a new session
            print(f"[HEYGEN STOP-ALL] Ready for new session (token obtained)")
            return {"status": "success", "message": "Ready for new session. Please ensure old sessions are closed."}
    
    except Exception as e:
        error_msg = str(e).encode('ascii', 'ignore').decode('ascii')
        print(f"[HEYGEN STOP-ALL ERROR] {error_msg}")
        return {"status": "error", "message": f"Error: {error_msg}"}

@app.post("/api/heygen/stop")
async def stop_heygen_session(session_id: str):
    """Stop/close a HeyGen streaming session"""
    try:
        import os
        from dotenv import load_dotenv
        
        # Reload .env to get latest values
        env_path = os.path.join(os.path.dirname(__file__), '.env')
        load_dotenv(dotenv_path=env_path, override=True)
        
        heygen_api_key = os.getenv("HEYGEN_API_KEY")
        
        if not heygen_api_key:
            raise HTTPException(status_code=500, detail="HeyGen API key not configured")
        
        # Stop the session
        import httpx
        async with httpx.AsyncClient(timeout=10.0) as client:
            # First get a token
            token_response = await client.post(
                "https://api.heygen.com/v1/streaming.create_token",
                headers={
                    "Content-Type": "application/json",
                    "X-Api-Key": heygen_api_key,
                },
            )
            
            if token_response.status_code != 200:
                raise HTTPException(status_code=token_response.status_code, detail="Failed to get session token")
            
            token_data = token_response.json()
            token = token_data.get("data", {}).get("token")
            
            if not token:
                raise HTTPException(status_code=500, detail="Invalid token response")
            
            # Stop the session
            stop_response = await client.post(
                "https://api.heygen.com/v1/streaming.stop",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}",
                },
                json={"session_id": session_id},
            )
            
            if stop_response.status_code == 200:
                print(f"[HEYGEN STOP] Session {session_id} stopped successfully")
                return {"status": "success", "message": "Session stopped"}
            else:
                error_text = stop_response.text[:200] if hasattr(stop_response, 'text') else "Unknown error"
                print(f"[HEYGEN STOP] Failed to stop session: {stop_response.status_code} - {error_text}")
                return {"status": "error", "message": f"Failed to stop session: {error_text}"}
            
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e).encode('ascii', 'ignore').decode('ascii')
        print(f"[HEYGEN STOP ERROR] {error_msg}")
        raise HTTPException(status_code=500, detail=f"Error stopping HeyGen session: {error_msg}")


class HeyGenTaskRequest(BaseModel):
    session_id: str
    text: str
    task_type: str = "repeat"


@app.post("/api/heygen/task")
async def send_heygen_task(data: HeyGenTaskRequest):
    """Send text to HeyGen avatar to speak (proxied to use fresh token server-side)"""
    try:
        import os
        from dotenv import load_dotenv
        
        # Reload .env to get latest values
        env_path = os.path.join(os.path.dirname(__file__), '.env')
        load_dotenv(dotenv_path=env_path, override=True)
        
        heygen_api_key = os.getenv("HEYGEN_API_KEY")
        
        if not heygen_api_key:
            raise HTTPException(status_code=500, detail="HeyGen API key not configured")
        
        # Get a fresh session token for this request
        import httpx
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Get fresh token
            token_response = await client.post(
                "https://api.heygen.com/v1/streaming.create_token",
                headers={
                    "Content-Type": "application/json",
                    "X-Api-Key": heygen_api_key,
                },
            )
            
            if token_response.status_code == 401:
                error_detail = token_response.json().get("detail", "Unauthorized")
                raise HTTPException(status_code=401, detail=f"HeyGen API key authentication failed: {error_detail}")
            
            if token_response.status_code != 200:
                error_detail = token_response.text()
                raise HTTPException(status_code=token_response.status_code, detail=f"Failed to get session token: {error_detail}")
            
            token_data = token_response.json()
            token = token_data.get("data", {}).get("token")
            
            if not token:
                raise HTTPException(status_code=500, detail="Invalid token response")
            
            # Send task using API key directly (more reliable, same as streaming.start)
            # Try with API key first, fallback to token if needed
            task_response = await client.post(
                "https://api.heygen.com/v1/streaming.task",
                headers={
                    "Content-Type": "application/json",
                    "X-Api-Key": heygen_api_key,  # Use API key directly like streaming.start
                },
                json={
                    "session_id": data.session_id,
                    "text": data.text,
                    "task_type": data.task_type,
                },
            )
            
            # If API key doesn't work, try with token as fallback
            if task_response.status_code == 401:
                print(f"[HEYGEN TASK] API key auth failed, trying with token...")
                task_response = await client.post(
                    "https://api.heygen.com/v1/streaming.task",
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {token}",
                    },
                    json={
                        "session_id": data.session_id,
                        "text": data.text,
                        "task_type": data.task_type,
                    },
                )
            
            if task_response.status_code == 401:
                error_detail = task_response.json().get("detail", "Unauthorized")
                raise HTTPException(status_code=401, detail=f"HeyGen API authentication failed: {error_detail}")
            
            if task_response.status_code != 200:
                error_detail = task_response.text()
                raise HTTPException(status_code=task_response.status_code, detail=f"Failed to send task: {error_detail}")
            
            result = task_response.json()
            print(f"[HEYGEN TASK] Text sent to session {data.session_id}: {data.text[:50]}...")
            return {"status": "success", "data": result}
            
    except HTTPException as he:
        print(f"[HEYGEN TASK ERROR] {he.detail}")
        raise he
    except Exception as e:
        error_msg = str(e).encode('ascii', 'ignore').decode('ascii')
        print(f"[HEYGEN TASK ERROR] {error_msg}")
        raise HTTPException(status_code=500, detail=f"Error sending task to HeyGen: {error_msg}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

