import React, { useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PasswordReset: React.FC = () => {
  const [resetDialog, setResetDialog] = useState(false);
  const navigate = useNavigate();

  const handlePasswordReset = async () => {
    try {
      await axios.post('/api/auth/reset-password');
      alert('管理员已重置，请重新初始化');
      localStorage.removeItem('token');
      navigate('/login');
    } catch (err) {
      alert('密码修改失败');
    }
    setResetDialog(false);
  };

  return (
    <>
      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          color="warning"
          onClick={() => setResetDialog(true)}
          sx={{ mt: 2 }}
        >
          重置管理员密码
        </Button>
      </Box>

      <Dialog open={resetDialog} onClose={() => setResetDialog(false)}>
        <DialogTitle>确认重置密码</DialogTitle>
        <DialogContent>
          <Typography>
            确定要重置管理员密码吗？重置后将返回登录页面。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialog(false)}>取消</Button>
          <Button onClick={handlePasswordReset} color="warning">
            确认重置
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PasswordReset; 