import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PersonalitySelector.css';

const PersonalitySelector = ({ apiUrl, onPersonalityChange }) => {
  const [personalities, setPersonalities] = useState([]);
  const [selected, setSelected] = useState('professional');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPersonalities = async () => {
      try {
        const response = await axios.get(`${apiUrl}/personalities`);
        setPersonalities(response.data.personalities || []);
        if (response.data.personalities?.length > 0) {
          setSelected(response.data.personalities[0].id);
        }
      } catch (error) {
        console.error('Error fetching personalities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonalities();
  }, [apiUrl]);

  const handleChange = async (personalityId) => {
    setSelected(personalityId);
    try {
      await axios.post(`${apiUrl}/personality/set`, { personality: personalityId });
      if (onPersonalityChange) {
        onPersonalityChange(personalityId);
      }
    } catch (error) {
      console.error('Error setting personality:', error);
    }
  };

  if (loading) {
    return <div className="personality loading">Loading...</div>;
  }

  return (
    <div className="personality card card--padded">
      <h3 className="card__title">Interviewer Style</h3>
      <div className="personality__grid">
        {personalities.map((personality) => (
          <div
            key={personality.id}
            className={`personality__card ${selected === personality.id ? 'personality__card--selected' : ''}`}
            onClick={() => handleChange(personality.id)}
          >
            <div style={{ fontSize: '32px', marginBottom: 'var(--space-2)' }}>
              {personality.id === 'tough' && '🔥'}
              {personality.id === 'friendly' && '😊'}
              {personality.id === 'rapid-fire' && '⚡'}
              {personality.id === 'architect' && '🏗️'}
              {personality.id === 'professional' && '👔'}
            </div>
            <div className="personality__name">{personality.name}</div>
            <div className="personality__desc">{personality.description}</div>
            {selected === personality.id && (
              <span className="personality__badge">Selected</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonalitySelector;

