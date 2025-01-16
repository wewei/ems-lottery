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
  const { prizeId } = useParams<{ prizeId: string }>();
  const navigate = useNavigate();
  const [prize, setPrize] = useState<Prize | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [showResult, setShowResult] = useState(false);
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
        console.error('获取奖项信息失败', err);
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

  const handleSlotMachineStop = async (selectedIndexes: number[]) => {
    try {
      const selectedUsers = selectedIndexes.map(index => activeUsers[index]);
      const response = await api.post(`/api/lottery/draw/${prizeId}`, {
        winners: selectedUsers
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
      setWinners(response.data.winners);
      setShowResult(true);
    } catch (err: any) {
      alert(err.response?.data?.message || '抽奖失败');
    } finally {
      setIsDrawing(false);
      setIsSlotMachineVisible(false);
    }
  };

  const handleCloseResult = () => {
    setShowResult(false);
  };

  const getButtonText = () => {
    if (isDrawing) return '抽奖中...';
    if (!prize) return '加载中...';
    if (prize.remaining <= 0) return '已抽完';
    if (stats.activeUserCount < Math.min(prize.drawQuantity, prize.remaining)) return '激活用户不足';
    return '开始抽奖';
  };

  if (!prize) {
    return null;
  }

  return (
    <>
      <Header title={prize?.name || '抽奖'} />
      <Container>
        <Box sx={{ mt: 2, mb: -2 }}>
          <IconButton 
            onClick={() => navigate('/lottery')}
            title="返回抽奖列表"
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
              剩余数量: {prize.remaining}
            </Typography>
            <Typography variant="h6" gutterBottom>
              本次将抽取: {Math.min(prize.drawQuantity, prize.remaining)} 个
            </Typography>
            <Typography variant="h6" gutterBottom color="text.secondary">
               参与抽奖用户: {activeUsers.length} 人
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
            />
          )}
        </Box>

        <Dialog 
          open={showResult} 
          onClose={handleCloseResult}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            抽奖结果
          </DialogTitle>
          <DialogContent>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              {winners.map((winner, index) => (
                <Typography key={index} variant="h6" gutterBottom>
                  {winner.nickname} ({winner.alias})
                </Typography>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleCloseResult}
            >
              确定
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default LotteryDraw; 