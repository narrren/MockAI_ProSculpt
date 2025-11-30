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
    <div className="integrity card card--padded">
      <div className="integrity__main">
        <h3 className="card__title">🔐 Integrity Score</h3>
        <div
          className={`integrity__score ${
            score.overall_score >= 80 ? 'integrity__score--high' : 
            score.overall_score >= 60 ? 'integrity__score--medium' : 
            'integrity__score--low'
          }`}
        >
          {score.overall_score}/100
        </div>
        <div className="integrity__label">{getScoreLabel(score.overall_score)}</div>
      </div>

      <div className="integrity__breakdown">
        <div className="integrity__item">
          <span className="integrity__item-label">Proctoring</span>
          <span className="integrity__item-value" style={{ color: getScoreColor(score.breakdown.proctoring_score) }}>
            {score.breakdown.proctoring_score}/100
          </span>
        </div>
        <div className="integrity__item">
          <span className="integrity__item-label">Code Plagiarism</span>
          <span className="integrity__item-value" style={{ color: getScoreColor(score.breakdown.code_plagiarism_score) }}>
            {score.breakdown.code_plagiarism_score}/100
          </span>
        </div>
        <div className="integrity__item">
          <span className="integrity__item-label">Time Consistency</span>
          <span className="integrity__item-value" style={{ color: getScoreColor(score.breakdown.time_consistency) }}>
            {score.breakdown.time_consistency}/100
          </span>
        </div>
        <div className="integrity__item">
          <span className="integrity__item-label">Window Switches</span>
          <span className="integrity__item-value">{score.breakdown.window_switches}</span>
        </div>
        <div className="integrity__item">
          <span className="integrity__item-label">Total Violations</span>
          <span className="integrity__item-value">{score.total_violations}</span>
        </div>
      </div>
    </div>
  );
};

export default IntegrityScore;

