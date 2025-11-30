import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './IntegrityScore.css';

const IntegrityScore = ({ apiUrl, userId }) => {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchScore = async () => {
      try {
        const response = await axios.get(`${apiUrl}/session/${userId}/integrity-score`);
        setScore(response.data);
      } catch (error) {
        console.error('Error fetching integrity score:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScore();
    const interval = setInterval(fetchScore, 10000);
    return () => clearInterval(interval);
  }, [apiUrl, userId]);

  if (loading) {
    return <div className="integrity-score loading">Loading...</div>;
  }

  if (!score) {
    return null;
  }

  const getScoreColor = (value) => {
    if (value >= 80) return '#16a34a';
    if (value >= 60) return '#d97706';
    return '#dc2626';
  };

  const getScoreLabel = (value) => {
    if (value >= 90) return 'Excellent';
    if (value >= 80) return 'Good';
    if (value >= 70) return 'Fair';
    if (value >= 60) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <div className="integrity-score">
      <div className="integrity-score__header">
        <h3 className="integrity-score__title">🔐 Integrity Score</h3>
        <div
          className="integrity-score__main"
          style={{ color: getScoreColor(score.overall_score) }}
        >
          <span className="integrity-score__value">{score.overall_score}</span>
          <span className="integrity-score__max">/100</span>
        </div>
        <div className="integrity-score__label">{getScoreLabel(score.overall_score)}</div>
      </div>

      <div className="integrity-score__breakdown">
        <h4 className="integrity-score__breakdown-title">Score Breakdown:</h4>
        <div className="integrity-score__breakdown-list">
          <div className="integrity-score__breakdown-item">
            <span className="integrity-score__breakdown-label">Proctoring</span>
            <span
              className="integrity-score__breakdown-value"
              style={{ color: getScoreColor(score.breakdown.proctoring_score) }}
            >
              {score.breakdown.proctoring_score}/100
            </span>
          </div>
          <div className="integrity-score__breakdown-item">
            <span className="integrity-score__breakdown-label">Code Plagiarism</span>
            <span
              className="integrity-score__breakdown-value"
              style={{ color: getScoreColor(score.breakdown.code_plagiarism_score) }}
            >
              {score.breakdown.code_plagiarism_score}/100
            </span>
          </div>
          <div className="integrity-score__breakdown-item">
            <span className="integrity-score__breakdown-label">Time Consistency</span>
            <span
              className="integrity-score__breakdown-value"
              style={{ color: getScoreColor(score.breakdown.time_consistency) }}
            >
              {score.breakdown.time_consistency}/100
            </span>
          </div>
          <div className="integrity-score__breakdown-item">
            <span className="integrity-score__breakdown-label">Window Switches</span>
            <span className="integrity-score__breakdown-value">
              {score.breakdown.window_switches}
            </span>
          </div>
        </div>
      </div>

      <div className="integrity-score__footer">
        <div className="integrity-score__stat">
          Total Violations: <strong>{score.total_violations}</strong>
        </div>
      </div>
    </div>
  );
};

export default IntegrityScore;

