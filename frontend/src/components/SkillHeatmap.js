import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SkillHeatmap.css';

const SkillHeatmap = ({ apiUrl, userId }) => {
  const [skills, setSkills] = useState({
    problem_solving: 0,
    communication: 0,
    coding_quality: 0,
    conceptual_knowledge: 0,
    behavioral_clarity: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchSkills = async () => {
      try {
        const response = await axios.get(`${apiUrl}/session/${userId}/skills`);
        if (response.data.skills) {
          setSkills(response.data.skills);
        }
      } catch (error) {
        console.error('Error fetching skills:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
    const interval = setInterval(fetchSkills, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [apiUrl, userId]);

  const getSkillColor = (score) => {
    if (score >= 75) return '#16a34a'; // Green
    if (score >= 50) return '#d97706'; // Orange
    return '#dc2626'; // Red
  };

  const skillLabels = {
    problem_solving: 'Problem Solving',
    communication: 'Communication',
    coding_quality: 'Coding Quality',
    conceptual_knowledge: 'Conceptual Knowledge',
    behavioral_clarity: 'Behavioral Clarity'
  };

  if (loading) {
    return <div className="skill-heatmap loading">Loading skills...</div>;
  }

  return (
    <div className="heatmap card card--padded">
      <h3 className="card__title">Real-time Skill Assessment</h3>
      {Object.entries(skills).map(([key, value]) => (
        <div key={key} className="heatmap__item">
          <div className="heatmap__label">{skillLabels[key]}</div>
          <div className="heatmap__bar">
            <div
              className={`heatmap__fill ${
                value >= 75 ? 'heatmap__fill--high' : 
                value >= 50 ? 'heatmap__fill--medium' : 
                'heatmap__fill--low'
              }`}
              style={{ width: `${value}%` }}
            />
          </div>
          <div className="heatmap__value">{Math.round(value)}</div>
        </div>
      ))}
    </div>
  );
};

export default SkillHeatmap;

