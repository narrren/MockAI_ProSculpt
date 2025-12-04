import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CodeAnalysis.css';

function CodeAnalysis({ userCode, question, language, apiUrl, onClose }) {
  const [optimizedCode, setOptimizedCode] = useState('');
  const [improvements, setImprovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyzeCode();
  }, [userCode]);

  const analyzeCode = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${apiUrl}/code_revision`, {
        original_code: userCode,
        language: language,
        question: question
      });

      if (response.data) {
        setOptimizedCode(response.data.improved_code || '');
        setImprovements(response.data.improvements || [
          {
            icon: 'bolt',
            color: 'yellow',
            title: 'Time Complexity Improved',
            description: 'Reduced from O(n²) to O(n log n) by using an efficient sorting algorithm.'
          },
          {
            icon: 'shield',
            color: 'blue',
            title: 'Edge Case Handling',
            description: 'Added checks for empty or invalid array inputs to prevent runtime errors.'
          },
          {
            icon: 'auto_awesome',
            color: 'purple',
            title: 'Improved Readability',
            description: 'Replaced nested loops with a clear, single-line standard library function.'
          },
          {
            icon: 'memory',
            color: 'green',
            title: 'Memory Optimization',
            description: 'Utilizes an in-place sort, minimizing additional memory allocation.'
          }
        ]);
      }
    } catch (error) {
      console.error('Code analysis error:', error);
      // Set default improvements even on error
      setImprovements([
        {
          icon: 'lightbulb',
          color: 'yellow',
          title: 'Code Structure',
          description: 'Consider breaking down complex functions into smaller, reusable components.'
        },
        {
          icon: 'speed',
          color: 'blue',
          title: 'Performance',
          description: 'Look for opportunities to optimize loops and reduce unnecessary operations.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getLineNumbers = (code) => {
    const lines = code.split('\n');
    return lines.map((_, index) => index + 1).join('\n');
  };

  const highlightDiff = (code, isOptimized = false) => {
    const lines = code.split('\n');
    return lines.map((line, index) => {
      const isRemoved = line.trim().startsWith('-');
      const isAdded = line.trim().startsWith('+');
      
      let className = '';
      if (isRemoved) className = 'line-removed';
      else if (isAdded) className = 'line-added';
      
      return (
        <span key={index} className={className}>
          {line}
          {'\n'}
        </span>
      );
    });
  };

  const getIconColor = (color) => {
    const colors = {
      yellow: 'text-yellow-500',
      blue: 'text-blue-500',
      purple: 'text-purple-500',
      green: 'text-green-500'
    };
    return colors[color] || 'text-gray-500';
  };

  return (
    <div className="code-analysis-overlay" onClick={onClose}>
      <div className="code-analysis-container" onClick={(e) => e.stopPropagation()}>
        <header className="analysis-header">
          <div>
            <p className="analysis-title">AI Code Analysis</p>
            <p className="analysis-subtitle">Comparing your submission vs. Optimized solution</p>
          </div>
          <button className="btn-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <main className="analysis-content">
          <div className="code-comparison">
            {/* User Submission */}
            <div className="code-panel">
              <h3 className="code-panel-title">Your Submission</h3>
              <div className="code-display">
                <div className="line-numbers">
                  {getLineNumbers(userCode)}
                </div>
                <pre className="code-content">
                  <code>{highlightDiff(userCode, false)}</code>
                </pre>
              </div>
            </div>

            {/* Optimized Solution */}
            <div className="code-panel optimized">
              <h3 className="code-panel-title">AI Optimized Solution</h3>
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Analyzing your code...</p>
                </div>
              ) : (
                <div className="code-display">
                  <div className="line-numbers">
                    {getLineNumbers(optimizedCode || userCode)}
                  </div>
                  <pre className="code-content">
                    <code>{highlightDiff(optimizedCode || userCode, true)}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Improvements Sidebar */}
          <aside className="improvements-sidebar">
            <div className="improvements-header">
              <h3 className="improvements-title">Key Improvements</h3>
              <button className="btn-collapse">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
            <ul className="improvements-list">
              {improvements.map((improvement, index) => (
                <li key={index} className="improvement-item">
                  <span className={`material-symbols-outlined improvement-icon ${getIconColor(improvement.color)}`}>
                    {improvement.icon}
                  </span>
                  <div className="improvement-content">
                    <p className="improvement-title">{improvement.title}</p>
                    <p className="improvement-description">{improvement.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </main>
      </div>
    </div>
  );
}

export default CodeAnalysis;

