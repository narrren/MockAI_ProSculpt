"""
AI-Guided Code Revision
Analyzes code and provides improved versions with explanations
"""
import google.generativeai as genai
import os
from dotenv import load_dotenv
from diff_match_patch import diff_match_patch

load_dotenv()


class CodeRevision:
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel("gemini-2.5-flash")
        else:
            self.model = None
    
    def improve_code(self, original_code: str, question: str, language: str = "python") -> dict:
        """Analyze code and provide improved version"""
        if not self.model:
            return {
                "error": "AI model not configured",
                "improved_code": original_code,
                "diff": [],
                "explanations": []
            }
        
        prompt = f"""You are a senior code reviewer. Analyze this {language} code that solves this problem:

Problem: {question}

Code:
```{language}
{original_code}
```

Provide:
1. An improved version of the code with:
   - Better variable names
   - Optimized algorithms
   - Edge case handling
   - Better readability
   - Comments where helpful
2. A list of specific improvements made
3. Explanations for why each improvement matters

Format your response as:
IMPROVED_CODE:
```{language}
[improved code here]
```

IMPROVEMENTS:
1. [improvement 1] - [why it matters]
2. [improvement 2] - [why it matters]
...
"""
        
        try:
            response = self.model.generate_content(prompt)
            result_text = response.text
            
            # Parse the response
            improved_code = self._extract_code(result_text, language)
            improvements = self._extract_improvements(result_text)
            
            # Generate diff
            dmp = diff_match_patch()
            diffs = dmp.diff_main(original_code, improved_code)
            dmp.diff_cleanupSemantic(diffs)
            
            return {
                "original_code": original_code,
                "improved_code": improved_code,
                "diff": self._format_diff(diffs),
                "improvements": improvements,
                "raw_response": result_text
            }
        except Exception as e:
            return {
                "error": str(e),
                "improved_code": original_code,
                "diff": [],
                "improvements": []
            }
    
    def _extract_code(self, text: str, language: str) -> str:
        """Extract code block from response"""
        # Look for code blocks
        code_markers = [
            f"```{language}",
            f"``` {language}",
            "```",
            "IMPROVED_CODE:"
        ]
        
        for marker in code_markers:
            if marker in text:
                start = text.find(marker) + len(marker)
                # Find the end of the code block
                end_marker = "```"
                if end_marker in text[start:]:
                    end = text.find(end_marker, start)
                    code = text[start:end].strip()
                    # Remove any leading/trailing markers
                    code = code.strip("```").strip()
                    return code
        
        return text  # Fallback: return original text
    
    def _extract_improvements(self, text: str) -> list:
        """Extract list of improvements from response"""
        improvements = []
        
        if "IMPROVEMENTS:" in text:
            improvements_section = text.split("IMPROVEMENTS:")[1]
            lines = improvements_section.split("\n")
            
            for line in lines:
                line = line.strip()
                if line and (line[0].isdigit() or line.startswith("-") or line.startswith("*")):
                    # Remove numbering
                    clean_line = line.lstrip("0123456789.-* ").strip()
                    if clean_line:
                        improvements.append(clean_line)
        
        return improvements if improvements else ["Code improvements applied"]
    
    def _format_diff(self, diffs: list) -> list:
        """Format diff for display"""
        formatted = []
        for op, text in diffs:
            if op == 0:  # Equal
                formatted.append({"type": "equal", "text": text})
            elif op == -1:  # Delete
                formatted.append({"type": "delete", "text": text})
            elif op == 1:  # Insert
                formatted.append({"type": "insert", "text": text})
        return formatted

