import React, { useState } from 'react';
import { TextField, Button, Container, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 实现登录逻辑
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="用户名"
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            fullWidth
            label="密码"
            type="password"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            sx={{ mt: 2 }}
          >
            登录
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default Login; 