import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';

interface Prize {
  _id: string;
  name: string;
  image: string;
  drawQuantity: number;
  remaining: number;
}

interface Winner {
  alias: string;
  nickname: string;
}

const LotteryDraw: React.FC = () => {
  const { prizeId } = useParams<{ prizeId: string }>();
  const navigate = useNavigate();
  const [prize, setPrize] = useState<Prize | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    // 检查认证状态
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // 添加认证请求头
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const fetchPrize = async () => {
      try {
        const response = await axios.get(`/api/prizes/${prizeId}`);
        setPrize(response.data.prize);
      } catch (err) {
        console.error('获取奖项信息失败', err);
        navigate('/lottery');
      }
    };

    fetchPrize();

    return () => {
      delete axios.defaults.headers.common['Authorization'];
    };
  }, [prizeId, navigate]);

  const handleDraw = async () => {
    if (!prize) return;

    setIsDrawing(true);
    try {
      const response = await axios.post(`/api/lottery/draw/${prizeId}`);
      setWinners(response.data.winners);
      setShowResult(true);
    } catch (err: any) {
      alert(err.response?.data?.message || '抽奖失败');
    } finally {
      setIsDrawing(false);
    }
  };

  if (!prize) {
    return null;
  }

  return (
    <>
      <Header title={prize?.name || '抽奖'} />
      <Container>
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
              本次将抽取: {prize.drawQuantity} 个
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleDraw}
              disabled={isDrawing || prize.remaining === 0}
              sx={{ mt: 2 }}
            >
              {isDrawing ? '抽奖中...' : '开始抽奖'}
            </Button>
          </Paper>
        </Box>

        <Dialog 
          open={showResult} 
          onClose={() => {
            setShowResult(false);
            window.location.reload(); // 刷新页面更新剩余数量
          }}
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
              onClick={() => {
                setShowResult(false);
                window.location.reload();
              }}
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