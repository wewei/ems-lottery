import React from 'react';
import { Box, Button, AppBar, Toolbar, Typography, Link } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <AppBar position="static" sx={{ mb: 3 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        <Button
          color="inherit"
          startIcon={isAdmin ? <CardGiftcardIcon /> : <AdminPanelSettingsIcon />}
          onClick={() => navigate(isAdmin ? '/lottery' : '/admin')}
          sx={{ mr: 2 }}
        >
          {isAdmin ? '抽奖页面' : '管理后台'}
        </Button>
        <Button 
          color="inherit" 
          onClick={handleLogout}
          startIcon={<LogoutIcon />}
        >
          退出登录
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 