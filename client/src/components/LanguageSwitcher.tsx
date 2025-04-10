import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ButtonGroup } from '@mui/material';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    console.log('Changing language to:', lng);
    i18n.changeLanguage(lng).then(() => {
      console.log('Language changed to:', i18n.language);
    });
  };

  return (
    <ButtonGroup variant="contained" size="small" sx={{ ml: 2 }}>
      <Button
        onClick={() => changeLanguage('zh')}
        color={i18n.language === 'zh' ? 'primary' : 'inherit'}
        disabled={i18n.language === 'zh'}
      >
        中文
      </Button>
      <Button
        onClick={() => changeLanguage('en')}
        color={i18n.language === 'en' ? 'primary' : 'inherit'}
        disabled={i18n.language === 'en'}
      >
        English
      </Button>
    </ButtonGroup>
  );
};

export default LanguageSwitcher; 