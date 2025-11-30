import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './InterviewRounds.css';

const InterviewRounds = ({ apiUrl, userId, onRoundChange }) => {
  const [currentRound, setCurrentRound] = useState(1);
  const [rounds, setRounds] = useState([
    { id: 1, name: 'MCQ Round', status: 'pending' },
    { id: 2, name: 'Core Technical', status: 'pending' },
    { id: 3, name: 'Coding Round', status: 'pending' },
    { id: 4, name: 'Behavioral Round', status: 'pending' },
    { id: 5, name: 'Summary', status: 'pending' }
  ]);

  useEffect(() => {
    // This would be fetched from session API
    // For now, we'll manage it locally
  }, [apiUrl, userId]);

  const startRound = async (roundNumber) => {
    try {
      await axios.post(`${apiUrl}/session/round/start`, {
        user_id: userId,
        round_number: roundNumber
      });
      setCurrentRound(roundNumber);
      if (onRoundChange) {
        onRoundChange(roundNumber);
      }
    } catch (error) {
      console.error('Error starting round:', error);
    }
  };

  const getRoundStatus = (roundId) => {
    if (roundId < currentRound) return 'completed';
    if (roundId === currentRound) return 'active';
    return 'pending';
  };

  return (
    <div className="rounds card card--padded">
      <h3 className="card__title">Interview Rounds</h3>
      <div className="rounds__tracker">
        {rounds.map((round) => {
          const status = getRoundStatus(round.id);
          return (
            <div
              key={round.id}
              className={`rounds__item ${
                status === 'active' ? 'rounds__item--active' : 
                status === 'completed' ? 'rounds__item--completed' : ''
              }`}
              onClick={() => status !== 'pending' && startRound(round.id)}
            >
              <div className="rounds__number">{round.id}</div>
              <div className="rounds__name">{round.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InterviewRounds;

