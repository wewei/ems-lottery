import React, { useState, useEffect } from 'react';
import UID from 'uniquebrowserid';
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import axios from 'axios';

const Activate: React.FC = () => {
  const [alias, setAlias] = useState('');
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });
  const [user, setUser] = useState<{
    alias: string;
    nickname: string;
    isActive: boolean;
  } | null>(null);
  const [deactivateDialog, setDeactivateDialog] = useState(false);

  // 检查浏览器是否已激活某个用户
  useEffect(() => {
    const checkBrowserActivation = async () => {
      try {
        const response = await axios.get('/api/users/activated-by-browser', {
          params: { browserId: new UID().completeID() }
        });
        if (response.data.user) {
          setUser(response.data.user);
          setAlias(response.data.user.alias);
          setStatus({
            type: 'info',
            message: '此浏览器已激活账号'
          });
        }
      } catch (err) {
        console.error('检查浏览器激活状态失败', err);
      }
    };

    checkBrowserActivation();
  }, []);

  const handleCheck = async (checkAlias: string = alias) => {
    try {
      const response = await axios.get(`/api/users/check/${checkAlias}`);
      setUser(response.data.user);
      setStatus({
        type: 'info',
        message: response.data.user.isActive ? 
          '您的账号已激活' : 
          '您的账号尚未激活，可以点击下方按钮激活'
      });
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err.response?.data?.message || '查询失败'
      });
      setUser(null);
    }
  };

  const handleActivate = async () => {
    try {
      const response = await axios.post(`/api/users/activate/${alias}`, {
        browserId: new UID().completeID()
      });
      setStatus({
        type: 'success',
        message: '激活成功！'
      });
      setUser(response.data.user);
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err.response?.data?.message || '激活失败'
      });
    }
  };

  const handleDeactivate = async () => {
    try {
      await axios.post(`/api/users/deactivate/${alias}`);
      setUser(null);
      setAlias('');
      setStatus({ 
        type: 'success', 
        message: '已撤销激活' 
      });
      setDeactivateDialog(false);
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err.response?.data?.message || '撤销激活失败'
      });
      setDeactivateDialog(false);
    }
  };

  return (
    <Container 
      maxWidth="sm" 
      sx={{ 
        px: { xs: 2, sm: 3 },
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start'
      }}
    >
      <Box sx={{ mt: { xs: 8, sm: 10 } }}>
        <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: { xs: 0, sm: 1 } }}>
          <Typography variant="h5" gutterBottom>
            账号激活
          </Typography>
          {(!user || !user.isActive) && (
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="请输入您的别名"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: { xs: 1, sm: 1 }
                  }
                }}
                size="medium"
                autoComplete="off"
                autoCapitalize="off"
              />
              <Button
                variant="contained"
                onClick={() => handleCheck()}
                disabled={!alias.trim()}
                fullWidth
                size="large"
                sx={{ 
                  borderRadius: { xs: 1, sm: 1 },
                  py: 1.5
                }}
              >
                查询
              </Button>
            </Box>
          )}

          {status.type && (
            <Alert 
              severity={status.type} 
              sx={{ 
                mb: 2,
                borderRadius: { xs: 1, sm: 1 }
              }}
            >
              {status.message}
            </Alert>
          )}

          {user && !user.isActive && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="success"
                onClick={handleActivate}
                fullWidth
                size="large"
                sx={{ 
                  borderRadius: { xs: 1, sm: 1 },
                  py: 1.5
                }}
              >
                激活账号
              </Button>
            </Box>
          )}

          {user && (
            <Box sx={{ 
              mt: 3,
              p: 2, 
              bgcolor: 'grey.50',
              borderRadius: { xs: 1, sm: 1 }
            }}>
              <Typography variant="body1">
                别名：{user.alias}
              </Typography>
              <Typography variant="body1">
                昵称：{user.nickname}
              </Typography>
              <Typography variant="body1">
                状态：{user.isActive ? '已激活' : '未激活'}
              </Typography>
              {user.isActive && (
                <Button
                  variant="text"
                  color="error"
                  onClick={() => setDeactivateDialog(true)}
                  sx={{ 
                    mt: 2,
                    borderRadius: { xs: 1, sm: 1 }
                  }}
                  size="large"
                >
                  撤销激活
                </Button>
              )}
            </Box>
          )}
        </Paper>
      </Box>
      <Dialog 
        open={deactivateDialog} 
        onClose={() => setDeactivateDialog(false)}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: { xs: '90%', sm: 400 },
            position: 'relative',
            top: { xs: '-10vh', sm: '-15vh' }
          }
        }}
      >
        <DialogTitle>确认撤销激活</DialogTitle>
        <DialogContent>
          确定要撤销 {user?.nickname} ({user?.alias}) 的激活状态吗？
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeactivateDialog(false)}>取消</Button>
          <Button 
            onClick={handleDeactivate} 
            color="error"
            size="large"
          >
            确认撤销
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Activate; 