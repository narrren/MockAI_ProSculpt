import React, { useState } from 'react';
import axios from 'axios';
import { t } from '../i18n/languages';
import LanguageSelector from '../components/LanguageSelector';
import './Auth.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Check backend health before login
const checkBackendHealth = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`, { timeout: 3000 });
    return response.data.status === 'healthy';
  } catch (error) {
    return false;
  }
};

const Login = ({ onLoginSuccess, onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('login'); // 'login', 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    
    // Check backend health first
    const isBackendHealthy = await checkBackendHealth();
    if (!isBackendHealthy) {
      setError(`Cannot connect to backend server. Please ensure the backend is running on ${API_URL}. Check the terminal where you started the backend server.`);
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Add timeout to prevent hanging
      const requestData = {
        email: email.trim()
      };
      
      // Only include password if provided
      if (password && password.trim()) {
        requestData.password = password.trim();
      }
      
      console.log('Sending login request:', { url: `${API_URL}/login`, data: requestData });
      
      const response = await axios.post(
        `${API_URL}/login`, 
        requestData,
        {
          timeout: 15000, // 15 second timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Login response received:', response.data);

      if (response.data.status === 'success') {
        // Test credentials - direct login
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        if (onLoginSuccess) {
          onLoginSuccess(response.data.user);
        }
      } else if (response.data.status === 'otp_required') {
        // Regular user - OTP required
        setStep('otp');
        // If OTP is included in response (email not configured), show it
        if (response.data.otp) {
          setMessage(`${response.data.message}\n\n🔑 Your OTP: ${response.data.otp}\n\n(Email not configured - OTP shown here for testing. Check backend console for details.)`);
        } else {
          setMessage(response.data.message);
        }
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error details:', {
        message: err.message,
        code: err.code,
        response: err.response?.data,
        status: err.response?.status,
        request: err.request
      });
      
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Request timeout. Please check if the backend server is running on ' + API_URL);
      } else if (err.response) {
        const errorMsg = err.response?.data?.detail || err.response?.data?.message || err.response?.statusText || 'Login failed';
        setError(errorMsg);
      } else if (err.request) {
        setError('Cannot connect to server. Please ensure the backend is running on ' + API_URL);
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      console.log('Sending OTP verification to:', `${API_URL}/verify-login-otp`);
      
      const response = await axios.post(
        `${API_URL}/verify-login-otp`, 
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
      
      console.log('OTP verification response:', response.data);

      if (response && response.data && response.data.status === 'success') {
        console.log('OTP verification successful');
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        if (onLoginSuccess) {
          onLoginSuccess(response.data.user);
        }
      } else {
        setError(response?.data?.message || 'OTP verification failed');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Request timeout. Please try again.');
      } else if (err.response) {
        const errorMsg = err.response?.data?.detail || err.response?.data?.message || err.response?.statusText || 'OTP verification failed';
        setError(errorMsg);
      } else if (err.request) {
        setError('Cannot connect to server. Please ensure the backend is running.');
      } else {
        setError(err.message || 'OTP verification failed. Please try again.');
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
            <img src="/aptiva-logo.svg" alt="Aptiva Logo" className="logo-icon" />
            <h1>{t('app.title')}</h1>
          </div>
        </div>
        <h2 className="auth-subtitle">{t('auth.login')}</h2>

        {step === 'login' ? (
          <form onSubmit={handleLogin}>
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

            <div className="form-group">
              <label>{t('auth.password')} ({t('common.optional', 'Optional')} - {t('auth.testCredentialsOnly', 'Test credentials only')})</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder', 'Leave empty for OTP login')}
                disabled={loading}
              />
              <small className="form-hint">
                {t('auth.testCredentialsHint', 'Test credentials bypass OTP. Regular users will receive OTP via email.')}
              </small>
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
                t('auth.login')
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
                  t('auth.otpHint', `Check your email (${email}) for the OTP. It expires in 10 minutes.`)
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
                t('auth.verifyOTP')
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('login');
                setOtp('');
                setError('');
                setMessage('');
              }}
              className="back-button"
            >
              {t('common.back', 'Back')} {t('common.to', 'to')} {t('auth.login')}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>{t('auth.noAccount')} <a href="#signup" onClick={(e) => { e.preventDefault(); if (onSwitchToSignup) onSwitchToSignup(); else window.location.hash = 'signup'; }}>{t('auth.signup')}</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;

