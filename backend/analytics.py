"""
Analytics Engine
Calculates skill scores, communication metrics, and generates insights
"""
from typing import Dict, List, Optional
import re
from datetime import datetime


class AnalyticsEngine:
    """Analyzes interview data and generates metrics"""
    
    # Common filler words
    FILLER_WORDS = [
        "um", "uh", "er", "ah", "like", "you know", "so", "well", 
        "actually", "basically", "literally", "sort of", "kind of"
    ]
    
    # STAR format indicators
    STAR_INDICATORS = {
        "situation": ["situation", "context", "background", "when", "where"],
        "task": ["task", "goal", "objective", "challenge", "responsibility"],
        "action": ["action", "did", "implemented", "created", "developed", "built"],
        "result": ["result", "outcome", "impact", "achieved", "improved", "increased"]
    }
    
    @staticmethod
    def analyze_communication(text: str, response_time: float) -> Dict:
        """Analyze communication quality from text"""
        text_lower = text.lower()
        words = text.split()
        word_count = len(words)
        
        # Count filler words
        filler_count = sum(1 for filler in AnalyticsEngine.FILLER_WORDS 
                          if filler in text_lower)
        filler_percentage = (filler_count / word_count * 100) if word_count > 0 else 0
        
        # Calculate clarity score (inverse of filler words, adjusted for length)
        clarity_score = max(0, min(100, 100 - (filler_percentage * 2) - 
                                   (max(0, 50 - word_count) * 0.5)))
        
        # Check for STAR format structure
        star_score = AnalyticsEngine._detect_star_format(text)
        
        # Response time score (faster is better, but not too fast)
        if response_time < 2:
            time_score = 70  # Too fast, might be rushed
        elif response_time < 10:
            time_score = 100  # Good response time
        elif response_time < 20:
            time_score = 80  # Acceptable
        else:
            time_score = 60  # Too slow
        
        return {
            "filler_word_count": filler_count,
            "filler_percentage": round(filler_percentage, 2),
            "word_count": word_count,
            "clarity_score": round(clarity_score, 2),
            "structure_score": star_score,
            "response_time_score": round(time_score, 2),
            "average_response_time": round(response_time, 2)
        }
    
    @staticmethod
    def _detect_star_format(text: str) -> float:
        """Detect if answer follows STAR format (0-100)"""
        text_lower = text.lower()
        scores = []
        
        for component, keywords in AnalyticsEngine.STAR_INDICATORS.items():
            found = any(keyword in text_lower for keyword in keywords)
            scores.append(25 if found else 0)
        
        return sum(scores)
    
    @staticmethod
    def calculate_skill_scores(session_data: Dict) -> Dict:
        """Calculate skill scores based on interview performance"""
        skills = {
            "problem_solving": 0,
            "communication": 0,
            "coding_quality": 0,
            "conceptual_knowledge": 0,
            "behavioral_clarity": 0
        }
        
        # Problem solving: based on coding scores and approach quality
        if session_data.get("code_scores"):
            avg_code_score = sum(session_data["code_scores"]) / len(session_data["code_scores"])
            skills["problem_solving"] = avg_code_score
            skills["coding_quality"] = avg_code_score
        
        # Communication: based on communication metrics
        comm = session_data.get("communication", {})
        if comm:
            clarity = comm.get("clarity_score", 0)
            structure = comm.get("structure_score", 0)
            skills["communication"] = (clarity + structure) / 2
        
        # Conceptual knowledge: based on theoretical question performance
        # (This would need to be tracked separately in a real implementation)
        # For now, estimate from overall performance
        if session_data.get("rounds"):
            total_score = 0
            count = 0
            for round_data in session_data["rounds"].values():
                if round_data.get("score", 0) > 0:
                    total_score += round_data["score"]
                    count += 1
            if count > 0:
                skills["conceptual_knowledge"] = total_score / count
        
        # Behavioral clarity: based on communication structure
        skills["behavioral_clarity"] = comm.get("structure_score", 0) if comm else 0
        
        return skills
    
    @staticmethod
    def generate_career_blueprint(session_data: Dict) -> Dict:
        """Generate career roadmap based on interview performance"""
        skills = session_data.get("skills", {})
        weaknesses = []
        strengths = []
        recommendations = []
        
        # Identify strengths and weaknesses
        for skill, score in skills.items():
            if score >= 75:
                strengths.append({
                    "skill": skill.replace("_", " ").title(),
                    "score": score
                })
            elif score < 60:
                weaknesses.append({
                    "skill": skill.replace("_", " ").title(),
                    "score": score,
                    "gap": round(75 - score, 1)
                })
        
        # Generate recommendations
        if skills.get("coding_quality", 0) < 70:
            recommendations.append({
                "type": "course",
                "title": "Advanced Algorithms & Data Structures",
                "platform": "LeetCode / HackerRank",
                "estimated_time": "4-6 weeks",
                "priority": "high"
            })
        
        if skills.get("communication", 0) < 70:
            recommendations.append({
                "type": "course",
                "title": "Technical Communication Skills",
                "platform": "Coursera / Udemy",
                "estimated_time": "2-3 weeks",
                "priority": "medium"
            })
        
        if skills.get("conceptual_knowledge", 0) < 70:
            recommendations.append({
                "type": "practice",
                "title": "System Design Fundamentals",
                "platform": "Educative.io / Grokking",
                "estimated_time": "6-8 weeks",
                "priority": "high"
            })
        
        # Calculate job role compatibility
        avg_score = sum(skills.values()) / len(skills) if skills else 0
        if avg_score >= 85:
            role_compatibility = "Senior Engineer"
            compatibility_score = 95
        elif avg_score >= 75:
            role_compatibility = "Mid-Level Engineer"
            compatibility_score = 85
        elif avg_score >= 65:
            role_compatibility = "Junior Engineer"
            compatibility_score = 75
        else:
            role_compatibility = "Entry Level / Intern"
            compatibility_score = 60
        
        return {
            "strengths": strengths,
            "weaknesses": weaknesses,
            "recommendations": recommendations,
            "role_compatibility": role_compatibility,
            "compatibility_score": compatibility_score,
            "estimated_timeline_weeks": len(recommendations) * 4,
            "overall_assessment": "Strong candidate" if avg_score >= 75 else "Needs improvement"
        }
    
    @staticmethod
    def analyze_proctoring_behavior(proctoring_data: Dict) -> Dict:
        """Analyze proctoring data for insights"""
        total_violations = proctoring_data.get("total_violations", 0)
        violation_types = proctoring_data.get("violation_types", {})
        attention_level = proctoring_data.get("attention_level", 100)
        
        # Calculate attention score
        if total_violations == 0:
            attention_score = 100
        elif total_violations < 3:
            attention_score = 85
        elif total_violations < 5:
            attention_score = 70
        else:
            attention_score = 50
        
        # Detect patterns
        patterns = []
        if violation_types.get("head_movement", 0) > 5:
            patterns.append("Frequent head movement detected")
        if violation_types.get("multiple_faces", 0) > 0:
            patterns.append("Possible collaboration detected")
        if violation_types.get("eye_closure", 0) > 3:
            patterns.append("Low attention detected")
        
        return {
            "total_violations": total_violations,
            "attention_score": attention_score,
            "confidence_score": min(100, attention_score + (100 - total_violations * 5)),
            "patterns": patterns,
            "violation_breakdown": violation_types
        }

