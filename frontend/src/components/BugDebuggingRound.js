import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import './BugDebuggingRound.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function BugDebuggingRound({ apiUrl = API_URL, sessionId, onClose }) {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [projectFiles, setProjectFiles] = useState({});
  const [currentFile, setCurrentFile] = useState('');
  const [currentContent, setCurrentContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showHints, setShowHints] = useState(false);

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      const response = await axios.get(`${apiUrl}/bug-scenarios`);
      setScenarios(response.data.scenarios);
    } catch (err) {
      console.error('Error loading scenarios:', err);
      setError('Failed to load bug scenarios');
    }
  };

  const loadScenario = async (scenarioId) => {
    setLoading(true);
    setError('');
    setSuccess('');
    setTestResult(null);
    try {
      const response = await axios.get(`${apiUrl}/bug-scenarios/${scenarioId}`);
      const scenario = response.data;
      
      // Create project from scenario
      const createResponse = await axios.post(
        `${apiUrl}/bug-scenarios/${scenarioId}/create-project/${sessionId}`
      );
      
      setSelectedScenario(scenario);
      setProjectFiles(scenario.files);
      
      // Set first file as current
      const firstFile = Object.keys(scenario.files)[0];
      setCurrentFile(firstFile);
      setCurrentContent(scenario.files[firstFile]);
      setUnsavedChanges(false);
    } catch (err) {
      console.error('Error loading scenario:', err);
      setError(err.response?.data?.detail || 'Failed to load scenario');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (filePath) => {
    // Save current file before switching
    if (currentFile && unsavedChanges) {
      setProjectFiles(prev => ({
        ...prev,
        [currentFile]: currentContent
      }));
    }
    setCurrentFile(filePath);
    setCurrentContent(projectFiles[filePath] || '');
    setUnsavedChanges(false);
  };

  const handleCodeChange = (newContent) => {
    const content = newContent || '';
    setCurrentContent(content);
    setUnsavedChanges(true);
    // Update project files in memory
    if (currentFile) {
      setProjectFiles(prev => ({
        ...prev,
        [currentFile]: content
      }));
    }
  };

  const handleSaveFile = async () => {
    if (!currentFile) {
      setError('No file selected');
      return;
    }
    try {
      setError('');
      setSuccess('');
      // Encode file path and content for URL
      const encodedPath = encodeURIComponent(currentFile);
      const encodedContent = encodeURIComponent(currentContent);
      const response = await axios.post(
        `${apiUrl}/multi-file/update/${sessionId}?file_path=${encodedPath}&content=${encodedContent}`
      );
      if (response.data.status === 'success') {
        setSuccess('File saved successfully!');
        setUnsavedChanges(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.message || 'Failed to save file');
      }
    } catch (err) {
      console.error('Error saving file:', err);
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to save file');
    }
  };

  const handleTestCode = async () => {
    if (!selectedScenario) return;
    
    setTesting(true);
    setError('');
    setTestResult(null);
    
    try {
      // Save all files first
      for (const [filePath, content] of Object.entries(projectFiles)) {
        const encodedPath = encodeURIComponent(filePath);
        const encodedContent = encodeURIComponent(content);
        await axios.post(
          `${apiUrl}/multi-file/update/${sessionId}?file_path=${encodedPath}&content=${encodedContent}`
        );
      }

      // Determine entry file and language
      const entryFile = Object.keys(projectFiles).find(f => 
        f.includes('app.js') || f.includes('index.js') || f.includes('main.js') || 
        f.includes('server.js') || f.includes('payment.js')
      ) || Object.keys(projectFiles)[0];
      
      const language = entryFile.endsWith('.js') ? 'javascript' : 
                      entryFile.endsWith('.py') ? 'python' : 'javascript';

      // Execute the project
      const response = await axios.post(
        `${apiUrl}/multi-file/execute/${sessionId}?entry_file=${encodeURIComponent(entryFile)}&language=${language}`
      );

      setTestResult(response.data);
      setUnsavedChanges(false);
      
      if (response.data.status === 'success' && !response.data.error) {
        setSuccess('Code executed successfully! All tests passed.');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(response.data.error || 'Code execution failed. Check the output for details.');
      }
    } catch (err) {
      console.error('Error testing code:', err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || 'Failed to execute code';
      setError(errorMsg);
      setTestResult({ error: errorMsg, output: '' });
    } finally {
      setTesting(false);
    }
  };

  const getFileIcon = (filePath) => {
    if (filePath.endsWith('.js')) return '📄';
    if (filePath.endsWith('.json')) return '📋';
    if (filePath.endsWith('.py')) return '🐍';
    if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx')) return '⚛️';
    if (filePath.endsWith('.css')) return '🎨';
    if (filePath.endsWith('.html')) return '🌐';
    return '📝';
  };

  const getLanguageFromFile = (filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) return 'javascript';
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) return 'typescript';
    if (filePath.endsWith('.py')) return 'python';
    if (filePath.endsWith('.json')) return 'json';
    if (filePath.endsWith('.css')) return 'css';
    if (filePath.endsWith('.html')) return 'html';
    return 'text';
  };

  const buildFileTree = (files) => {
    const tree = {};
    Object.keys(files).forEach(filePath => {
      const parts = filePath.split('/');
      let current = tree;
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          current[part] = filePath; // Store full path for files
        } else {
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
      });
    });
    return tree;
  };

  const renderFileTree = (tree, level = 0) => {
    return Object.keys(tree).map(key => {
      const item = tree[key];
      const isFile = typeof item === 'string';
      const isActive = isFile && item === currentFile;
      
      return (
        <div key={key} style={{ marginLeft: `${level * 16}px` }}>
          <div
            className={`file-tree-item ${isFile ? 'file' : 'folder'} ${isActive ? 'active' : ''}`}
            onClick={() => isFile && handleFileSelect(item)}
          >
            <span className="file-icon">{isFile ? getFileIcon(item) : '📁'}</span>
            <span className="file-name">{key}</span>
            {isFile && unsavedChanges && item === currentFile && (
              <span className="unsaved-indicator" title="Unsaved changes">●</span>
            )}
          </div>
          {!isFile && typeof item === 'object' && (
            <div className="file-tree-children">
              {renderFileTree(item, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const fileTree = buildFileTree(projectFiles);

  return (
    <div className="bug-debugging-round">
      <div className="debugging-header">
        <div className="header-left">
          <h2>Broken Repo Debugging Round</h2>
          {selectedScenario && (
            <button 
              className="back-btn" 
              onClick={() => {
                setSelectedScenario(null);
                setProjectFiles({});
                setCurrentFile('');
                setCurrentContent('');
                setTestResult(null);
                setError('');
                setSuccess('');
              }}
            >
              ← Back to Scenarios
            </button>
          )}
        </div>
        <div className="header-right">
          {selectedScenario && (
            <button 
              className="hints-btn" 
              onClick={() => setShowHints(!showHints)}
              title="Toggle hints"
            >
              💡 Hints
            </button>
          )}
          {onClose && (
            <button className="close-btn" onClick={onClose}>×</button>
          )}
        </div>
      </div>

      <div className="debugging-content">
        {!selectedScenario ? (
          <div className="scenario-selection">
            <h3>Select a Bug Scenario</h3>
            {error && <div className="error-message">{error}</div>}
            <div className="scenarios-list">
              {scenarios.map((scenario) => (
                <div key={scenario.id} className="scenario-card">
                  <h4>{scenario.name}</h4>
                  <p>{scenario.description}</p>
                  <button
                    className="load-scenario-btn"
                    onClick={() => loadScenario(scenario.id)}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load Scenario'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="debugging-workspace">
            <div className="workspace-sidebar">
              <div className="scenario-info">
                <h3>{selectedScenario.name}</h3>
                <p>{selectedScenario.description}</p>
                {selectedScenario.bugs && (
                  <div className="bugs-count">
                    <strong>{selectedScenario.bugs.length}</strong> bug{selectedScenario.bugs.length !== 1 ? 's' : ''} to find
                  </div>
                )}
              </div>
              
              {showHints && selectedScenario.bugs && (
                <div className="hints-panel">
                  <h4>💡 Hints</h4>
                  <ul>
                    {selectedScenario.bugs.map((bug, index) => (
                      <li key={index}>
                        <strong>{bug.file}:{bug.line}</strong> - {bug.issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="file-tree">
                <h4>📁 Files</h4>
                <div className="file-tree-container">
                  {renderFileTree(fileTree)}
                </div>
              </div>
            </div>

            <div className="workspace-editor">
              <div className="editor-header">
                <div className="editor-header-left">
                  <span className="file-icon-large">{getFileIcon(currentFile)}</span>
                  <span className="file-name">{currentFile || 'No file selected'}</span>
                  {unsavedChanges && <span className="unsaved-badge">Unsaved</span>}
                </div>
                <div className="editor-header-right">
                  <button 
                    className="test-btn" 
                    onClick={handleTestCode}
                    disabled={testing || !currentFile}
                    title="Test your fixes"
                  >
                    {testing ? '⏳ Testing...' : '▶️ Test Code'}
                  </button>
                  <button 
                    className="save-btn" 
                    onClick={handleSaveFile}
                    disabled={!currentFile || !unsavedChanges}
                  >
                    💾 Save File
                  </button>
                </div>
              </div>
              
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <Editor
                  height="100%"
                  language={getLanguageFromFile(currentFile)}
                  value={currentContent}
                  onChange={(value) => handleCodeChange(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    readOnly: false,
                    lineNumbers: 'on',
                    automaticLayout: true,
                    tabSize: 2,
                    formatOnPaste: true,
                    formatOnType: true,
                  }}
                />
              </div>
              
              {testResult && (
                <div className="test-result-panel">
                  <h4>Test Results</h4>
                  <div className={`test-output ${testResult.status === 'success' && !testResult.error ? 'success' : 'error'}`}>
                    {testResult.output && (
                      <pre>{testResult.output}</pre>
                    )}
                    {testResult.error && (
                      <pre className="error-output">{testResult.error}</pre>
                    )}
                    {testResult.status === 'success' && !testResult.error && (
                      <div className="success-indicator">✅ All tests passed!</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BugDebuggingRound;
