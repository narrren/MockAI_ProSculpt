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
    <div className="revision card card--padded">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h3 className="card__title">🔧 AI Code Revision</h3>
        <button
          className="btn btn--accent btn--sm"
          onClick={handleImprove}
          disabled={loading || !originalCode || !question}
        >
          {loading ? 'Improving...' : 'Improve Code'}
        </button>
      </div>

      {error && (
        <div className="badge badge--danger">{error}</div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p>Analyzing and improving your code...</p>
        </div>
      )}

      {improvedCode && (
        <div className="revision__panes">
          <div className="revision__pane">
            <div className="revision__pane-title">Original Code</div>
            <pre className="revision__code">{originalCode}</pre>
          </div>

          <div className="revision__pane">
            <div className="revision__pane-title">Improved Code</div>
            <pre className="revision__code">{improvedCode}</pre>
          </div>
        </div>
      )}

      {improvements.length > 0 && (
        <div className="revision__explanation">
          <div className="revision__explanation-title">Improvements Made:</div>
          <ul style={{ marginTop: 'var(--space-2)', paddingLeft: 'var(--space-4)' }}>
            {improvements.map((improvement, idx) => (
              <li key={idx} className="revision__explanation-text" style={{ marginBottom: 'var(--space-2)' }}>
                {improvement}
              </li>
            ))}
          </ul>
        </div>
      )}

      {diff.length > 0 && (
        <div className="revision__diff">
          <div className="revision__pane-title">Changes:</div>
          {diff.map((change, idx) => (
            <div
              key={idx}
              className={`revision__diff-line ${
                change.type === 'add' ? 'revision__diff-line--add' : 
                change.type === 'remove' ? 'revision__diff-line--remove' : ''
              }`}
            >
              {change.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CodeRevision;

