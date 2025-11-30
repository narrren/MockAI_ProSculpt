"""
Database Models and Connection
PostgreSQL integration for production-ready persistence
"""
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, JSON, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL from environment or default to SQLite for development
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./aptiva.db")

# Create engine
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    sessions = relationship("InterviewSession", back_populates="user")
    resume_data = relationship("ResumeData", back_populates="user", uselist=False)


class InterviewSession(Base):
    __tablename__ = "interview_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Float, nullable=True)
    interview_mode = Column(String, default="standard")
    personality = Column(String, default="professional")
    current_round = Column(Integer, default=1)
    
    # Skill scores
    problem_solving_score = Column(Float, default=0)
    communication_score = Column(Float, default=0)
    coding_quality_score = Column(Float, default=0)
    conceptual_knowledge_score = Column(Float, default=0)
    behavioral_clarity_score = Column(Float, default=0)
    
    # Communication metrics
    filler_word_count = Column(Integer, default=0)
    clarity_score = Column(Float, default=0)
    structure_score = Column(Float, default=0)
    
    # Proctoring metrics
    total_violations = Column(Integer, default=0)
    integrity_score = Column(Float, default=100)
    
    # Career blueprint
    role_compatibility = Column(String, nullable=True)
    compatibility_score = Column(Float, nullable=True)
    
    # Session data
    session_data = Column(JSON, nullable=True)  # Full session JSON
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    code_attempts = relationship("CodeAttempt", back_populates="session")
    questions = relationship("InterviewQuestion", back_populates="session")


class CodeAttempt(Base):
    __tablename__ = "code_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    code = Column(Text, nullable=False)
    language = Column(String, nullable=False)
    question = Column(Text, nullable=True)
    score = Column(Float, nullable=True)
    output = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("InterviewSession", back_populates="code_attempts")


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    round_number = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    answer_text = Column(Text, nullable=True)
    question_type = Column(String, nullable=True)  # 'coding', 'theoretical', 'behavioral'
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("InterviewSession", back_populates="questions")


class ResumeData(Base):
    __tablename__ = "resume_data"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    skills = Column(JSON, nullable=True)  # List of extracted skills
    experience = Column(JSON, nullable=True)  # Work experience
    education = Column(JSON, nullable=True)  # Education history
    raw_text = Column(Text, nullable=True)  # Full resume text
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="resume_data")


class Leaderboard(Base):
    __tablename__ = "leaderboard"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    overall_score = Column(Float, nullable=False)
    coding_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    integrity_score = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Gamification
    streak_days = Column(Integer, default=0)
    total_interviews = Column(Integer, default=0)


class UserStreak(Base):
    __tablename__ = "user_streaks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_interview_date = Column(DateTime, nullable=True)


# Initialize database
def init_db():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

