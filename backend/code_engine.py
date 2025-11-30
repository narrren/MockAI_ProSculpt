import subprocess
import sys
import os
import tempfile
import shutil
import json


def execute_python_code(code_snippet, timeout=10, working_dir=None):
    """
    Execute Python code safely using subprocess with timeout.
    """
    try:
        cwd = working_dir or tempfile.gettempdir()
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8', dir=cwd) as f:
            f.write(code_snippet)
            temp_file = f.name
        
        try:
            result = subprocess.run(
                [sys.executable, temp_file],
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=cwd
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


def execute_javascript_code(code_snippet, timeout=10, working_dir=None):
    """
    Execute JavaScript code using Node.js.
    """
    try:
        # Check if node is available
        node_check = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if node_check.returncode != 0:
            return {
                "status": "error",
                "output": "Node.js is not installed. Please install Node.js to run JavaScript code."
            }
        
        cwd = working_dir or tempfile.gettempdir()
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False, encoding='utf-8', dir=cwd) as f:
            f.write(code_snippet)
            temp_file = f.name
        
        try:
            result = subprocess.run(
                ['node', temp_file],
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=cwd
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
            if os.path.exists(temp_file):
                os.unlink(temp_file)
                
    except subprocess.TimeoutExpired:
        return {
            "status": "error",
            "output": "Execution Timed Out"
        }
    except FileNotFoundError:
        return {
            "status": "error",
            "output": "Node.js is not installed. Please install Node.js to run JavaScript code."
        }
    except Exception as e:
        return {
            "status": "error",
            "output": str(e)
        }


def execute_java_code(code_snippet, timeout=15):
    """
    Execute Java code. Requires a main class.
    """
    try:
        # Check if javac and java are available
        javac_check = subprocess.run(['javac', '-version'], capture_output=True, text=True)
        if javac_check.returncode != 0:
            return {
                "status": "error",
                "output": "Java compiler (javac) is not installed. Please install JDK to run Java code."
            }
        
        # Create a temporary directory for Java files
        temp_dir = tempfile.mkdtemp()
        
        try:
            # Write code to Main.java
            java_file = os.path.join(temp_dir, 'Main.java')
            with open(java_file, 'w', encoding='utf-8') as f:
                f.write(code_snippet)
            
            # Compile
            compile_result = subprocess.run(
                ['javac', java_file],
                capture_output=True,
                text=True,
                timeout=10,
                cwd=temp_dir
            )
            
            if compile_result.returncode != 0:
                return {
                    "status": "error",
                    "output": f"Compilation error:\n{compile_result.stderr}"
                }
            
            # Run
            run_result = subprocess.run(
                ['java', '-cp', temp_dir, 'Main'],
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=temp_dir
            )
            
            if run_result.returncode == 0:
                return {
                    "status": "success",
                    "output": run_result.stdout if run_result.stdout else "Code executed successfully (no output)"
                }
            else:
                return {
                    "status": "error",
                    "output": run_result.stderr if run_result.stderr else "Unknown error occurred"
                }
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)
                
    except subprocess.TimeoutExpired:
        return {
            "status": "error",
            "output": "Execution Timed Out"
        }
    except FileNotFoundError:
        return {
            "status": "error",
            "output": "Java is not installed. Please install JDK to run Java code."
        }
    except Exception as e:
        return {
            "status": "error",
            "output": str(e)
        }


def execute_cpp_code(code_snippet, timeout=15):
    """
    Execute C++ code using g++.
    """
    try:
        # Check if g++ is available
        gpp_check = subprocess.run(['g++', '--version'], capture_output=True, text=True)
        if gpp_check.returncode != 0:
            return {
                "status": "error",
                "output": "C++ compiler (g++) is not installed. Please install g++ to run C++ code."
            }
        
        temp_dir = tempfile.mkdtemp()
        
        try:
            cpp_file = os.path.join(temp_dir, 'main.cpp')
            exe_file = os.path.join(temp_dir, 'main.exe' if sys.platform == 'win32' else 'main')
            
            with open(cpp_file, 'w', encoding='utf-8') as f:
                f.write(code_snippet)
            
            # Compile
            compile_result = subprocess.run(
                ['g++', '-o', exe_file, cpp_file],
                capture_output=True,
                text=True,
                timeout=10,
                cwd=temp_dir
            )
            
            if compile_result.returncode != 0:
                return {
                    "status": "error",
                    "output": f"Compilation error:\n{compile_result.stderr}"
                }
            
            # Run
            run_result = subprocess.run(
                [exe_file],
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=temp_dir
            )
            
            if run_result.returncode == 0:
                return {
                    "status": "success",
                    "output": run_result.stdout if run_result.stdout else "Code executed successfully (no output)"
                }
            else:
                return {
                    "status": "error",
                    "output": run_result.stderr if run_result.stderr else "Unknown error occurred"
                }
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)
                
    except subprocess.TimeoutExpired:
        return {
            "status": "error",
            "output": "Execution Timed Out"
        }
    except FileNotFoundError:
        return {
            "status": "error",
            "output": "C++ compiler (g++) is not installed. Please install g++ to run C++ code."
        }
    except Exception as e:
        return {
            "status": "error",
            "output": str(e)
        }


def execute_code(code_snippet, language="python", timeout=10, working_dir=None):
    """
    Execute code in the specified language.
    """
    language = language.lower()
    
    if language == "python":
        return execute_python_code(code_snippet, timeout, working_dir)
    elif language == "javascript" or language == "js":
        return execute_javascript_code(code_snippet, timeout, working_dir)
    elif language == "java":
        return execute_java_code(code_snippet, timeout, working_dir)
    elif language == "cpp" or language == "c++":
        return execute_cpp_code(code_snippet, timeout, working_dir)
    else:
        return {
            "status": "error",
            "output": f"Language '{language}' is not supported. Supported languages: python, javascript, java, cpp"
        }


def execute_sql_query(query, db_path=None):
    """
    Execute SQL query safely.
    For MVP, uses SQLite in-memory database.
    """
    try:
        import sqlite3
        
        conn = sqlite3.connect(':memory:')
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS employees (
                id INTEGER PRIMARY KEY,
                name TEXT,
                department TEXT,
                salary INTEGER
            )
        ''')
        
        cursor.execute('''
            INSERT OR IGNORE INTO employees (id, name, department, salary)
            VALUES (1, 'Alice', 'Engineering', 100000),
                   (2, 'Bob', 'Sales', 80000),
                   (3, 'Charlie', 'Engineering', 120000),
                   (4, 'Diana', 'Marketing', 90000)
        ''')
        
        conn.commit()
        
        cursor.execute(query)
        
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
