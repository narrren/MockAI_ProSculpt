"""
Real-time Code Feedback
Collaborative interruption mode for pair programming simulation
"""
import google.generativeai as genai
import os
from dotenv import load_dotenv
from typing import Dict, Optional, Callable
import time

load_dotenv()


class RealtimeFeedback:
    """Provide real-time feedback during coding"""
    
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel("gemini-1.5-flash")
        else:
            self.model = None
        
        self.debounce_time = 2.0  # Wait 2 seconds after typing stops
        self.last_code_check = {}
        self.feedback_callbacks = {}
    
    def check_code(self, session_id: str, code: str, question: str, on_feedback: Optional[Callable] = None) -> Optional[Dict]:
        """Check code for issues and provide feedback"""
        if not self.model:
            return None
        
        current_time = time.time()
        
        # Debounce: only check if enough time has passed
        if session_id in self.last_code_check:
            if current_time - self.last_code_check[session_id] < self.debounce_time:
                return None
        
        self.last_code_check[session_id] = current_time
        
        try:
            prompt = f"""You are a pair programming partner reviewing code in real-time.

Question: {question}

Current Code:
```python
{code}
```

Check for:
1. Critical logic errors (not syntax - those are caught by compiler)
2. Time/space complexity issues
3. Edge cases not handled
4. Code smells or anti-patterns

If there's a critical issue that would cause the solution to fail, provide a brief, helpful interruption.
If the code looks good, return "OK".

Format:
STATUS: [ISSUE/OK]
FEEDBACK: [brief helpful comment or empty if OK]
"""
            
            response = self.model.generate_content(prompt)
            result_text = response.text
            
            # Parse response
            status = "OK"
            feedback = ""
            
            if "STATUS:" in result_text:
                status_line = [line for line in result_text.split('\n') if 'STATUS:' in line][0]
                status = status_line.split('STATUS:')[1].strip()
            
            if "FEEDBACK:" in result_text:
                feedback_line = [line for line in result_text.split('\n') if 'FEEDBACK:' in line]
                if feedback_line:
                    feedback = feedback_line[0].split('FEEDBACK:')[1].strip()
            
            if status != "OK" and feedback:
                result = {
                    "has_issue": True,
                    "feedback": feedback,
                    "severity": "warning"  # or "error" for critical
                }
                
                # Call callback if provided
                if on_feedback:
                    on_feedback(result)
                
                return result
            
            return None
        except Exception as e:
            print(f"Error in realtime feedback: {e}")
            return None

