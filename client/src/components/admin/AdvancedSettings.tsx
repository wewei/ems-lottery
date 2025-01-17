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
  TextField
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axios';

const AdvancedSettings: React.FC = () => {
    const [allowMultipleWins, setAllowMultipleWins] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/api/settings');
                setAllowMultipleWins(response.data.allowMultipleWins);
            } catch (err) {
                console.error('获取设置失败', err);
            }
        };
        fetchSettings();
    }, []);

    const handleToggleMultipleWins = async () => {
        try {
            const response = await api.put('/api/settings', {
                allowMultipleWins: !allowMultipleWins
            });
            setAllowMultipleWins(response.data.allowMultipleWins);
            setMessage({ type: 'success', text: '设置已更新' });
        } catch (err) {
            setMessage({ type: 'error', text: '更新设置失败' });
        }
    };

    const [resetDialog, setResetDialog] = useState(false);
    const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
    const [resetConfirmation, setResetConfirmation] = useState('');
    const RESET_CONFIRMATION_TEXT = '我确认重置数据';

    const handlePasswordReset = async () => {
        try {
            await api.post('/api/auth/reset-password');
            alert('管理员已重置，请重新初始化');
            localStorage.removeItem('token');
            navigate('/login');
        } catch (err) {
            alert('密码修改失败');
        }
        setResetPasswordDialog(false);
    };

    const handleResetSystem = async () => {
        if (resetConfirmation !== RESET_CONFIRMATION_TEXT) {
            alert('确认文本不匹配');
            return;
        }
        
        try {
            await api.post('/api/settings/reset-system');
            alert('系统已重置');
            localStorage.removeItem('token');
            navigate('/login');
        } catch (err) {
            alert('系统重置失败');
        }
        setResetDialog(false);
        setResetConfirmation('');
    };

    const navigate = useNavigate();

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

            <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" color="error" gutterBottom>
                    危险区域
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: 'row' }}>
                    <Button
                        variant="contained"
                        color="warning"
                        onClick={() => setResetPasswordDialog(true)}
                        sx={{ mt: 2 }}
                    >
                        重置管理员密码
                    </Button>

                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => setResetDialog(true)}
                        sx={{ mt: 2 }}
                    >
                        重置系统
                    </Button>
                </Box>
            </Paper>
            <Dialog open={resetPasswordDialog} onClose={() => setResetPasswordDialog(false)}>
                <DialogTitle>确认重置密码</DialogTitle>
                <DialogContent>
                    <Typography>
                        确定要重置管理员密码吗？重置后将返回登录页面。
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResetPasswordDialog(false)}>取消</Button>
                    <Button onClick={handlePasswordReset} color="warning">
                        确认重置
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={resetDialog}
                onClose={() => {
                    setResetDialog(false);
                    setResetConfirmation('');
                }}
            >
                <DialogTitle>系统重置确认</DialogTitle>
                <DialogContent>
                    <Typography color="error" paragraph sx={{ mt: 2 }}>
                        警告：此操作将删除所有数据！包括：
                    </Typography>
                    <ul>
                        <li>所有用户信息</li>
                        <li>所有奖品设置</li>
                        <li>所有抽奖记录</li>
                        <li>所有系统设置</li>
                    </ul>
                    <Typography paragraph>
                        此操作不可撤销！如果确定要重置系统，请在下方输入：
                    </Typography>
                    <Typography
                        component="div"
                        sx={{
                            bgcolor: 'grey.100',
                            p: 1,
                            borderRadius: 1,
                            fontWeight: 'bold',
                            mb: 2
                        }}
                    >
                        {RESET_CONFIRMATION_TEXT}
                    </Typography>
                    <TextField
                        fullWidth
                        value={resetConfirmation}
                        onChange={(e) => setResetConfirmation(e.target.value)}
                        placeholder="请输入确认文本"
                        error={resetConfirmation !== '' && resetConfirmation !== RESET_CONFIRMATION_TEXT}
                        helperText={
                            resetConfirmation !== '' &&
                            resetConfirmation !== RESET_CONFIRMATION_TEXT &&
                            '确认文本不匹配'
                        }
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setResetDialog(false);
                            setResetConfirmation('');
                        }}
                    >
                        取消
                    </Button>
                    <Button
                        onClick={handleResetSystem}
                        color="error"
                        disabled={resetConfirmation !== RESET_CONFIRMATION_TEXT}
                    >
                        确认重置
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdvancedSettings; 