import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './AuthNew.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const LoginNew = ({ onLoginSuccess, onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState('email'); // 'email', 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [humanVerified, setHumanVerified] = useState(false);
  const [language, setLanguage] = useState('EN');
  
  const otpInputs = useRef([]);

  useEffect(() => {
    // Set default language from localStorage or browser
    const savedLang = localStorage.getItem('language') || 'en';
    setLanguage(savedLang.toUpperCase());
  }, []);

  const handleSendCode = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!humanVerified) {
      setError('Please verify that you are human');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Check if test account
      if (email === 'test@aptiva.ai') {
        setMessage('Test account detected - logging in...');
        // For test account, get token from backend
        try {
          const testResponse = await axios.post(`${API_URL}/login`, { 
            email: 'test@aptiva.ai',
            password: 'aptivatesting'
          });
          
          if (testResponse.data.status === 'success') {
            const token = testResponse.data.token;
            const userData = testResponse.data.user || {};
            if (token) {
              userData.token = token;
              localStorage.setItem('auth_token', token);
              localStorage.setItem('user', JSON.stringify(userData));
              console.log('[LoginNew] Test account token stored:', token.substring(0, 20) + '...');
            }
            setTimeout(() => {
              onLoginSuccess(userData);
            }, 500);
          } else {
            throw new Error('Test account login failed');
          }
        } catch (err) {
          console.error('[LoginNew] Test account login error:', err);
          setError('Failed to login with test account. Please try again.');
          setLoading(false);
        }
        return;
      }

      const response = await axios.post(`${API_URL}/login`, { email });
      
      if (response.data.status === 'otp_sent' || response.data.status === 'otp_required') {
        setStep('otp');
        // Check if OTP is included in response (when email is not configured)
        if (response.data.otp && response.data.message && response.data.message.includes('Email not configured')) {
          // Auto-fill OTP when email is not configured
          const otpDigits = response.data.otp.split('');
          setOtp(otpDigits);
          setMessage(`Verification code auto-filled: ${response.data.otp} (Email not configured)`);
        } else {
          setMessage('Verification code sent to your email. Please check your inbox.');
        }
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Failed to send verification code. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      value = value[0];
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/verify-login-otp`, {
        email,
        otp: otpCode
      });

      if (response.data.status === 'success') {
        // Store token and user
        const token = response.data.token;
        const userData = response.data.user || {};
        
        // Include token in userData so handlers can access it
        if (token) {
          userData.token = token;
          localStorage.setItem('auth_token', token);
          console.log('[LoginNew] Token stored:', token.substring(0, 20) + '...');
        } else {
          console.error('[LoginNew] No token in response!', response.data);
        }
        
        localStorage.setItem('user', JSON.stringify(userData));
        onLoginSuccess(userData);
      } else {
        setError(response.data.message || 'Invalid verification code');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTestAccount = async () => {
    setEmail('test@aptiva.ai');
    setHumanVerified(true);
    // Get token for test account
    try {
      const testResponse = await axios.post(`${API_URL}/login`, { 
        email: 'test@aptiva.ai',
        password: 'aptivatesting'
      });
      const token = testResponse.data.token;
      const userData = testResponse.data.user || {};
      if (token) {
        userData.token = token;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('[LoginNew] Test account token stored:', token.substring(0, 20) + '...');
      }
      setTimeout(() => {
        onLoginSuccess(userData);
      }, 300);
    } catch (err) {
      console.error('[LoginNew] Test account login error:', err);
      // Fallback without token
      setTimeout(() => {
        onLoginSuccess({ 
          email: 'test@aptiva.ai', 
          name: 'Test User', 
          is_test: true 
        });
      }, 300);
    }
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
    const langCode = lang.toLowerCase();
    localStorage.setItem('language', langCode);
    window.location.reload();
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Language Selector */}
        <div className="auth-language-selector">
          <span 
            className={language === 'EN' ? 'lang-active' : 'lang-option'}
            onClick={() => changeLanguage('EN')}
          >
            EN
          </span>
          <span className="lang-divider">|</span>
          <span 
            className={language === 'ES' ? 'lang-active' : 'lang-option'}
            onClick={() => changeLanguage('ES')}
          >
            ES
          </span>
          <span className="lang-divider">|</span>
          <span 
            className={language === 'FR' ? 'lang-active' : 'lang-option'}
            onClick={() => changeLanguage('FR')}
          >
            FR
          </span>
        </div>

        <div className="auth-content">
          {/* Logo */}
          <div className="auth-logo-container">
            <div className="auth-logo-icon">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.8261 30.5736C16.7203 29.8826 20.2244 29.4783 24 29.4783C27.7756 29.4783 31.2797 29.8826 34.1739 30.5736C36.9144 31.2278 39.9967 32.7669 41.3563 33.8352L24.8486 7.36089C24.4571 6.73303 23.5429 6.73303 23.1514 7.36089L6.64374 33.8352C8.00331 32.7669 11.0856 31.2278 13.8261 30.5736Z" fill="#0df259"></path>
                <path clipRule="evenodd" d="M39.998 35.764C39.9944 35.7463 39.9875 35.7155 39.9748 35.6706C39.9436 35.5601 39.8949 35.4259 39.8346 35.2825C39.8168 35.2403 39.7989 35.1993 39.7813 35.1602C38.5103 34.2887 35.9788 33.0607 33.7095 32.5189C30.9875 31.8691 27.6413 31.4783 24 31.4783C20.3587 31.4783 17.0125 31.8691 14.2905 32.5189C12.0012 33.0654 9.44505 34.3104 8.18538 35.1832C8.17384 35.2075 8.16216 35.233 8.15052 35.2592C8.09919 35.3751 8.05721 35.4886 8.02977 35.589C8.00356 35.6848 8.00039 35.7333 8.00004 35.7388C8.00004 35.739 8 35.7393 8.00004 35.7388C8.00004 35.7641 8.0104 36.0767 8.68485 36.6314C9.34546 37.1746 10.4222 37.7531 11.9291 38.2772C14.9242 39.319 19.1919 40 24 40C28.8081 40 33.0758 39.319 36.0709 38.2772C37.5778 37.7531 38.6545 37.1746 39.3151 36.6314C39.9006 36.1499 39.9857 35.8511 39.998 35.764ZM4.95178 32.7688L21.4543 6.30267C22.6288 4.4191 25.3712 4.41909 26.5457 6.30267L43.0534 32.777C43.0709 32.8052 43.0878 32.8338 43.104 32.8629L41.3563 33.8352C43.104 32.8629 43.1038 32.8626 43.104 32.8629L43.1051 32.865L43.1065 32.8675L43.1101 32.8739L43.1199 32.8918C43.1276 32.906 43.1377 32.9246 43.1497 32.9473C43.1738 32.9925 43.2062 33.0545 43.244 33.1299C43.319 33.2792 43.4196 33.489 43.5217 33.7317C43.6901 34.1321 44 34.9311 44 35.7391C44 37.4427 43.003 38.7775 41.8558 39.7209C40.6947 40.6757 39.1354 41.4464 37.385 42.0552C33.8654 43.2794 29.133 44 24 44C18.867 44 14.1346 43.2794 10.615 42.0552C8.86463 41.4464 7.30529 40.6757 6.14419 39.7209C4.99695 38.7775 3.99999 37.4427 3.99999 35.7391C3.99999 34.8725 4.29264 34.0922 4.49321 33.6393C4.60375 33.3898 4.71348 33.1804 4.79687 33.0311C4.83898 32.9556 4.87547 32.8935 4.9035 32.8471C4.91754 32.8238 4.92954 32.8043 4.93916 32.7889L4.94662 32.777L4.95178 32.7688ZM35.9868 29.004L24 9.77997L12.0131 29.004C12.4661 28.8609 12.9179 28.7342 13.3617 28.6282C16.4281 27.8961 20.0901 27.4783 24 27.4783C27.9099 27.4783 31.5719 27.8961 34.6383 28.6282C35.082 28.7342 35.5339 28.8609 35.9868 29.004Z" fill="#0df259" fillRule="evenodd"></path>
              </svg>
            </div>
            <h2 className="auth-logo-text">Aptiva</h2>
            <p className="auth-tagline">Insight That Elevates</p>
            <h3 className="auth-title">Sign in to your account</h3>
          </div>

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-message">{message}</div>}

          <form className="auth-form" onSubmit={step === 'email' ? handleSendCode : handleVerifyOtp}>
            {step === 'email' ? (
              <>
                <label className="auth-label">
                  <p className="label-text">Email Address</p>
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </label>

                <div className="human-verification">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      className="auth-checkbox"
                      checked={humanVerified}
                      onChange={(e) => setHumanVerified(e.target.checked)}
                    />
                    <p className="checkbox-text">Human Verification</p>
                  </label>
                </div>
              </>
            ) : (
              <div>
                <p className="label-text">Enter Code</p>
                <div className="otp-inputs">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => otpInputs.current[index] = el}
                      type="number"
                      className="otp-input"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="auth-actions">
              <button 
                type="submit" 
                className="btn-continue"
                disabled={loading}
              >
                {loading ? 'Please wait...' : (step === 'email' ? 'Continue with Email' : 'Verify Code')}
              </button>
              
              <button
                type="button"
                className="btn-test-account"
                onClick={handleUseTestAccount}
              >
                Use Test Account
              </button>
              
              <div className="auth-switch">
                <span className="switch-text">Don't have an account?</span>
                <button
                  type="button"
                  className="btn-switch"
                  onClick={onSwitchToSignup}
                >
                  Sign Up
                </button>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <div className="footer-item">
              <svg className="footer-icon" fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5938 5.40625L10.5938 1.40625C10.4312 1.15 10.1625 1 9.875 1H6.125C5.8375 1 5.56875 1.15 5.40625 1.40625L3.40625 5.40625C3.15 5.56875 3 5.8375 3 6.125V9.875C3 10.1625 3.15 10.4312 3.40625 10.5938L5.40625 14.5938C5.56875 14.85 5.8375 15 6.125 15H9.875C10.1625 15 10.4312 14.85 10.5938 14.5938L12.5938 10.5938C12.85 10.4312 13 10.1625 13 9.875V6.125C13 5.8375 12.85 5.56875 12.5938 5.40625ZM9.875 14H6.125L4 10.25V5.75L6.125 2H9.875L12 5.75V10.25L9.875 14Z" fill="currentColor"></path>
              </svg>
              <span className="footer-text">Powered by Google Gemini</span>
            </div>
            <div className="footer-item">
              <span className="material-symbols-outlined footer-icon-mat">lock</span>
              <span className="footer-text">Secured by SSL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginNew;

