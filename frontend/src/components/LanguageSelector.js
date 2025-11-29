import React from 'react';
import { getLanguage, setLanguage, t } from '../i18n/languages';

const LanguageSelector = ({ onLanguageChange }) => {
  const currentLang = getLanguage();
  
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' }
  ];

  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
    if (onLanguageChange) {
      onLanguageChange(langCode);
    }
    // Reload page to apply language changes
    window.location.reload();
  };

  return (
    <div style={{
      position: 'relative',
      display: 'inline-block'
    }}>
      <select
        value={currentLang}
        onChange={(e) => handleLanguageChange(e.target.value)}
        style={{
          padding: '8px 35px 8px 12px',
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
          paddingRight: '40px',
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.25)';
          e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.15)';
          e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        }}
      >
        {languages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;

