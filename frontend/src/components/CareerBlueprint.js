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
      <div className="blueprint card card--padded" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
        <div className="spinner" style={{ margin: '0 auto var(--space-4)' }}></div>
        <p>Generating your career roadmap...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blueprint card card--padded">
        <div className="badge badge--danger" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>
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
    <div className="blueprint card card--padded">
      <div className="blueprint__section">
        <h2 className="blueprint__title">🎯 Your Career Roadmap</h2>
        <div className="blueprint__compatibility">
          <div>
            <div className="blueprint__compatibility-label">{blueprint.role_compatibility}</div>
            <div className="blueprint__compatibility-score">{blueprint.compatibility_score}/100</div>
          </div>
        </div>
      </div>

      {blueprint.strengths && blueprint.strengths.length > 0 && (
        <div className="blueprint__section">
          <h3 className="blueprint__title">✅ Strengths</h3>
          <div className="blueprint__list">
            {blueprint.strengths.map((item, idx) => (
              <div key={idx} className="blueprint__item">
                <div className="blueprint__item-label">{item.skill}</div>
                <div className="blueprint__item-desc">Score: {item.score}/100</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {blueprint.weaknesses && blueprint.weaknesses.length > 0 && (
        <div className="blueprint__section">
          <h3 className="blueprint__title">📈 Areas for Improvement</h3>
          <div className="blueprint__list">
            {blueprint.weaknesses.map((item, idx) => (
              <div key={idx} className="blueprint__item blueprint__item--weakness">
                <div className="blueprint__item-label">{item.skill}</div>
                <div className="blueprint__item-desc">Score: {item.score}/100 | Gap: {item.gap} points</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {blueprint.recommendations && blueprint.recommendations.length > 0 && (
        <div className="blueprint__section">
          <h3 className="blueprint__title">📚 Recommended Learning Path</h3>
          <div className="blueprint__timeline">
            {blueprint.recommendations.map((rec, idx) => (
              <div key={idx} className="blueprint__timeline-item">
                <div className="blueprint__timeline-dot"></div>
                <div className="blueprint__timeline-content">
                  <div className="blueprint__timeline-title">{rec.title}</div>
                  <div className="blueprint__timeline-desc">📖 {rec.platform} | ⏱️ {rec.estimated_time} | Priority: {rec.priority}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="blueprint__section">
        <p className="blueprint__item-desc">
          Estimated timeline: <strong>{blueprint.estimated_timeline_weeks} weeks</strong>
        </p>
        <p className="blueprint__item-desc">{blueprint.overall_assessment}</p>
      </div>
    </div>
  );
};

export default CareerBlueprint;

