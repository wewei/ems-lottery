import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/axios';
import Header from '../components/Header';
import SlotMachine from '../components/SlotMachine';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface Prize {
  _id: string;
  name: string;
  image: string;
  drawQuantity: number;
  remaining: number;
}

interface Stats {
  activeUserCount: number;
}

interface Winner {
  alias: string;
  nickname: string;
}

interface ActiveUser {
  nickname: string;
  alias: string;
}

const LotteryDraw: React.FC = () => {
  const { t } = useTranslation();
  const { prizeId } = useParams<{ prizeId: string }>();
  const navigate = useNavigate();
  const [prize, setPrize] = useState<Prize | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [stats, setStats] = useState<Stats>({ activeUserCount: 0 });
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isSlotMachineVisible, setIsSlotMachineVisible] = useState(false);

  useEffect(() => {
    // 检查认证状态
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // 添加认证请求头
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const fetchData = async () => {
      try {
        const [prizeRes, statsRes, usersRes] = await Promise.all([
          api.get(`/api/prizes/${prizeId}`),
          api.get('/api/users/stats'),
          api.get('/api/users/active', {
            params: { prizeId }
          })
        ]);
        setPrize(prizeRes.data.prize);
        setStats(statsRes.data);
        setActiveUsers(usersRes.data.users);
      } catch (err) {
        console.error(t('lottery.fetchPrizeFailed'), err);
        navigate('/lottery');
      }
    };

    fetchData();

    return () => {
      delete api.defaults.headers.common['Authorization'];
    };
  }, [prizeId, navigate]);

  const handleDraw = async () => {
    setIsDrawing(true);
    setIsSlotMachineVisible(true);
  };

  const handleSlotMachineStop = async (users: ActiveUser[]) => {
    try {
      console.log('users', users);
      const response = await api.post(`/api/lottery/draw/${prizeId}`, {
        winners: users
      });
      const [prizeRes, statsRes, usersRes] = await Promise.all([
        api.get(`/api/prizes/${prizeId}`),
        api.get('/api/users/stats'),
        api.get('/api/users/active', {
          params: { prizeId }
        })
      ]);
      setPrize({
        ...prizeRes.data.prize,
        remaining: response.data.remaining
      });
      setStats(statsRes.data);
      setActiveUsers(usersRes.data.users);
    } catch (err: any) {
      alert(err.response?.data?.message || t('lottery.drawFailed'));
    } finally {
      setIsDrawing(false);
    }
  };

  const handleReturn = () => {
    console.log('handleReturn');
    setIsSlotMachineVisible(false);
    setIsDrawing(false);
  };

  const getButtonText = () => {
    if (isDrawing) return t('lottery.drawing');
    if (!prize) return t('common.loading');
    if (prize.remaining <= 0) return t('lottery.noPrize');
    if (stats.activeUserCount < Math.min(prize.drawQuantity, prize.remaining)) return t('lottery.notEnoughUsers');
    return t('lottery.start');
  };

  if (!prize) {
    return null;
  }

  return (
    <>
      <Header title={prize?.name || t('lottery.title')} />
      <Container>
        <Box sx={{ mt: 2, mb: -2 }}>
          <IconButton 
            onClick={() => navigate('/lottery')}
            title={t('common.back')}
          >
            <ArrowBackIcon />
          </IconButton>
        </Box>
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            {prize.name}
          </Typography>
          <Box sx={{ my: 3 }}>
            <img
              src={prize.image}
              alt={prize.name}
              style={{ 
                maxWidth: '100%',
                height: 'auto',
                maxHeight: '300px',
                objectFit: 'contain'
              }}
            />
          </Box>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('lottery.remaining')}: {prize.remaining}
            </Typography>
            <Typography variant="h6" gutterBottom>
              {t('lottery.drawQuantity')}: {Math.min(prize.drawQuantity, prize.remaining)} {t('common.people')}
            </Typography>
            <Typography variant="h6" gutterBottom color="text.secondary">
              {t('lottery.activeUsers')}: {activeUsers.length} {t('common.people')}
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleDraw}
              disabled={
                isDrawing || 
                prize.remaining <= 0 || 
                stats.activeUserCount < Math.min(prize.drawQuantity, prize.remaining)
              }
              sx={{ mt: 2 }}
            >
              {getButtonText()}
            </Button>
          </Paper>

          {isSlotMachineVisible && (
            <SlotMachine
              users={activeUsers}
              drawQuantity={Math.min(prize.drawQuantity, prize.remaining)}
              onStop={handleSlotMachineStop}
              onReturn={handleReturn}
            />
          )}
        </Box>
      </Container>
    </>
  );
};

export default LotteryDraw; 