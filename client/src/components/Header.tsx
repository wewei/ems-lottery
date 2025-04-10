import React from 'react';
import { Box, Button, AppBar, Toolbar, Typography } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const { t } = useTranslation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <AppBar position="static" sx={{ mb: 3 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {t(title)}
        </Typography>
        <Button
          color="inherit"
          startIcon={isAdmin ? <CardGiftcardIcon /> : <AdminPanelSettingsIcon />}
          onClick={() => navigate(isAdmin ? '/lottery' : '/admin')}
          sx={{ mr: 2 }}
        >
          {isAdmin ? t('lottery.title') : t('common.admin')}
        </Button>
        <Button 
          color="inherit" 
          onClick={handleLogout}
          startIcon={<LogoutIcon />}
        >
          {t('common.logout')}
        </Button>
        <LanguageSwitcher />
      </Toolbar>
    </AppBar>
  );
};

export default Header; 