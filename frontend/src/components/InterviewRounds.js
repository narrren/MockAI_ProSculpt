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
    <div className="interview-rounds">
      <h3 className="interview-rounds__title">Interview Rounds</h3>
      <div className="interview-rounds__list">
        {rounds.map((round) => {
          const status = getRoundStatus(round.id);
          return (
            <div
              key={round.id}
              className={`interview-rounds__item interview-rounds__item--${status}`}
              onClick={() => status !== 'pending' && startRound(round.id)}
            >
              <div className="interview-rounds__item-number">{round.id}</div>
              <div className="interview-rounds__item-content">
                <div className="interview-rounds__item-name">{round.name}</div>
                <div className="interview-rounds__item-status">
                  {status === 'completed' && '✅ Completed'}
                  {status === 'active' && '🔄 Active'}
                  {status === 'pending' && '⏳ Pending'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InterviewRounds;

