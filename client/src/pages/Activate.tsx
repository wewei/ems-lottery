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
  DialogActions,
  ButtonGroup
} from '@mui/material';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/config';

const Activate: React.FC = () => {
  const { t } = useTranslation();
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
            message: t('activate.browserActivated')
          });
        }
      } catch (err) {
        console.error(t('activate.checkBrowserFailed'), err);
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
          t('activate.accountActivated') : 
          t('activate.accountNotActivated')
      });
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err.response?.data?.message || t('activate.checkFailed')
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
        message: t('activate.activateSuccess')
      });
      setUser(response.data.user);
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err.response?.data?.message || t('activate.activateFailed')
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
        message: t('activate.deactivateSuccess')
      });
      setDeactivateDialog(false);
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err.response?.data?.message || t('activate.deactivateFailed')
      });
      setDeactivateDialog(false);
    }
  };

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              {t('activate.title')}
            </Typography>
            <ButtonGroup variant="outlined" size="small">
              <Button 
                onClick={() => handleLanguageChange('zh')}
                disabled={i18n.language === 'zh'}
              >
                中文
              </Button>
              <Button 
                onClick={() => handleLanguageChange('en')}
                disabled={i18n.language === 'en'}
              >
                English
              </Button>
            </ButtonGroup>
          </Box>
          {(!user || !user.isActive) && (
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label={t('activate.enterAlias')}
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
                {t('activate.check')}
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
                {t('activate.activateAccount')}
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
                {t('activate.alias')}: {user.alias}
              </Typography>
              <Typography variant="body1">
                {t('activate.nickname')}: {user.nickname}
              </Typography>
              <Typography variant="body1">
                {t('activate.status')}: {user.isActive ? t('activate.active') : t('activate.inactive')}
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
                  {t('activate.deactivate')}
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
        <DialogTitle>{t('activate.confirmDeactivate')}</DialogTitle>
        <DialogContent>
          {t('activate.confirmDeactivateMessage', { nickname: user?.nickname, alias: user?.alias })}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeactivateDialog(false)}>{t('common.cancel')}</Button>
          <Button 
            onClick={handleDeactivate} 
            color="error"
            size="large"
          >
            {t('activate.confirmDeactivate')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Activate; 