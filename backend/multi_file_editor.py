"""
Multi-File Code Editor Support
Handles broken repo debugging scenarios
"""
import os
import tempfile
import shutil
from typing import Dict, List
from code_engine import execute_code


class MultiFileEditor:
    """Manage multi-file code projects"""
    
    def __init__(self):
        self.active_projects = {}  # session_id -> project_path
    
    def create_project(self, session_id: str, files: Dict[str, str]) -> Dict:
        """Create a multi-file project"""
        # Create temporary directory
        project_dir = tempfile.mkdtemp(prefix=f"aptiva_{session_id}_")
        
        # Write files
        file_paths = {}
        for file_path, content in files.items():
            full_path = os.path.join(project_dir, file_path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            file_paths[file_path] = full_path
        
        self.active_projects[session_id] = project_dir
        
        return {
            "project_id": session_id,
            "files": list(files.keys()),
            "project_dir": project_dir
        }
    
    def execute_project(self, session_id: str, entry_file: str, language: str) -> Dict:
        """Execute a multi-file project"""
        if session_id not in self.active_projects:
            return {
                "status": "error",
                "output": "Project not found"
            }
        
        project_dir = self.active_projects[session_id]
        entry_path = os.path.join(project_dir, entry_file)
        
        if not os.path.exists(entry_path):
            return {
                "status": "error",
                "output": f"Entry file {entry_file} not found"
            }
        
        # Read entry file
        with open(entry_path, 'r', encoding='utf-8') as f:
            code = f.read()
        
        # Execute with project directory as working directory
        result = execute_code(code, language, working_dir=project_dir)
        
        return result
    
    def update_file(self, session_id: str, file_path: str, content: str) -> Dict:
        """Update a file in the project"""
        if session_id not in self.active_projects:
            return {"status": "error", "message": "Project not found"}
        
        project_dir = self.active_projects[session_id]
        full_path = os.path.join(project_dir, file_path)
        
        if not os.path.exists(full_path):
            return {"status": "error", "message": "File not found"}
        
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return {"status": "success", "message": "File updated"}
    
    def cleanup_project(self, session_id: str):
        """Clean up project directory"""
        if session_id in self.active_projects:
            project_dir = self.active_projects[session_id]
            if os.path.exists(project_dir):
                shutil.rmtree(project_dir)
            del self.active_projects[session_id]
    
    def get_file_tree(self, session_id: str) -> List[Dict]:
        """Get file tree structure"""
        if session_id not in self.active_projects:
            return []
        
        project_dir = self.active_projects[session_id]
        file_tree = []
        
        for root, dirs, files in os.walk(project_dir):
            level = root.replace(project_dir, '').count(os.sep)
            indent = ' ' * 2 * level
            file_tree.append({
                "type": "directory",
                "name": os.path.basename(root),
                "path": os.path.relpath(root, project_dir),
                "level": level
            })
            
            subindent = ' ' * 2 * (level + 1)
            for file in files:
                file_tree.append({
                    "type": "file",
                    "name": file,
                    "path": os.path.relpath(os.path.join(root, file), project_dir),
                    "level": level + 1
                })
        
        return file_tree

