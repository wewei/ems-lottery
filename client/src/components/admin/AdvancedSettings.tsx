import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Alert,
Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdvancedSettings: React.FC = () => {
    const [allowMultipleWins, setAllowMultipleWins] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get('/api/settings');
                setAllowMultipleWins(response.data.allowMultipleWins);
            } catch (err) {
                console.error('获取设置失败', err);
            }
        };
        fetchSettings();
    }, []);

    const handleToggleMultipleWins = async () => {
        try {
            const response = await axios.put('/api/settings', {
                allowMultipleWins: !allowMultipleWins
            });
            setAllowMultipleWins(response.data.allowMultipleWins);
            setMessage({ type: 'success', text: '设置已更新' });
        } catch (err) {
            setMessage({ type: 'error', text: '更新设置失败' });
        }
    };

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
        <Box>
            <Typography variant="h5" gutterBottom>
                高级选项
            </Typography>

            {message && (
                <Alert
                    severity={message.type}
                    sx={{ mb: 2 }}
                    onClose={() => setMessage(null)}
                >
                    {message.text}
                </Alert>
            )}

            <Paper sx={{ p: 3, mb: 3 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={allowMultipleWins}
                            onChange={handleToggleMultipleWins}
                        />
                    }
                    label="允许重复获奖"
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {allowMultipleWins ?
                        '用户可以获得多个不同奖项' :
                        '用户只能获得一个奖项'}
                </Typography>
            </Paper>

            <Paper sx={{ p: 3 }}>
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
            </Paper>
        </Box>
    );
};

export default AdvancedSettings; 