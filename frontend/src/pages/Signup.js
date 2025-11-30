import React, { useState } from 'react';
import axios from 'axios';
import { t } from '../i18n/languages';
import LanguageSelector from '../components/LanguageSelector';
import './Auth.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Signup = ({ onSignupSuccess, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('register'); // 'register', 'verify'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post(
        `${API_URL}/register`, 
        {
          email: email.trim(),
          name: name.trim()
        },
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        setStep('verify');
        // If OTP is included in response (email not configured), show it
        if (response.data.otp) {
          setMessage(`${response.data.message}\n\n🔑 Your OTP: ${response.data.otp}\n\n(Email not configured - OTP shown here for testing. Check backend console for details.)`);
        } else {
          setMessage(response.data.message);
        }
      } else {
        setError(response.data.message || 'Registration failed');
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setError('Request timeout. Please check if the backend server is running.');
      } else if (err.response) {
        setError(err.response?.data?.detail || err.response?.data?.message || 'Registration failed');
      } else if (err.request) {
        setError('Cannot connect to server. Please ensure the backend is running.');
      } else {
        setError(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post(
        `${API_URL}/verify-otp`, 
        {
          email: email.trim(),
          otp: otp.trim()
        },
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        if (onSignupSuccess) {
          onSignupSuccess(response.data.user);
        }
      } else {
        setError(response.data.message || 'OTP verification failed');
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setError('Request timeout. Please try again.');
      } else if (err.response) {
        setError(err.response?.data?.detail || err.response?.data?.message || 'OTP verification failed');
      } else if (err.request) {
        setError('Cannot connect to server. Please ensure the backend is running.');
      } else {
        setError(err.message || 'OTP verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-language-selector">
        <LanguageSelector />
      </div>
      <div className="auth-box">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon">🎯</span>
            <h1>{t('app.title')}</h1>
          </div>
        </div>
        <h2 className="auth-subtitle">{t('auth.signup')}</h2>

        {step === 'register' ? (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>{t('auth.name')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('auth.namePlaceholder', 'Enter your full name')}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>{t('auth.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder', 'Enter your email')}
                required
                disabled={loading}
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            <button type="submit" disabled={loading} className="auth-button">
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span className="spinner"></span>
                  {t('common.loading')}
                </span>
              ) : (
                t('auth.sendOTP', 'Send OTP')
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <div className="form-group">
              <label>{t('auth.otp')}</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t('auth.otpPlaceholder', '6-digit OTP')}
                maxLength="6"
                required
                disabled={loading}
                style={{ fontSize: '24px', textAlign: 'center', letterSpacing: '8px' }}
              />
              <small className="form-hint">
                {message && message.includes('OTP:') ? (
                  <div style={{ 
                    background: '#fff3cd', 
                    border: '1px solid #ffc107', 
                    borderRadius: '5px', 
                    padding: '15px', 
                    marginTop: '10px',
                    whiteSpace: 'pre-line',
                    fontSize: '14px'
                  }}>
                    {message}
                  </div>
                ) : (
                  t('auth.otpHintWithEmail', `Check your email (${email}) for the OTP. It expires in 10 minutes.`)
                )}
              </small>
            </div>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            <button type="submit" disabled={loading || otp.length !== 6} className="auth-button">
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span className="spinner"></span>
                  {t('common.loading')}
                </span>
              ) : (
                `${t('auth.verifyOTP')} & ${t('auth.createAccount')}`
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('register');
                setOtp('');
                setError('');
                setMessage('');
              }}
              className="back-button"
            >
              Back
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>{t('auth.haveAccount')} <a href="#login" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}>{t('auth.login')}</a></p>
        </div>
      </div>
    </div>
  );
};

export default Signup;

