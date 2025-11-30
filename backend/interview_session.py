"""
Interview Session Manager
Tracks interview state, rounds, scores, and metrics
"""
from typing import Dict, List, Optional
from datetime import datetime
import json


class InterviewSession:
    def __init__(self, user_id: str, interview_mode: str = "standard", personality: str = "professional"):
        self.user_id = user_id
        self.session_id = f"{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.start_time = datetime.now()
        self.interview_mode = interview_mode  # "standard", "multi-round", "scenario"
        self.personality = personality  # "professional", "tough", "friendly", "rapid-fire", "architect"
        
        # Round management
        self.current_round = 1
        self.rounds = {
            1: {"name": "MCQ Round", "status": "pending", "questions": [], "score": 0},
            2: {"name": "Core Technical", "status": "pending", "questions": [], "score": 0},
            3: {"name": "Coding Round", "status": "pending", "questions": [], "score": 0},
            4: {"name": "Behavioral Round", "status": "pending", "questions": [], "score": 0},
            5: {"name": "Summary", "status": "pending", "questions": [], "score": 0}
        }
        
        # Skill metrics (0-100)
        self.skills = {
            "problem_solving": 0,
            "communication": 0,
            "coding_quality": 0,
            "conceptual_knowledge": 0,
            "behavioral_clarity": 0
        }
        
        # Communication metrics
        self.communication = {
            "filler_word_count": 0,
            "answer_length_avg": 0,
            "clarity_score": 0,
            "structure_score": 0,
            "tone_score": 0,
            "response_times": []
        }
        
        # Proctoring metrics
        self.proctoring = {
            "total_violations": 0,
            "eye_off_screen_percent": 0,
            "attention_level": 100,
            "confidence_score": 0,
            "violation_types": {},
            "timeline": []
        }
        
        # Code analysis
        self.code_attempts = []
        self.code_scores = []
        self.hints_used = 0
        
        # Integrity score components
        self.integrity = {
            "proctoring_score": 100,
            "code_plagiarism_score": 100,
            "time_consistency": 100,
            "window_switches": 0,
            "overall_score": 100
        }
        
        # Interview data
        self.conversation_history = []
        self.strengths = []
        self.weaknesses = []
        self.recommendations = []
        
    def start_round(self, round_number: int):
        """Start a new interview round"""
        if round_number in self.rounds:
            self.current_round = round_number
            self.rounds[round_number]["status"] = "active"
            self.rounds[round_number]["start_time"] = datetime.now().isoformat()
            return True
        return False
    
    def complete_round(self, round_number: int, score: float):
        """Mark a round as complete"""
        if round_number in self.rounds:
            self.rounds[round_number]["status"] = "completed"
            self.rounds[round_number]["score"] = score
            self.rounds[round_number]["end_time"] = datetime.now().isoformat()
            return True
        return False
    
    def add_question(self, round_number: int, question: str, answer: Optional[str] = None):
        """Add a question to a round"""
        if round_number in self.rounds:
            self.rounds[round_number]["questions"].append({
                "question": question,
                "answer": answer,
                "timestamp": datetime.now().isoformat()
            })
    
    def update_skill(self, skill_name: str, value: float):
        """Update a skill score (0-100)"""
        if skill_name in self.skills:
            self.skills[skill_name] = max(0, min(100, value))
    
    def record_response_time(self, time_seconds: float):
        """Record time taken to respond"""
        self.communication["response_times"].append(time_seconds)
        if len(self.communication["response_times"]) > 0:
            avg = sum(self.communication["response_times"]) / len(self.communication["response_times"])
            self.communication["answer_length_avg"] = avg
    
    def record_violation(self, violation_type: str):
        """Record a proctoring violation"""
        self.proctoring["total_violations"] += 1
        if violation_type not in self.proctoring["violation_types"]:
            self.proctoring["violation_types"][violation_type] = 0
        self.proctoring["violation_types"][violation_type] += 1
        self._update_integrity_score()
    
    def record_window_switch(self):
        """Record a window/tab switch"""
        self.integrity["window_switches"] += 1
        self._update_integrity_score()
    
    def add_code_attempt(self, code: str, question: str, score: float, language: str):
        """Record a code attempt"""
        self.code_attempts.append({
            "code": code,
            "question": question,
            "score": score,
            "language": language,
            "timestamp": datetime.now().isoformat()
        })
        self.code_scores.append(score)
        if len(self.code_scores) > 0:
            avg_score = sum(self.code_scores) / len(self.code_scores)
            self.update_skill("coding_quality", avg_score)
    
    def _update_integrity_score(self):
        """Calculate overall integrity score"""
        # Proctoring score (decreases with violations)
        violation_penalty = min(50, self.proctoring["total_violations"] * 5)
        self.integrity["proctoring_score"] = max(0, 100 - violation_penalty)
        
        # Window switch penalty
        switch_penalty = min(30, self.integrity["window_switches"] * 3)
        
        # Overall integrity (weighted average)
        self.integrity["overall_score"] = max(0, min(100, 
            (self.integrity["proctoring_score"] * 0.6) +
            (self.integrity["code_plagiarism_score"] * 0.2) +
            (self.integrity["time_consistency"] * 0.2) - switch_penalty
        ))
    
    def get_summary(self) -> Dict:
        """Get complete interview summary"""
        end_time = datetime.now()
        duration = (end_time - self.start_time).total_seconds() / 60  # minutes
        
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "duration_minutes": round(duration, 2),
            "start_time": self.start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "interview_mode": self.interview_mode,
            "personality": self.personality,
            "current_round": self.current_round,
            "rounds": self.rounds,
            "skills": self.skills,
            "communication": self.communication,
            "proctoring": self.proctoring,
            "integrity": self.integrity,
            "code_attempts_count": len(self.code_attempts),
            "average_code_score": sum(self.code_scores) / len(self.code_scores) if self.code_scores else 0,
            "strengths": self.strengths,
            "weaknesses": self.weaknesses,
            "recommendations": self.recommendations
        }
    
    def to_dict(self) -> Dict:
        """Convert session to dictionary for storage"""
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "start_time": self.start_time.isoformat(),
            "interview_mode": self.interview_mode,
            "personality": self.personality,
            "current_round": self.current_round,
            "rounds": self.rounds,
            "skills": self.skills,
            "communication": self.communication,
            "proctoring": self.proctoring,
            "integrity": self.integrity,
            "code_attempts": self.code_attempts,
            "code_scores": self.code_scores,
            "conversation_history": self.conversation_history,
            "strengths": self.strengths,
            "weaknesses": self.weaknesses,
            "recommendations": self.recommendations
        }


# Global session storage (in-memory for MVP)
active_sessions: Dict[str, InterviewSession] = {}

