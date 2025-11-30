import React from 'react';
import { getLanguage, setLanguage, t } from '../i18n/languages';
import './LanguageSelector.css';

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

  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="lang-selector" ref={dropdownRef}>
      <button
        className="lang-selector__button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="lang-selector__flag">
          {languages.find(l => l.code === currentLang)?.flag}
        </span>
        <span>{languages.find(l => l.code === currentLang)?.name}</span>
      </button>
      {isOpen && (
        <div className="lang-selector__dropdown">
          {languages.map(lang => (
            <div
              key={lang.code}
              className={`lang-selector__option ${lang.code === currentLang ? 'lang-selector__option--active' : ''}`}
              onClick={() => {
                handleLanguageChange(lang.code);
                setIsOpen(false);
              }}
            >
              <span className="lang-selector__option-flag">{lang.flag}</span>
              <span className="lang-selector__option-name">{lang.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;

