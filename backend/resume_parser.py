"""
Resume Parser
Extracts skills and experience from uploaded PDF resumes
"""
import os
from typing import Dict, List, Optional
from pypdf import PdfReader
import re

try:
    from pdfminer.high_level import extract_text
    PDFMINER_AVAILABLE = True
except ImportError:
    PDFMINER_AVAILABLE = False


class ResumeParser:
    """Parse PDF resumes and extract skills/experience"""
    
    # Common technical skills keywords
    SKILL_KEYWORDS = {
        "languages": ["python", "javascript", "java", "c++", "c#", "go", "rust", "ruby", "php", "swift", "kotlin", "scala"],
        "frameworks": ["react", "angular", "vue", "django", "flask", "spring", "express", "node", "next", "nuxt"],
        "databases": ["mysql", "postgresql", "mongodb", "redis", "cassandra", "elasticsearch", "dynamodb"],
        "cloud": ["aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins", "ci/cd"],
        "tools": ["git", "github", "gitlab", "jira", "confluence", "slack", "agile", "scrum"],
        "ai_ml": ["machine learning", "deep learning", "tensorflow", "pytorch", "nlp", "computer vision"],
        "mobile": ["android", "ios", "react native", "flutter", "swift", "kotlin"],
        "web": ["html", "css", "javascript", "typescript", "rest", "graphql", "api"]
    }
    
    def __init__(self):
        self.skills_found = []
        self.experience = []
        self.education = []
    
    def parse_pdf(self, file_path: str) -> Dict:
        """Parse PDF resume and extract information"""
        try:
            # Try pypdf first
            text = self._extract_text_pypdf(file_path)
            if not text or len(text) < 50:
                # Fallback to pdfminer if available
                if PDFMINER_AVAILABLE:
                    text = self._extract_text_pdfminer(file_path)
            
            if not text:
                return {
                    "error": "Could not extract text from PDF",
                    "skills": [],
                    "experience": [],
                    "education": []
                }
            
            # Extract information
            skills = self._extract_skills(text)
            experience = self._extract_experience(text)
            education = self._extract_education(text)
            
            return {
                "raw_text": text,
                "skills": skills,
                "experience": experience,
                "education": education
            }
        except Exception as e:
            return {
                "error": str(e),
                "skills": [],
                "experience": [],
                "education": []
            }
    
    def _extract_text_pypdf(self, file_path: str) -> str:
        """Extract text using pypdf"""
        try:
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            print(f"Error extracting text with pypdf: {e}")
            return ""
    
    def _extract_text_pdfminer(self, file_path: str) -> str:
        """Extract text using pdfminer"""
        try:
            return extract_text(file_path)
        except Exception as e:
            print(f"Error extracting text with pdfminer: {e}")
            return ""
    
    def _extract_skills(self, text: str) -> List[str]:
        """Extract technical skills from resume text"""
        text_lower = text.lower()
        skills_found = []
        
        # Check each category
        for category, keywords in self.SKILL_KEYWORDS.items():
            for keyword in keywords:
                if keyword.lower() in text_lower:
                    skills_found.append(keyword)
        
        # Remove duplicates and return
        return list(set(skills_found))
    
    def _extract_experience(self, text: str) -> List[Dict]:
        """Extract work experience"""
        experience = []
        
        # Look for common patterns
        # Pattern: Company Name - Position (Date Range)
        pattern = r'([A-Z][a-zA-Z\s&]+)\s*[-–]\s*([A-Z][a-zA-Z\s]+)\s*\(([^)]+)\)'
        matches = re.finditer(pattern, text)
        
        for match in matches:
            experience.append({
                "company": match.group(1).strip(),
                "position": match.group(2).strip(),
                "duration": match.group(3).strip()
            })
        
        return experience[:5]  # Limit to 5 most recent
    
    def _extract_education(self, text: str) -> List[Dict]:
        """Extract education information"""
        education = []
        
        # Look for degree patterns
        degree_patterns = [
            r'(Bachelor|Master|PhD|B\.?S\.?|M\.?S\.?|Ph\.?D\.?)\s+[A-Za-z\s]+(?:University|College|Institute)',
            r'[A-Z][a-zA-Z\s]+(?:University|College|Institute)\s*[-–]?\s*(Bachelor|Master|PhD|B\.?S\.?|M\.?S\.?|Ph\.?D\.?)'
        ]
        
        for pattern in degree_patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                education.append({
                    "degree": match.group(0).strip()
                })
        
        return education[:3]  # Limit to 3
    
    def generate_interview_questions(self, skills: List[str], experience: List[Dict]) -> List[str]:
        """Generate interview questions based on resume"""
        questions = []
        
        # Generate questions for each skill
        for skill in skills[:10]:  # Top 10 skills
            questions.append(f"Can you explain your experience with {skill}?")
            questions.append(f"Tell me about a project where you used {skill}.")
        
        # Generate questions based on experience
        if experience:
            latest = experience[0]
            questions.append(f"At {latest.get('company', 'your previous company')}, what was your biggest challenge?")
        
        return questions[:15]  # Return top 15 questions

