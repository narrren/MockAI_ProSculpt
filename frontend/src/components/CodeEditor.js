import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { t } from '../i18n/languages';

const CodeEditor = ({ apiUrl, onViolation, reportToBackend = true }) => {
  const [code, setCode] = useState('# Write your Python code here\nprint("Hello, World!")');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [language, setLanguage] = useState('python');
  const editorRef = useRef(null);
  const violationCountRef = useRef(0);

  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running...');

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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#1e1e1e'
    }}>
      <div style={{
        padding: '10px',
        background: '#2d2d2d',
        borderBottom: '1px solid #555',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: 'white' }}>{t('code.title')}</h3>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              padding: '5px 10px',
              background: '#1e1e1e',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '5px'
            }}
          >
            <option value="python">Python</option>
            <option value="javascript" disabled>JavaScript (Coming Soon)</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={runCode}
            disabled={isRunning}
            style={{
              padding: '8px 20px',
              background: isRunning ? '#555' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isRunning ? t('code.running') : `▶ ${t('code.run')}`}
          </button>
          <button
            onClick={clearOutput}
            style={{
              padding: '8px 20px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {t('code.clear')}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
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

      <div style={{
        height: '200px',
        background: '#1e1e1e',
        borderTop: '2px solid #555',
        padding: '15px',
        overflowY: 'auto'
      }}>
        <div style={{
          color: 'white',
          fontFamily: 'monospace',
          fontSize: '13px',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word'
        }}>
          <strong style={{ color: '#4ec9b0' }}>{t('code.output')}</strong>
          <pre style={{ margin: '10px 0 0 0', color: output.startsWith('Error') ? '#f48771' : '#d4d4d4' }}>
            {output || t('code.noOutput')}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;

