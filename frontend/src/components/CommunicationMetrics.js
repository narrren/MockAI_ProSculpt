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
    <div className="communication-metrics">
      <h3 className="communication-metrics__title">🎙️ Communication Analysis</h3>
      
      <div className="communication-metrics__grid">
        <div className="communication-metrics__card">
          <div className="communication-metrics__label">Clarity Score</div>
          <div
            className="communication-metrics__value"
            style={{ color: getScoreColor(metrics.clarity_score) }}
          >
            {metrics.clarity_score.toFixed(1)}/100
          </div>
          <div className="communication-metrics__bar">
            <div
              className="communication-metrics__bar-fill"
              style={{
                width: `${metrics.clarity_score}%`,
                backgroundColor: getScoreColor(metrics.clarity_score)
              }}
            ></div>
          </div>
        </div>

        <div className="communication-metrics__card">
          <div className="communication-metrics__label">Structure Score</div>
          <div
            className="communication-metrics__value"
            style={{ color: getScoreColor(metrics.structure_score) }}
          >
            {metrics.structure_score.toFixed(1)}/100
          </div>
          <div className="communication-metrics__bar">
            <div
              className="communication-metrics__bar-fill"
              style={{
                width: `${metrics.structure_score}%`,
                backgroundColor: getScoreColor(metrics.structure_score)
              }}
            ></div>
          </div>
        </div>
      </div>

      <div className="communication-metrics__details">
        <div className="communication-metrics__detail-item">
          <span className="communication-metrics__detail-label">Filler Words:</span>
          <span className="communication-metrics__detail-value">{metrics.filler_word_count} ({metrics.filler_percentage.toFixed(1)}%)</span>
        </div>
        <div className="communication-metrics__detail-item">
          <span className="communication-metrics__detail-label">Avg Response Time:</span>
          <span className="communication-metrics__detail-value">{metrics.average_response_time.toFixed(1)}s</span>
        </div>
        <div className="communication-metrics__detail-item">
          <span className="communication-metrics__detail-label">Answer Length:</span>
          <span className="communication-metrics__detail-value">{metrics.answer_length_consistency.toFixed(1)} words avg</span>
        </div>
        {metrics.star_format_detected && (
          <div className="communication-metrics__star-badge">
            ✅ STAR Format Detected
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunicationMetrics;

