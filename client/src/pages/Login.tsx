import React, { useState, useEffect } from 'react';
import { TextField, Button, Container, Box, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const response = await axios.get('/api/auth/check-admin');
      setIsInitialized(response.data.initialized);
    } catch (err) {
      setError('检查管理员状态失败');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!isInitialized) {
        // 初始化管理员
        if (password !== confirmPassword) {
          setError('两次输入的密码不一致');
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
      setError(err.response?.data?.message || '操作失败');
    }
  };

  if (isInitialized === null) {
    return <Box sx={{ mt: 8, textAlign: 'center' }}>加载中...</Box>;
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          {isInitialized ? '管理员登录' : '初始化管理员'}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="密码"
            type="password"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          {!isInitialized && (
            <TextField
              fullWidth
              label="确认密码"
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
            {isInitialized ? '登录' : '初始化'}
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default Login; 