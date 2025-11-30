from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException, Depends
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
import cv2
import numpy as np
import base64
import os
from pydantic import BaseModel
from typing import Optional, Dict
import time
from datetime import datetime


app = FastAPI()

# Enable CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


class ChatMessage(BaseModel):
    message: str


class CodeRequest(BaseModel):
    code: str
    language: Optional[str] = "python"

class CodeEvaluationRequest(BaseModel):
    code: str
    language: str
    question: str
    expected_output: Optional[str] = None


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
        "message": "MockAI ProSculpt API",
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
    from auth import ENABLE_EMAIL, EMAIL_PASSWORD, EMAIL_FROM
    if result.get("status") == "success" and (not ENABLE_EMAIL or not EMAIL_PASSWORD or EMAIL_FROM == "your-email@gmail.com"):
        # Get the OTP from storage to include in response (for testing only)
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


@app.post("/login")
async def login_endpoint(data: LoginRequest):
    """Login user (test credentials bypass OTP, others require OTP)"""
    result = login_user(data.email, data.password or "")
    
    # If OTP was generated but email might not have been sent, include OTP in response for testing
    from auth import ENABLE_EMAIL, EMAIL_PASSWORD, EMAIL_FROM, otp_storage
    if result.get("status") == "otp_required" and (not ENABLE_EMAIL or not EMAIL_PASSWORD or EMAIL_FROM == "your-email@gmail.com"):
        # Get the OTP from storage to include in response (for testing only)
        email_lower = data.email.lower().strip()
        if email_lower in otp_storage:
            result["otp"] = otp_storage[email_lower]["otp"]
            result["message"] += f" (Email not configured - OTP: {result['otp']} - Check backend console for details)"
    
    return result


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
        model = genai.GenerativeModel(ai.model_name)
        # Just check if model is accessible
        test_response = model.generate_content("test", generation_config={"max_output_tokens": 1})
        
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


@app.post("/chat")
async def chat_endpoint(data: ChatMessage):
    """Handle chat messages with the AI interviewer"""
    user_text = data.message
    response = ai.chat(user_text)
    
    # Detect if the response contains a coding question
    is_coding_question = ai.is_coding_question(response)
    suggested_language = ai.detect_language_from_question(response) if is_coding_question else None
    
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
                        
                        # Send back alerts if any
                        if alerts:
                            await websocket.send_json({"alerts": alerts})
                        # Also send empty alerts to clear previous ones
                        else:
                            await websocket.send_json({"alerts": []})
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
    if user_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[user_id]
    return {
        "skills": session.skills,
        "communication": session.communication,
        "integrity": session.integrity
    }


@app.get("/session/{user_id}/blueprint")
async def get_career_blueprint(user_id: str):
    """Generate AI Interview Blueprint"""
    if user_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

