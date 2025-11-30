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
    return <div className="personality-selector loading">Loading...</div>;
  }

  return (
    <div className="personality-selector">
      <label className="personality-selector__label">Interviewer Style</label>
      <div className="personality-selector__grid">
        {personalities.map((personality) => (
          <div
            key={personality.id}
            className={`personality-selector__card ${selected === personality.id ? 'personality-selector__card--active' : ''}`}
            onClick={() => handleChange(personality.id)}
          >
            <div className="personality-selector__icon">
              {personality.id === 'tough' && '🔥'}
              {personality.id === 'friendly' && '😊'}
              {personality.id === 'rapid-fire' && '⚡'}
              {personality.id === 'architect' && '🏗️'}
              {personality.id === 'professional' && '👔'}
            </div>
            <div className="personality-selector__name">{personality.name}</div>
            <div className="personality-selector__description">{personality.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonalitySelector;

