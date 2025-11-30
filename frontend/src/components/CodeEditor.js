import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { t } from '../i18n/languages';
import './CodeEditor.css';

const CodeEditor = ({ apiUrl, onViolation, reportToBackend = true, question = null, suggestedLanguage = 'python', onCodeChange }) => {
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [language, setLanguage] = useState(suggestedLanguage);
  const editorRef = useRef(null);
  const violationCountRef = useRef(0);

  // Initialize code based on language
  useEffect(() => {
    const defaultCode = {
      python: '# Write your Python code here\nprint("Hello, World!")',
      javascript: '// Write your JavaScript code here\nconsole.log("Hello, World!");',
      java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
      cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}',
      c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}'
    };
    if (!code || code.trim().length === 0) {
      setCode(defaultCode[language] || defaultCode.python);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Update language when suggested language changes
  useEffect(() => {
    if (suggestedLanguage) {
      setLanguage(suggestedLanguage);
    }
  }, [suggestedLanguage]);

  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running...');
    setEvaluation(null);

    try {
      const res = await axios.post(`${apiUrl}/run_code`, {
        code: code,
        language: language
      });
      setOutput(res.data.output || 'No output');
    } catch (error) {
      console.error('Code execution error:', error);
      setOutput(`Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const evaluateCode = async () => {
    if (!question) {
      setOutput('No question available for evaluation');
      return;
    }

    setIsEvaluating(true);
    setEvaluation(null);

    try {
      const res = await axios.post(`${apiUrl}/evaluate_code`, {
        code: code,
        language: language,
        question: question
      });
      setEvaluation(res.data);
    } catch (error) {
      console.error('Code evaluation error:', error);
      setEvaluation({
        status: 'error',
        feedback: `Error: ${error.response?.data?.detail || error.message}`,
        is_correct: false
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const clearOutput = () => {
    setOutput('');
  };

  // Report violation to backend
  const reportViolation = async (type, details) => {
    if (reportToBackend && apiUrl) {
      try {
        await axios.post(`${apiUrl}/report_violation`, {
          type: type,
          details: details,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to report violation:', error);
      }
    }
  };

  // Disable copy-paste and keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Block Ctrl+C, Ctrl+V, Ctrl+A, Ctrl+X, Ctrl+Z
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (['c', 'v', 'a', 'x', 'z', 's'].includes(key)) {
          e.preventDefault();
          e.stopPropagation();
          violationCountRef.current += 1;
          const violationMsg = `Copy/Paste/Shortcut blocked (${key.toUpperCase()})`;
          if (onViolation) {
            onViolation(violationMsg);
          }
          if (reportToBackend) {
            reportViolation('keyboard_shortcut', violationMsg);
          }
          return false;
        }
      }
      // Block F12 (DevTools), Ctrl+Shift+I, Ctrl+Shift+J
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && ['i', 'j'].includes(e.key.toLowerCase()))) {
        e.preventDefault();
        e.stopPropagation();
        const violationMsg = 'Developer tools access blocked';
        if (onViolation) {
          onViolation(violationMsg);
        }
        if (reportToBackend) {
          reportViolation('devtools_access', violationMsg);
        }
        return false;
      }
    };

    const handlePaste = (e) => {
      e.preventDefault();
      e.stopPropagation();
      violationCountRef.current += 1;
      const violationMsg = 'Paste operation blocked';
      if (onViolation) {
        onViolation(violationMsg);
      }
      if (reportToBackend) {
        reportViolation('paste_attempt', violationMsg);
      }
      return false;
    };

    const handleCopy = (e) => {
      e.preventDefault();
      e.stopPropagation();
      violationCountRef.current += 1;
      const violationMsg = 'Copy operation blocked';
      if (onViolation) {
        onViolation(violationMsg);
      }
      if (reportToBackend) {
        reportViolation('copy_attempt', violationMsg);
      }
      return false;
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      const violationMsg = 'Right-click menu blocked';
      if (onViolation) {
        onViolation(violationMsg);
      }
      if (reportToBackend) {
        reportViolation('context_menu', violationMsg);
      }
      return false;
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('paste', handlePaste, true);
    document.addEventListener('copy', handleCopy, true);
    document.addEventListener('contextmenu', handleContextMenu, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('paste', handlePaste, true);
      document.removeEventListener('copy', handleCopy, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, [onViolation]);

  // Configure Monaco Editor to disable copy-paste
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Disable context menu
    editor.onContextMenu(() => {
      const violationMsg = 'Right-click in editor blocked';
      if (onViolation) {
        onViolation(violationMsg);
      }
      if (reportToBackend) {
        reportViolation('editor_context_menu', violationMsg);
      }
    });

    // Override copy command
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {
      const violationMsg = 'Copy command blocked in editor';
      if (onViolation) {
        onViolation(violationMsg);
      }
      if (reportToBackend) {
        reportViolation('editor_copy', violationMsg);
      }
    });

    // Override paste command
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
      const violationMsg = 'Paste command blocked in editor';
      if (onViolation) {
        onViolation(violationMsg);
      }
      if (reportToBackend) {
        reportViolation('editor_paste', violationMsg);
      }
    });

    // Override select all
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA, () => {
      const violationMsg = 'Select all blocked in editor';
      if (onViolation) {
        onViolation(violationMsg);
      }
      if (reportToBackend) {
        reportViolation('editor_select_all', violationMsg);
      }
    });
  };

  return (
    <div className="editor">
      <div className="editor__toolbar">
        <h3 className="editor__title">{t('code.title')}</h3>
        <select
          className="editor__lang-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="c">C</option>
        </select>
        <div className="editor__actions">
          <button
            className="btn btn--accent btn--sm"
            onClick={runCode}
            disabled={isRunning}
          >
            {isRunning ? t('code.running') : `▶ ${t('code.run')}`}
          </button>
          {question && (
            <button
              className="btn btn--primary btn--sm"
              onClick={evaluateCode}
              disabled={isEvaluating || isRunning}
            >
              {isEvaluating ? 'Evaluating...' : '✓ Evaluate Code'}
            </button>
          )}
          <button
            className="btn btn--ghost btn--sm"
            onClick={clearOutput}
          >
            {t('code.clear')}
          </button>
        </div>
      </div>

      <div className="editor__pane">
        <Editor
          height="100%"
          defaultLanguage="python"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={(val) => setCode(val || '')}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true,
            readOnly: false,
            contextmenu: false, // Disable context menu
            quickSuggestions: false,
            suggestOnTriggerCharacters: false,
            acceptSuggestionOnEnter: 'off',
            tabCompletion: 'off',
            wordBasedSuggestions: 'off'
          }}
        />
      </div>

      <div className="editor__output">
        {evaluation && (
          <div className={`editor__evaluation ${evaluation.is_correct ? 'editor__evaluation--correct' : 'editor__evaluation--incorrect'}`}>
            <div className="editor__evaluation-header">
              <span className="editor__evaluation-icon">
                {evaluation.is_correct ? '✓' : '✗'}
              </span>
              <strong>
                {evaluation.is_correct ? 'Correct Solution' : 'Incorrect Solution'}
              </strong>
              {evaluation.score !== undefined && (
                <span className="editor__evaluation-score">
                  Score: {evaluation.score}/100
                </span>
              )}
            </div>
            <div className="editor__evaluation-feedback">
              {evaluation.feedback}
            </div>
            {evaluation.strengths && evaluation.strengths.length > 0 && (
              <div className="editor__evaluation-strengths">
                <div className="editor__evaluation-strengths-title">Strengths:</div>
                <ul className="editor__evaluation-list">
                  {evaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {evaluation.improvements && evaluation.improvements.length > 0 && (
              <div className="editor__evaluation-improvements">
                <div className="editor__evaluation-improvements-title">Improvements:</div>
                <ul className="editor__evaluation-list">
                  {evaluation.improvements.map((i, idx) => <li key={idx}>{i}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
        <div className="editor__output-title">{t('code.output')}</div>
        <pre className={`editor__output-content ${output.startsWith('Error') ? 'editor__output-content--error' : 'editor__output-content--success'}`}>
          {output || t('code.noOutput')}
        </pre>
      </div>
    </div>
  );
};

export default CodeEditor;

