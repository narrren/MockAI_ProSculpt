import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables from backend directory
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)


class InterviewerAI:
    def __init__(self, system_prompt_path=None):
        self.context = []  # Memory of the conversation
        self.model_name = "gemini-2.5-flash"  # Default Gemini model (fast and efficient)
        
        # Get API key from environment variable
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        
        if not api_key:
            print("WARNING: GOOGLE_API_KEY or GEMINI_API_KEY not found in environment variables!")
            print("Please set your Google Gemini API key:")
            print("1. Get API key from: https://makersuite.google.com/app/apikey")
            print("2. Set it as environment variable: GOOGLE_API_KEY=your_key_here")
            print("3. Or create a .env file in the backend directory with: GOOGLE_API_KEY=your_key_here")
        else:
            genai.configure(api_key=api_key)
            print(f"[InterviewerAI.__init__] Configured Google Gemini API")
        
        # Load system prompt from file if provided, otherwise use default
        if system_prompt_path and os.path.exists(system_prompt_path):
            with open(system_prompt_path, 'r', encoding='utf-8') as f:
                self.system_prompt = f.read()
        else:
            self.system_prompt = """
You are a Senior Technical Interviewer at ProSculpt. 
You are interviewing a Fresh Engineering Graduate.

Rules:
1. Ask one question at a time.
2. If I ask for a coding problem, give a Problem Statement.
3. If the user answers, evaluate it (Technical & Communication).
4. Be strict but encouraging.
5. Focus on fundamental concepts: Data Structures, Algorithms, System Design, and Programming Languages.
6. Provide constructive feedback on answers.
7. If the candidate asks for hints, provide subtle guidance without giving away the answer.
8. After each coding solution, ask about time complexity and space complexity.
"""
        
        # Initialize the model (will be done lazily in chat() to ensure API key is set)
        self.model = None
        print(f"[InterviewerAI.__init__] Will initialize Gemini model: {self.model_name} on first chat")

    def chat(self, user_input):
        if not self.model:
            api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
            if not api_key:
                return "Error: Google Gemini API key not configured. Please set GOOGLE_API_KEY environment variable. Get your API key from https://makersuite.google.com/app/apikey"
            try:
                genai.configure(api_key=api_key)
                # Initialize model with system instruction
                generation_config = {
                    "temperature": 0.7,
                    "top_p": 0.8,
                    "top_k": 40,
                }
                self.model = genai.GenerativeModel(
                    self.model_name,
                    system_instruction=self.system_prompt,
                    generation_config=generation_config
                )
            except Exception as e:
                return f"Error initializing Gemini: {str(e)}"
        
        try:
            # Build conversation history for Gemini
            # Convert our context format to Gemini's format
            history = []
            for msg in self.context:
                if msg['role'] == 'user':
                    history.append({
                        'role': 'user',
                        'parts': msg['parts']
                    })
                elif msg['role'] == 'model':
                    history.append({
                        'role': 'model',
                        'parts': msg['parts']
                    })
            
            # Generate response using Gemini
            print(f"Calling Gemini API with model: {self.model_name}")
            
            # If we have history, use chat, otherwise use generate_content
            if history:
                chat = self.model.start_chat(history=history)
                response = chat.send_message(user_input)
            else:
                # First message - use generate_content directly
                response = self.model.generate_content(user_input)
            
            ai_reply = response.text
            
            # Add to context
            self.context.append({'role': 'user', 'parts': [user_input]})
            self.context.append({'role': 'model', 'parts': [ai_reply]})
            
            print(f"Got response from Gemini (length: {len(ai_reply)} chars)")
            return ai_reply
            
        except Exception as e:
            error_str = str(e)
            print(f"Error with Gemini API: {error_str}")
            
            # Provide helpful error messages
            if "API_KEY" in error_str or "api key" in error_str.lower():
                error_msg = "Error: Invalid or missing Google Gemini API key. Please set GOOGLE_API_KEY environment variable. Get your API key from https://makersuite.google.com/app/apikey"
            elif "quota" in error_str.lower() or "rate limit" in error_str.lower():
                error_msg = "Error: API quota exceeded or rate limit reached. Please check your Google Cloud billing and quotas."
            elif "permission" in error_str.lower() or "forbidden" in error_str.lower():
                error_msg = "Error: API key does not have permission. Please check your API key permissions."
            else:
                error_msg = f"Error connecting to Google Gemini: {error_str}. Please check your API key and internet connection."
            
            return error_msg

    def reset_context(self):
        """Reset the conversation context"""
        self.context = []

    def set_model(self, model_name):
        """Change the Gemini model"""
        self.model_name = model_name
        try:
            self.model = genai.GenerativeModel(self.model_name)
            print(f"Switched to Gemini model: {model_name}")
        except Exception as e:
            print(f"Error switching model: {e}")
    
    def is_coding_question(self, text):
        """Detect if the text contains a coding question"""
        coding_keywords = [
            'write', 'code', 'implement', 'function', 'algorithm', 'program',
            'solve', 'create', 'develop', 'build', 'class', 'method',
            'array', 'list', 'tree', 'graph', 'sort', 'search',
            'leetcode', 'hackerrank', 'coding challenge', 'programming problem'
        ]
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in coding_keywords)
    
    def detect_language_from_question(self, text):
        """Detect the programming language from the question"""
        text_lower = text.lower()
        
        # Language detection keywords
        language_hints = {
            'python': ['python', 'py', 'def ', 'import ', 'print('],
            'javascript': ['javascript', 'js', 'node', 'function(', 'const ', 'let ', 'var '],
            'java': ['java', 'public class', 'public static', 'main method'],
            'cpp': ['c++', 'cpp', '#include', 'int main', 'std::'],
            'c': ['c program', '#include <stdio.h>', 'int main()']
        }
        
        for lang, keywords in language_hints.items():
            if any(keyword in text_lower for keyword in keywords):
                return lang
        
        # Default to Python if no language detected
        return 'python'
    
    def evaluate_code(self, code, language, question, expected_output=None):
        """Evaluate if the code correctly solves the given question"""
        if not self.model:
            api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
            if not api_key:
                return {
                    "status": "error",
                    "feedback": "API key not configured",
                    "is_correct": False
                }
            try:
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel(
                    self.model_name,
                    system_instruction=self.system_prompt
                )
            except Exception as e:
                return {
                    "status": "error",
                    "feedback": f"Error initializing model: {str(e)}",
                    "is_correct": False
                }
        
        try:
            evaluation_prompt = f"""You are evaluating a coding solution. Determine if the code correctly solves the problem.

Question/Problem Statement:
{question}

Code written by candidate ({language}):
```{language}
{code}
```

{"Expected Output: " + expected_output if expected_output else ""}

Please evaluate:
1. Does the code solve the problem correctly?
2. Are there any logical errors?
3. Is the code efficient?
4. Are there any edge cases not handled?

Respond in JSON format:
{{
    "is_correct": true/false,
    "score": 0-100,
    "feedback": "detailed feedback",
    "strengths": ["list of strengths"],
    "improvements": ["list of improvements"],
    "test_cases_passed": "X/Y"
}}
"""
            
            response = self.model.generate_content(evaluation_prompt)
            feedback_text = response.text
            
            # Try to parse JSON from response
            try:
                import json
                import re
                # Extract JSON from response (might have markdown code blocks)
                json_match = re.search(r'\{.*\}', feedback_text, re.DOTALL)
                if json_match:
                    feedback_json = json.loads(json_match.group())
                    return {
                        "status": "success",
                        "is_correct": feedback_json.get("is_correct", False),
                        "score": feedback_json.get("score", 0),
                        "feedback": feedback_json.get("feedback", feedback_text),
                        "strengths": feedback_json.get("strengths", []),
                        "improvements": feedback_json.get("improvements", []),
                        "test_cases_passed": feedback_json.get("test_cases_passed", "N/A")
                    }
            except:
                pass
            
            # If JSON parsing fails, return text response
            return {
                "status": "success",
                "is_correct": "correct" in feedback_text.lower() or "right" in feedback_text.lower(),
                "score": 50,  # Default score if can't parse
                "feedback": feedback_text,
                "strengths": [],
                "improvements": [],
                "test_cases_passed": "N/A"
            }
            
        except Exception as e:
            return {
                "status": "error",
                "feedback": f"Error evaluating code: {str(e)}",
                "is_correct": False,
                "score": 0
            }
