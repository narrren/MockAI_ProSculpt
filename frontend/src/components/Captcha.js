import React, { useState, useEffect } from 'react';
import { t } from '../i18n/languages';
import './Captcha.css';

const Captcha = ({ onVerify }) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  // Generate new CAPTCHA on mount and when needed
  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setNum1(n1);
    setNum2(n2);
    setAnswer('');
    setError('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const userAnswer = parseInt(answer.trim());
    const correctAnswer = num1 + num2;

    if (isNaN(userAnswer)) {
      setError('Please enter a valid number');
      return;
    }

    if (userAnswer === correctAnswer) {
      setIsVerified(true);
      setError('');
      // Call the verification callback after a short delay
      setTimeout(() => {
        if (onVerify) {
          onVerify(true);
        }
      }, 500);
    } else {
      setAttempts(prev => prev + 1);
      setError(`Incorrect answer. Please try again. (Attempt ${attempts + 1}/3)`);
      setAnswer('');
      
      if (attempts >= 2) {
        // After 3 failed attempts, generate new CAPTCHA
        setTimeout(() => {
          generateCaptcha();
          setAttempts(0);
        }, 1000);
      } else {
        // Generate new CAPTCHA after wrong answer
        setTimeout(() => {
          generateCaptcha();
        }, 1000);
      }
    }
  };

  const handleRefresh = () => {
    generateCaptcha();
    setAnswer('');
    setError('');
    setAttempts(0);
  };

  if (isVerified) {
    return (
      <div className="captcha-container">
        <div className="captcha-box captcha-success">
          <div className="captcha-icon">✓</div>
          <h2>Verification Successful!</h2>
          <p>You are verified as human. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="captcha-container">
      <div className="captcha-box">
        <div className="captcha-header">
          <h2>🔒 Human Verification</h2>
          <p>Please solve this simple math problem to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="captcha-form">
          <div className="captcha-question">
            <div className="captcha-numbers">
              <span className="captcha-number">{num1}</span>
              <span className="captcha-operator">+</span>
              <span className="captcha-number">{num2}</span>
              <span className="captcha-equals">=</span>
            </div>
          </div>

          <div className="captcha-input-group">
            <input
              type="text"
              value={answer}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                setAnswer(val);
                setError('');
              }}
              placeholder="?"
              className="captcha-input"
              autoFocus
              required
            />
            <button
              type="button"
              onClick={handleRefresh}
              className="captcha-refresh"
              title="Get new question"
            >
              🔄
            </button>
          </div>

          {error && (
            <div className="captcha-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="captcha-submit"
            disabled={!answer.trim()}
          >
            Verify
          </button>
        </form>

        <div className="captcha-footer">
          <p>This helps us ensure you're a real person</p>
        </div>
      </div>
    </div>
  );
};

export default Captcha;

