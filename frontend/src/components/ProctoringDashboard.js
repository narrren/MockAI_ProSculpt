import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProctoringDashboard.css';

const ProctoringDashboard = ({ apiUrl, userId }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchInsights = async () => {
      try {
        const response = await axios.get(`${apiUrl}/session/${userId}/proctoring-insights`);
        setInsights(response.data);
      } catch (error) {
        console.error('Error fetching proctoring insights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
    const interval = setInterval(fetchInsights, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [apiUrl, userId]);

  if (loading) {
    return <div className="proctoring-dashboard loading">Loading insights...</div>;
  }

  if (!insights) {
    return null;
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#16a34a';
    if (score >= 60) return '#d97706';
    return '#dc2626';
  };

  return (
    <div className="proctoring-dashboard">
      <h3 className="proctoring-dashboard__title">🔍 Proctoring Insights</h3>
      
      <div className="proctoring-dashboard__scores">
        <div className="proctoring-dashboard__score-card">
          <div className="proctoring-dashboard__score-label">Attention Score</div>
          <div
            className="proctoring-dashboard__score-value"
            style={{ color: getScoreColor(insights.summary.attention_score) }}
          >
            {insights.summary.attention_score}/100
          </div>
        </div>

        <div className="proctoring-dashboard__score-card">
          <div className="proctoring-dashboard__score-label">Confidence Score</div>
          <div
            className="proctoring-dashboard__score-value"
            style={{ color: getScoreColor(insights.summary.confidence_score) }}
          >
            {insights.summary.confidence_score}/100
          </div>
        </div>

        <div className="proctoring-dashboard__score-card">
          <div className="proctoring-dashboard__score-label">Integrity Score</div>
          <div
            className="proctoring-dashboard__score-value"
            style={{ color: getScoreColor(insights.integrity_score) }}
          >
            {insights.integrity_score}/100
          </div>
        </div>
      </div>

      <div className="proctoring-dashboard__summary">
        <div className="proctoring-dashboard__stat">
          <span className="proctoring-dashboard__stat-label">Total Violations:</span>
          <span className="proctoring-dashboard__stat-value">{insights.summary.total_violations}</span>
        </div>
        <div className="proctoring-dashboard__stat">
          <span className="proctoring-dashboard__stat-label">Eyes Off Screen:</span>
          <span className="proctoring-dashboard__stat-value">{insights.summary.eye_off_screen_percent.toFixed(1)}%</span>
        </div>
      </div>

      {insights.patterns && insights.patterns.length > 0 && (
        <div className="proctoring-dashboard__patterns">
          <h4 className="proctoring-dashboard__patterns-title">Detected Patterns:</h4>
          <ul className="proctoring-dashboard__patterns-list">
            {insights.patterns.map((pattern, idx) => (
              <li key={idx} className="proctoring-dashboard__pattern-item">
                ⚠️ {pattern}
              </li>
            ))}
          </ul>
        </div>
      )}

      {insights.violation_breakdown && Object.keys(insights.violation_breakdown).length > 0 && (
        <div className="proctoring-dashboard__breakdown">
          <h4 className="proctoring-dashboard__breakdown-title">Violation Breakdown:</h4>
          <div className="proctoring-dashboard__breakdown-list">
            {Object.entries(insights.violation_breakdown).map(([type, count]) => (
              <div key={type} className="proctoring-dashboard__breakdown-item">
                <span className="proctoring-dashboard__breakdown-type">
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span className="proctoring-dashboard__breakdown-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProctoringDashboard;

