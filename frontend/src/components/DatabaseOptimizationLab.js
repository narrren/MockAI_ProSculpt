import React, { useState } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import './DatabaseOptimizationLab.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function DatabaseOptimizationLab({ apiUrl = API_URL, onClose }) {
  const [datasetCreated, setDatasetCreated] = useState(false);
  const [datasetId] = useState('default');
  const [query, setQuery] = useState('SELECT * FROM orders WHERE product_id = 100');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [tableInfo, setTableInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createDataset = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${apiUrl}/db-lab/create-dataset`, null, {
        params: {
          dataset_id: datasetId,
          num_rows: 1000000
        }
      });
      setDatasetCreated(true);
      loadTableInfo();
      alert(`Dataset created: ${response.data.message}`);
    } catch (err) {
      console.error('Error creating dataset:', err);
      setError(err.response?.data?.error || 'Failed to create dataset');
    } finally {
      setLoading(false);
    }
  };

  const loadTableInfo = async () => {
    try {
      const response = await axios.get(`${apiUrl}/db-lab/table-info/${datasetId}`);
      setTableInfo(response.data);
    } catch (err) {
      console.error('Error loading table info:', err);
    }
  };

  const analyzeQuery = async () => {
    if (!query.trim()) {
      setError('Please enter a SQL query');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysisResult(null);

    try {
      const response = await axios.post(`${apiUrl}/db-lab/analyze-query`, null, {
        params: {
          dataset_id: datasetId,
          query: query
        }
      });
      setAnalysisResult(response.data);
    } catch (err) {
      console.error('Error analyzing query:', err);
      setError(err.response?.data?.error || 'Failed to analyze query');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="db-optimization-lab">
      <div className="lab-header">
        <h2>Database Schema Optimization Lab</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>×</button>
        )}
      </div>

      <div className="lab-content">
        <div className="lab-sidebar">
          <div className="dataset-section">
            <h3>Dataset</h3>
            {!datasetCreated ? (
              <div>
                <p>Create a dataset with 1 million rows for performance testing.</p>
                <button
                  className="create-dataset-btn"
                  onClick={createDataset}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Dataset (1M rows)'}
                </button>
              </div>
            ) : (
              <div className="dataset-info">
                <p className="success-message">✓ Dataset created</p>
                <p className="info-text">1,000,000 rows (simulated)</p>
                <button
                  className="refresh-info-btn"
                  onClick={loadTableInfo}
                >
                  Refresh Table Info
                </button>
              </div>
            )}
          </div>

          {tableInfo && (
            <div className="table-info-section">
              <h3>Table Schema</h3>
              <div className="schema-info">
                <h4>Columns:</h4>
                <ul>
                  {tableInfo.columns?.map((col, idx) => (
                    <li key={idx}>
                      {col[1]} ({col[2]})
                    </li>
                  ))}
                </ul>
                <h4>Indexes:</h4>
                <ul>
                  {tableInfo.indexes?.map((idx, i) => (
                    <li key={i}>{idx[0]}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="lab-main">
          <div className="query-section">
            <h3>SQL Query</h3>
            <div className="query-editor-wrapper">
              <Editor
                height="200px"
                language="sql"
                value={query}
                onChange={(value) => setQuery(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  readOnly: false
                }}
              />
            </div>
            <div className="query-actions">
              <button
                className="analyze-btn"
                onClick={analyzeQuery}
                disabled={loading || !datasetCreated}
              >
                {loading ? 'Analyzing...' : 'Analyze Performance'}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          {analysisResult && (
            <div className="analysis-result">
              <h3>Performance Analysis</h3>
              
              <div className="performance-metrics">
                <div className="metric">
                  <span className="metric-label">Execution Time:</span>
                  <span className={`metric-value ${analysisResult.is_slow ? 'slow' : 'fast'}`}>
                    {analysisResult.execution_time_ms} ms
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Rows Returned:</span>
                  <span className="metric-value">{analysisResult.row_count}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Status:</span>
                  <span className={`metric-value ${analysisResult.is_slow ? 'slow' : 'fast'}`}>
                    {analysisResult.is_slow ? '⚠️ Slow Query' : '✓ Optimized'}
                  </span>
                </div>
              </div>

              {analysisResult.optimization_suggestions && analysisResult.optimization_suggestions.length > 0 && (
                <div className="suggestions-section">
                  <h4>Optimization Suggestions</h4>
                  {analysisResult.optimization_suggestions.map((suggestion, idx) => (
                    <div key={idx} className={`suggestion-card ${suggestion.severity}`}>
                      <div className="suggestion-header">
                        <span className="suggestion-type">{suggestion.type.replace('_', ' ').toUpperCase()}</span>
                        <span className={`severity-badge ${suggestion.severity}`}>
                          {suggestion.severity}
                        </span>
                      </div>
                      <div className="suggestion-content">
                        <p className="suggestion-issue"><strong>Issue:</strong> {suggestion.issue}</p>
                        <p className="suggestion-fix"><strong>Fix:</strong> {suggestion.suggestion}</p>
                        <p className="suggestion-impact"><strong>Impact:</strong> {suggestion.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {analysisResult.query_plan && (
                <div className="query-plan-section">
                  <h4>Query Plan</h4>
                  <pre className="query-plan">
                    {JSON.stringify(analysisResult.query_plan, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DatabaseOptimizationLab;

