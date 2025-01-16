import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';

interface Prize {
  _id: string;
  name: string;
  image: string;
  totalQuantity: number;
  drawQuantity: number;
  remaining: number;
}

const Lottery: React.FC = () => {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const fetchPrizes = async () => {
      try {
        const response = await axios.get('/api/prizes');
        setPrizes(response.data.prizes);
      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
        console.error('获取奖项列表失败', err);
      }
    };

    fetchPrizes();

    return () => {
      delete axios.defaults.headers.common['Authorization'];
    };
  }, [navigate]);

  return (
    <>
      <Header title="抽奖" />
      <Container>
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            抽奖
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {prizes.map((prize) => (
            <Grid item xs={12} sm={6} md={4} key={prize._id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 6
                  }
                }}
                onClick={() => navigate(`/lottery/${prize._id}`)}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={prize.image}
                  alt={prize.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    {prize.name}
                  </Typography>
                  <Typography>
                    剩余数量: {prize.remaining}
                  </Typography>
                  <Typography>
                    每次抽取: {prize.drawQuantity}
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2 }}
                    disabled={prize.remaining === 0}
                  >
                    {prize.remaining > 0 ? '开始抽奖' : '已抽完'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
};

export default Lottery; 