import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ButtonGroup } from '@mui/material';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'zh', label: '简体中文' },
    { code: 'zh-TW', label: '繁體中文' }
  ];

  const handleLanguageChange = (language: string) => {
    console.log('Switching language to:', language);
    i18n.changeLanguage(language);
  };

  return (
    <ButtonGroup variant="contained" size="small">
      {languages.map((lang) => (
        <Button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          disabled={i18n.language === lang.code}
        >
          {lang.label}
        </Button>
      ))}
    </ButtonGroup>
  );
};

export default LanguageSwitcher; 