"""
Gamification System
Leaderboards, streaks, and achievements
"""
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from database import SessionLocal, Leaderboard, UserStreak, User
from sqlalchemy import desc, func


class GamificationEngine:
    """Handle gamification features"""
    
    @staticmethod
    def update_streak(user_id: int, db):
        """Update user streak"""
        today = datetime.utcnow().date()
        
        streak = db.query(UserStreak).filter(UserStreak.user_id == user_id).first()
        
        if not streak:
            streak = UserStreak(
                user_id=user_id,
                current_streak=1,
                longest_streak=1,
                last_interview_date=today
            )
            db.add(streak)
        else:
            last_date = streak.last_interview_date.date() if streak.last_interview_date else None
            
            if last_date:
                days_diff = (today - last_date).days
                
                if days_diff == 0:
                    # Same day, no change
                    pass
                elif days_diff == 1:
                    # Consecutive day
                    streak.current_streak += 1
                    if streak.current_streak > streak.longest_streak:
                        streak.longest_streak = streak.current_streak
                else:
                    # Streak broken
                    streak.current_streak = 1
            
            streak.last_interview_date = today
        
        db.commit()
        return streak
    
    @staticmethod
    def add_to_leaderboard(user_id: int, session_id: int, scores: Dict, db):
        """Add session to leaderboard"""
        leaderboard_entry = Leaderboard(
            user_id=user_id,
            session_id=session_id,
            overall_score=scores.get("overall", 0),
            coding_score=scores.get("coding", 0),
            communication_score=scores.get("communication", 0),
            integrity_score=scores.get("integrity", 100)
        )
        
        db.add(leaderboard_entry)
        db.commit()
        
        # Update user total interviews
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            # Count total interviews
            total = db.query(func.count(Leaderboard.id)).filter(
                Leaderboard.user_id == user_id
            ).scalar()
            # This would need a total_interviews field in User model
        
        return leaderboard_entry
    
    @staticmethod
    def get_leaderboard(limit: int = 10, db=None) -> List[Dict]:
        """Get top performers"""
        if not db:
            db = SessionLocal()
        
        try:
            entries = db.query(Leaderboard).order_by(
                desc(Leaderboard.overall_score)
            ).limit(limit).all()
            
            leaderboard = []
            for entry in entries:
                user = db.query(User).filter(User.id == entry.user_id).first()
                leaderboard.append({
                    "rank": len(leaderboard) + 1,
                    "user_name": user.name if user else "Anonymous",
                    "user_email": user.email if user else "",
                    "overall_score": entry.overall_score,
                    "coding_score": entry.coding_score,
                    "communication_score": entry.communication_score,
                    "integrity_score": entry.integrity_score,
                    "timestamp": entry.timestamp.isoformat()
                })
            
            return leaderboard
        finally:
            db.close()
    
    @staticmethod
    def get_user_stats(user_id: int, db) -> Dict:
        """Get user statistics"""
        streak = db.query(UserStreak).filter(UserStreak.user_id == user_id).first()
        
        # Get best scores
        best_session = db.query(Leaderboard).filter(
            Leaderboard.user_id == user_id
        ).order_by(desc(Leaderboard.overall_score)).first()
        
        # Get total interviews
        total_interviews = db.query(func.count(Leaderboard.id)).filter(
            Leaderboard.user_id == user_id
        ).scalar()
        
        return {
            "current_streak": streak.current_streak if streak else 0,
            "longest_streak": streak.longest_streak if streak else 0,
            "total_interviews": total_interviews or 0,
            "best_score": best_session.overall_score if best_session else 0,
            "average_score": 0  # Would need to calculate
        }

