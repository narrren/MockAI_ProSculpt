from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from proctoring import Proctor
from ai_interviewer import InterviewerAI
from code_engine import execute_python_code, execute_sql_query
from auth import (
    register_user, verify_otp, login_user, verify_login_otp, 
    verify_token, TEST_EMAIL, TEST_PASSWORD
)
import cv2
import numpy as np
import base64
import os
from pydantic import BaseModel
from typing import Optional


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
print(f"InterviewerAI initialized with model: {ai.model}")
print("=" * 50)
proctor = Proctor()


class ChatMessage(BaseModel):
    message: str


class CodeRequest(BaseModel):
    code: str
    language: Optional[str] = "python"


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


# Authentication Endpoints
@app.post("/register")
async def register_endpoint(data: RegisterRequest):
    """Register a new user and send OTP"""
    result = register_user(data.email, data.name)
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
    try:
        import ollama
        response = ollama.list()
        if hasattr(response, 'models'):
            available_models = [model.model if hasattr(model, 'model') else str(model) for model in response.models]
        else:
            available_models = []
        
        return {
            "current_model": ai.model,
            "available_models": [m.split(':')[0] for m in available_models],
            "ollama_connected": True,
            "status": "ready" if ai.model in [m.split(':')[0] for m in available_models] else "model_not_found"
        }
    except Exception as e:
        return {
            "current_model": ai.model,
            "available_models": [],
            "ollama_connected": False,
            "error": str(e),
            "status": "error"
        }


@app.post("/chat")
async def chat_endpoint(data: ChatMessage):
    """Handle chat messages with the AI interviewer"""
    user_text = data.message
    response = ai.chat(user_text)
    return {"reply": response}


@app.post("/run_code")
async def run_code_endpoint(data: CodeRequest):
    """Execute Python code safely"""
    code = data.code
    language = data.language
    
    if language == "python":
        result = execute_python_code(code)
    else:
        result = {
            "status": "error",
            "output": f"Language {language} not supported yet"
        }
    return result


@app.post("/run_sql")
async def run_sql_endpoint(data: SQLRequest):
    """Execute SQL query safely"""
    query = data.query
    result = execute_sql_query(query)
    return result


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

