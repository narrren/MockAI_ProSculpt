"""
System Design Whiteboard
AI-powered architecture critique using Gemini Vision
"""
import google.generativeai as genai
import os
import base64
from dotenv import load_dotenv
from typing import Dict, Optional, List

load_dotenv()


class SystemDesignAnalyzer:
    """Analyze system design diagrams using Gemini Vision"""
    
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            # Use Gemini 1.5 Pro or Flash for vision
            self.model = genai.GenerativeModel("gemini-1.5-flash")
        else:
            self.model = None
    
    def analyze_design(self, image_base64: str, problem_statement: str) -> Dict:
        """Analyze a system design diagram"""
        if not self.model:
            return {
                "error": "AI model not configured",
                "feedback": [],
                "score": 0
            }
        
        try:
            # Decode base64 image
            image_data = base64.b64decode(image_base64.split(',')[1] if ',' in image_base64 else image_base64)
            
            # Create prompt
            prompt = f"""You are a Senior System Architect reviewing a system design diagram.

Problem Statement: {problem_statement}

Please analyze this system design diagram and provide:
1. Architecture correctness (are components placed correctly?)
2. Missing components (what's missing?)
3. Scalability concerns
4. Best practices violations
5. Overall score (0-100)

Format your response as:
SCORE: [0-100]
FEEDBACK:
1. [feedback point 1]
2. [feedback point 2]
...
"""
            
            # Use Gemini Vision API
            response = self.model.generate_content([
                prompt,
                {
                    "mime_type": "image/png",
                    "data": image_data
                }
            ])
            
            result_text = response.text
            
            # Parse response
            score = self._extract_score(result_text)
            feedback = self._extract_feedback(result_text)
            
            return {
                "score": score,
                "feedback": feedback,
                "raw_response": result_text
            }
        except Exception as e:
            return {
                "error": str(e),
                "feedback": [],
                "score": 0
            }
    
    def _extract_score(self, text: str) -> int:
        """Extract score from response"""
        import re
        match = re.search(r'SCORE:\s*(\d+)', text, re.IGNORECASE)
        if match:
            return int(match.group(1))
        return 0
    
    def _extract_feedback(self, text: str) -> List[str]:
        """Extract feedback points from response"""
        feedback = []
        lines = text.split('\n')
        in_feedback = False
        
        for line in lines:
            if 'FEEDBACK:' in line.upper():
                in_feedback = True
                continue
            if in_feedback and line.strip():
                # Remove numbering
                clean_line = re.sub(r'^\d+[\.\)]\s*', '', line.strip())
                if clean_line:
                    feedback.append(clean_line)
        
        return feedback if feedback else ["No specific feedback provided"]

