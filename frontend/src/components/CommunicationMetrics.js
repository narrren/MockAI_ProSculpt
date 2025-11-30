import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CommunicationMetrics.css';

const CommunicationMetrics = ({ apiUrl, userId }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchMetrics = async () => {
      try {
        const response = await axios.get(`${apiUrl}/session/${userId}/communication-metrics`);
        setMetrics(response.data);
      } catch (error) {
        console.error('Error fetching communication metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [apiUrl, userId]);

  if (loading) {
    return <div className="communication-metrics loading">Loading metrics...</div>;
  }

  if (!metrics) {
    return null;
  }

  const getScoreColor = (score) => {
    if (score >= 75) return '#16a34a';
    if (score >= 50) return '#d97706';
    return '#dc2626';
  };

  return (
    <div className="metrics card card--padded">
      <h3 className="card__title">🎙️ Communication Analysis</h3>
      
      <div className="metrics__grid">
        <div className="metrics__card">
          <div className="metrics__label">Clarity Score</div>
          <div className="metrics__value" style={{ color: getScoreColor(metrics.clarity_score) }}>
            {metrics.clarity_score.toFixed(1)}/100
          </div>
        </div>

        <div className="metrics__card">
          <div className="metrics__label">Structure Score</div>
          <div className="metrics__value" style={{ color: getScoreColor(metrics.structure_score) }}>
            {metrics.structure_score.toFixed(1)}/100
          </div>
        </div>

        <div className="metrics__card">
          <div className="metrics__label">Filler Words</div>
          <div className="metrics__value">{metrics.filler_word_count}</div>
          <div className="metrics__sub">({metrics.filler_percentage.toFixed(1)}%)</div>
        </div>

        <div className="metrics__card">
          <div className="metrics__label">Avg Response Time</div>
          <div className="metrics__value">{metrics.average_response_time.toFixed(1)}s</div>
        </div>
      </div>

      {metrics.star_format_detected && (
        <div className="badge badge--success" style={{ marginTop: 'var(--space-4)' }}>
          ✅ STAR Format Detected
        </div>
      )}
    </div>
  );
};

export default CommunicationMetrics;

