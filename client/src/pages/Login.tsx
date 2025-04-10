import React, { useState, useEffect } from 'react';
import { TextField, Button, Container, Box, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';

const Login: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const response = await axios.get('/api/auth/check-admin');
      setIsInitialized(response.data.initialized);
    } catch (err) {
      setError(t('auth.checkAdminFailed'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!isInitialized) {
        // 初始化管理员
        if (password !== confirmPassword) {
          setError(t('auth.passwordsNotMatch'));
          return;
        }
        const response = await axios.post('/api/auth/init', { password });
        localStorage.setItem('token', response.data.token);
      } else {
        // 登录
        const response = await axios.post('/api/auth/login', { password });
        localStorage.setItem('token', response.data.token);
      }
      navigate('/admin'); // 登录成功后跳转
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.operationFailed'));
    }
  };

  if (isInitialized === null) {
    return <Box sx={{ mt: 8, textAlign: 'center' }}>{t('common.loading')}</Box>;
  }

  return (
    <>
      <Header title="auth.login" />
      <Container maxWidth="sm">
        <Box sx={{ mt: 8 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            {isInitialized ? t('auth.adminLogin') : t('auth.initAdmin')}
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label={t('auth.password')}
              type="password"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            
            {!isInitialized && (
              <TextField
                fullWidth
                label={t('auth.confirmPassword')}
                type="password"
                margin="normal"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            )}

            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              sx={{ mt: 3 }}
            >
              {isInitialized ? t('auth.login') : t('auth.initialize')}
            </Button>
          </form>
        </Box>
      </Container>
    </>
  );
};

export default Login; 