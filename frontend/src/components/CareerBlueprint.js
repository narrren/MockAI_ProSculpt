import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CareerBlueprint.css';

const CareerBlueprint = ({ apiUrl, userId }) => {
  const [blueprint, setBlueprint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchBlueprint = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${apiUrl}/session/${userId}/blueprint`);
      setBlueprint(response.data);
    } catch (error) {
      console.error('Error fetching blueprint:', error);
      setError('Failed to generate career blueprint');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-fetch when component mounts (can be triggered manually too)
  }, [apiUrl, userId]);

  if (loading) {
    return (
      <div className="career-blueprint loading">
        <div className="spinner"></div>
        <p>Generating your career roadmap...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="career-blueprint error">
        <p>{error}</p>
        <button className="btn btn--primary btn--sm" onClick={fetchBlueprint}>
          Retry
        </button>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="career-blueprint">
        <button className="btn btn--primary" onClick={fetchBlueprint}>
          Generate Career Blueprint
        </button>
      </div>
    );
  }

  return (
    <div className="career-blueprint">
      <div className="career-blueprint__header">
        <h2 className="career-blueprint__title">🎯 Your Career Roadmap</h2>
        <div className="career-blueprint__compatibility">
          <span className="career-blueprint__role">{blueprint.role_compatibility}</span>
          <span className="career-blueprint__score">{blueprint.compatibility_score}/100</span>
        </div>
      </div>

      {blueprint.strengths && blueprint.strengths.length > 0 && (
        <div className="career-blueprint__section">
          <h3 className="career-blueprint__section-title">✅ Strengths</h3>
          <div className="career-blueprint__list">
            {blueprint.strengths.map((item, idx) => (
              <div key={idx} className="career-blueprint__item career-blueprint__item--strength">
                <span className="career-blueprint__item-name">{item.skill}</span>
                <span className="career-blueprint__item-score">{item.score}/100</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {blueprint.weaknesses && blueprint.weaknesses.length > 0 && (
        <div className="career-blueprint__section">
          <h3 className="career-blueprint__section-title">📈 Areas for Improvement</h3>
          <div className="career-blueprint__list">
            {blueprint.weaknesses.map((item, idx) => (
              <div key={idx} className="career-blueprint__item career-blueprint__item--weakness">
                <span className="career-blueprint__item-name">{item.skill}</span>
                <span className="career-blueprint__item-score">{item.score}/100</span>
                <span className="career-blueprint__item-gap">Gap: {item.gap} points</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {blueprint.recommendations && blueprint.recommendations.length > 0 && (
        <div className="career-blueprint__section">
          <h3 className="career-blueprint__section-title">📚 Recommended Learning Path</h3>
          <div className="career-blueprint__recommendations">
            {blueprint.recommendations.map((rec, idx) => (
              <div key={idx} className="career-blueprint__recommendation">
                <div className="career-blueprint__rec-header">
                  <span className="career-blueprint__rec-title">{rec.title}</span>
                  <span className={`career-blueprint__rec-priority career-blueprint__rec-priority--${rec.priority}`}>
                    {rec.priority}
                  </span>
                </div>
                <div className="career-blueprint__rec-details">
                  <span className="career-blueprint__rec-platform">📖 {rec.platform}</span>
                  <span className="career-blueprint__rec-time">⏱️ {rec.estimated_time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="career-blueprint__footer">
        <p className="career-blueprint__timeline">
          Estimated timeline to reach target level: <strong>{blueprint.estimated_timeline_weeks} weeks</strong>
        </p>
        <p className="career-blueprint__assessment">{blueprint.overall_assessment}</p>
      </div>
    </div>
  );
};

export default CareerBlueprint;

