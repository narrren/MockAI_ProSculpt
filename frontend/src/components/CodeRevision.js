import React, { useState } from 'react';
import axios from 'axios';
import './CodeRevision.css';

const CodeRevision = ({ apiUrl, originalCode, question, language = 'python' }) => {
  const [improvedCode, setImprovedCode] = useState(null);
  const [improvements, setImprovements] = useState([]);
  const [diff, setDiff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImprove = async () => {
    if (!originalCode || !question) {
      setError('Code and question are required');
      return;
    }

    setLoading(true);
    setError('');
    setImprovedCode(null);
    setImprovements([]);
    setDiff([]);

    try {
      const response = await axios.post(`${apiUrl}/code/improve`, {
        code: originalCode,
        question: question,
        language: language
      });

      if (response.data.error) {
        setError(response.data.error);
      } else {
        setImprovedCode(response.data.improved_code);
        setImprovements(response.data.improvements || []);
        setDiff(response.data.diff || []);
      }
    } catch (err) {
      console.error('Code revision error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to improve code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="code-revision">
      <div className="code-revision__header">
        <h3 className="code-revision__title">🔧 AI Code Revision</h3>
        <button
          className="btn btn--accent btn--sm"
          onClick={handleImprove}
          disabled={loading || !originalCode || !question}
        >
          {loading ? 'Improving...' : 'Improve Code'}
        </button>
      </div>

      {error && (
        <div className="code-revision__error">{error}</div>
      )}

      {loading && (
        <div className="code-revision__loading">
          <div className="spinner"></div>
          <p>Analyzing and improving your code...</p>
        </div>
      )}

      {improvedCode && (
        <div className="code-revision__content">
          {improvements.length > 0 && (
            <div className="code-revision__improvements">
              <h4 className="code-revision__improvements-title">Improvements Made:</h4>
              <ul className="code-revision__improvements-list">
                {improvements.map((improvement, idx) => (
                  <li key={idx} className="code-revision__improvement-item">
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="code-revision__comparison">
            <div className="code-revision__panel">
              <div className="code-revision__panel-header code-revision__panel-header--original">
                Original Code
              </div>
              <pre className="code-revision__code">{originalCode}</pre>
            </div>

            <div className="code-revision__panel">
              <div className="code-revision__panel-header code-revision__panel-header--improved">
                Improved Code
              </div>
              <pre className="code-revision__code code-revision__code--improved">{improvedCode}</pre>
            </div>
          </div>

          {diff.length > 0 && (
            <div className="code-revision__diff">
              <h4 className="code-revision__diff-title">Changes:</h4>
              <div className="code-revision__diff-content">
                {diff.map((change, idx) => (
                  <span
                    key={idx}
                    className={`code-revision__diff-item code-revision__diff-item--${change.type}`}
                  >
                    {change.text}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeRevision;

