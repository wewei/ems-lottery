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
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${prize.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: -1,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1
          }
        }}
      />
      <Container>
        <Box sx={{ mt: 2, mb: -2, position: 'relative', zIndex: 2 }}>
          <IconButton 
            onClick={() => navigate('/lottery')}
            title={t('common.back')}
            sx={{ color: 'white' }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Box>
        <Box 
          sx={{ 
            mt: 4, 
            textAlign: 'center',
            position: 'relative',
            zIndex: 2,
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Typography 
            variant="h2" 
            gutterBottom
            sx={{ 
              color: 'white',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              mb: 4
            }}
          >
            {prize.name}
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
            sx={{ 
              py: 3,
              px: 6,
              fontSize: '1.5rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              '&:hover': {
                transform: 'scale(1.05)',
                transition: 'transform 0.2s'
              }
            }}
          >
            {getButtonText()}
          </Button>

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