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
    <div className="dashboard card card--padded">
      <h3 className="card__title">🔍 Proctoring Insights</h3>
      
      <div className="dashboard__grid">
        <div className="dashboard__card">
          <div className="dashboard__title">Attention Score</div>
          <div className="dashboard__value" style={{ color: getScoreColor(insights.summary.attention_score) }}>
            {insights.summary.attention_score}/100
          </div>
        </div>

        <div className="dashboard__card">
          <div className="dashboard__title">Confidence Score</div>
          <div className="dashboard__value" style={{ color: getScoreColor(insights.summary.confidence_score) }}>
            {insights.summary.confidence_score}/100
          </div>
        </div>

        <div className="dashboard__card">
          <div className="dashboard__title">Integrity Score</div>
          <div className="dashboard__value" style={{ color: getScoreColor(insights.integrity_score) }}>
            {insights.integrity_score}/100
          </div>
        </div>
      </div>

      <div className="dashboard__list">
        <div className="dashboard__list-item">
          <span className="dashboard__list-label">Total Violations:</span>
          <span>{insights.summary.total_violations}</span>
        </div>
        <div className="dashboard__list-item">
          <span className="dashboard__list-label">Eyes Off Screen:</span>
          <span>{insights.summary.eye_off_screen_percent.toFixed(1)}%</span>
        </div>
      </div>

      {insights.patterns && insights.patterns.length > 0 && (
        <div className="dashboard__list">
          <div className="dashboard__title">Detected Patterns:</div>
          {insights.patterns.map((pattern, idx) => (
            <div key={idx} className="dashboard__list-item">
              ⚠️ {pattern}
            </div>
          ))}
        </div>
      )}

      {insights.violation_breakdown && Object.keys(insights.violation_breakdown).length > 0 && (
        <div className="dashboard__list">
          <div className="dashboard__title">Violation Breakdown:</div>
          {Object.entries(insights.violation_breakdown).map(([type, count]) => (
            <div key={type} className="dashboard__list-item">
              <span className="dashboard__list-label">
                {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}:
              </span>
              <span>{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProctoringDashboard;

