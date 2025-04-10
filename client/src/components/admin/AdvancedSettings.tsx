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
import { useTranslation } from 'react-i18next';
import api from '../../utils/axios';

const AdvancedSettings: React.FC = () => {
    const { t } = useTranslation();
    const [allowMultipleWins, setAllowMultipleWins] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/api/settings');
                setAllowMultipleWins(response.data.allowMultipleWins);
            } catch (err) {
                console.error(t('admin.fetchSettingsFailed'), err);
            }
        };
        fetchSettings();
    }, []);

    const handleToggleMultipleWins = async () => {
        try {
            const response = await api.post('/api/settings', {
                allowMultipleWins: !allowMultipleWins
            });
            setAllowMultipleWins(response.data.allowMultipleWins);
            setMessage({ type: 'success', text: t('admin.settingsUpdated') });
        } catch (err) {
            setMessage({ type: 'error', text: t('admin.updateSettingsFailed') });
        }
    };

    const [resetDialog, setResetDialog] = useState(false);
    const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
    const [resetConfirmation, setResetConfirmation] = useState('');
    const RESET_CONFIRMATION_TEXT = t('admin.resetConfirmationText');

    const handlePasswordReset = async () => {
        try {
            await api.post('/api/auth/reset-password');
            alert(t('admin.passwordResetSuccess'));
            localStorage.removeItem('token');
            navigate('/login');
        } catch (err) {
            alert(t('admin.passwordResetFailed'));
        }
        setResetPasswordDialog(false);
    };

    const handleResetSystem = async () => {
        if (resetConfirmation !== RESET_CONFIRMATION_TEXT) {
            alert(t('admin.confirmationTextMismatch'));
            return;
        }
        
        try {
            await api.post('/api/settings/reset-system');
            alert(t('admin.systemResetSuccess'));
            localStorage.removeItem('token');
            navigate('/login');
        } catch (err) {
            alert(t('admin.systemResetFailed'));
        }
        setResetDialog(false);
        setResetConfirmation('');
    };

    const navigate = useNavigate();

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                {t('admin.settings')}
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
                    label={t('admin.allowMultipleWins')}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {allowMultipleWins ?
                        t('admin.multipleWinsEnabled') :
                        t('admin.multipleWinsDisabled')}
                </Typography>
            </Paper>

            <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" color="error" gutterBottom>
                    {t('admin.dangerZone')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: 'row' }}>
                    <Button
                        variant="contained"
                        color="warning"
                        onClick={() => setResetPasswordDialog(true)}
                        sx={{ mt: 2 }}
                    >
                        {t('admin.resetPassword')}
                    </Button>

                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => setResetDialog(true)}
                        sx={{ mt: 2 }}
                    >
                        {t('admin.resetSystem')}
                    </Button>
                </Box>
            </Paper>
            <Dialog open={resetPasswordDialog} onClose={() => setResetPasswordDialog(false)}>
                <DialogTitle>{t('admin.confirmResetPassword')}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {t('admin.confirmResetPasswordMessage')}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResetPasswordDialog(false)}>{t('common.cancel')}</Button>
                    <Button onClick={handlePasswordReset} color="warning">
                        {t('admin.confirmReset')}
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
                <DialogTitle>{t('admin.systemResetConfirm')}</DialogTitle>
                <DialogContent>
                    <Typography color="error" paragraph sx={{ mt: 2 }}>
                        {t('admin.systemResetWarning')}
                    </Typography>
                    <ul>
                        <li>{t('admin.resetData.userInfo')}</li>
                        <li>{t('admin.resetData.prizeSettings')}</li>
                        <li>{t('admin.resetData.drawRecords')}</li>
                        <li>{t('admin.resetData.systemSettings')}</li>
                    </ul>
                    <Typography paragraph>
                        {t('admin.systemResetIrreversible')}
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
                        placeholder={t('admin.enterConfirmationText')}
                        error={resetConfirmation !== '' && resetConfirmation !== RESET_CONFIRMATION_TEXT}
                        helperText={
                            resetConfirmation !== '' &&
                            resetConfirmation !== RESET_CONFIRMATION_TEXT &&
                            t('admin.confirmationTextMismatch')
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
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleResetSystem}
                        color="error"
                        disabled={resetConfirmation !== RESET_CONFIRMATION_TEXT}
                    >
                        {t('admin.confirmReset')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdvancedSettings; 