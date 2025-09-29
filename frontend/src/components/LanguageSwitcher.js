import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { DanishFlag, AmericanFlag } from './FlagIcon';

const LanguageSwitcher = () => {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => changeLanguage('da')}
        className={`p-1 rounded transition-colors ${
          language === 'da' 
            ? 'bg-gray-100 ring-2 ring-blue-500' 
            : 'hover:bg-gray-50'
        }`}
        title="Dansk"
      >
        <DanishFlag className="w-5 h-5" />
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`p-1 rounded transition-colors ${
          language === 'en' 
            ? 'bg-gray-100 ring-2 ring-blue-500' 
            : 'hover:bg-gray-50'
        }`}
        title="American English"
      >
        <AmericanFlag className="w-5 h-5" />
      </button>
    </div>
  );
};

export default LanguageSwitcher;
