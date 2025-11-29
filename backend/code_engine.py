import subprocess
import sys
import os
import tempfile
import shutil


def execute_python_code(code_snippet, timeout=5):
    """
    Execute Python code safely using subprocess with timeout.
    
    Note: For production, use Docker containers for better isolation.
    This is a simplified version for local MVP.
    """
    try:
        # Create a temporary file for the code
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code_snippet)
            temp_file = f.name
        
        try:
            # Security: In a real app, strictly limit imports here!
            # For now, we allow standard library and common packages
            result = subprocess.run(
                [sys.executable, temp_file],
                capture_output=True,
                text=True,
                timeout=timeout,  # Prevent infinite loops
                cwd=tempfile.gettempdir()  # Run in temp directory
            )
            
            if result.returncode == 0:
                return {
                    "status": "success",
                    "output": result.stdout if result.stdout else "Code executed successfully (no output)"
                }
            else:
                return {
                    "status": "error",
                    "output": result.stderr if result.stderr else "Unknown error occurred"
                }
        finally:
            # Clean up temp file
            if os.path.exists(temp_file):
                os.unlink(temp_file)
                
    except subprocess.TimeoutExpired:
        return {
            "status": "error",
            "output": "Execution Timed Out (Infinite Loop or long-running operation?)"
        }
    except Exception as e:
        return {
            "status": "error",
            "output": str(e)
        }


def execute_sql_query(query, db_path=None):
    """
    Execute SQL query safely.
    For MVP, uses SQLite in-memory database.
    """
    try:
        import sqlite3
        
        # Create in-memory database for testing
        conn = sqlite3.connect(':memory:')
        cursor = conn.cursor()
        
        # Create a sample table for testing
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS employees (
                id INTEGER PRIMARY KEY,
                name TEXT,
                department TEXT,
                salary INTEGER
            )
        ''')
        
        # Insert sample data
        cursor.execute('''
            INSERT OR IGNORE INTO employees (id, name, department, salary)
            VALUES (1, 'Alice', 'Engineering', 100000),
                   (2, 'Bob', 'Sales', 80000),
                   (3, 'Charlie', 'Engineering', 120000),
                   (4, 'Diana', 'Marketing', 90000)
        ''')
        
        conn.commit()
        
        # Execute user query
        cursor.execute(query)
        
        # Fetch results
        if query.strip().upper().startswith('SELECT'):
            results = cursor.fetchall()
            columns = [description[0] for description in cursor.description]
            conn.close()
            return {
                "status": "success",
                "output": f"Columns: {columns}\nRows: {results}"
            }
        else:
            conn.commit()
            conn.close()
            return {
                "status": "success",
                "output": "Query executed successfully"
            }
            
    except Exception as e:
        return {
            "status": "error",
            "output": str(e)
        }

