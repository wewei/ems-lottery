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
import { useTranslation } from 'react-i18next';
import api from '../utils/axios';
import Header from '../components/Header';
import FloatingQRCode from '../components/FloatingQRCode';

interface Prize {
  _id: string;
  name: string;
  image: string;
  totalQuantity: number;
  drawQuantity: number;
  remaining: number;
}

interface Stats {
  activeUserCount: number;
}

const Lottery: React.FC = () => {
  const { t } = useTranslation();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [stats, setStats] = useState<Stats>({ activeUserCount: 0 });
  const navigate = useNavigate();
  const activateUrl = `${window.location.origin}/activate`;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const fetchData = async () => {
      try {
        const [prizesRes, statsRes] = await Promise.all([
          api.get('/api/prizes'),
          api.get('/api/users/stats')
        ]);
        setPrizes(prizesRes.data.prizes);
        setStats(statsRes.data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
        console.error(t('lottery.fetchPrizesFailed'), err);
      }
    };

    fetchData();

    return () => {
      delete api.defaults.headers.common['Authorization'];
    };
  }, [navigate]);

  return (
    <>
      <Header title={t('lottery.title')} />
      <Container>
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            {t('lottery.title')}
          </Typography>
          <Typography variant="subtitle1" align="center" color="text.secondary">
            {t('lottery.activeUsers')}: {stats.activeUserCount} {t('common.people')}
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
                  cursor: prize.remaining > 0 ? 'pointer' : 'not-allowed',
                  opacity: prize.remaining > 0 ? 1 : 0.6,
                  '&:hover': {
                    boxShadow: prize.remaining > 0 ? 6 : 1
                  }
                }}
                onClick={() => {
                  if (prize.remaining > 0) {
                    navigate(`/lottery/${prize._id}`);
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={prize.image}
                  alt={prize.name}
                  sx={{ 
                    objectFit: 'cover',
                    filter: prize.remaining === 0 ? 'grayscale(100%)' : 'none'
                  }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    {prize.name}
                  </Typography>
                  <Typography>
                    {t('lottery.remaining')}: {prize.remaining}
                  </Typography>
                  <Typography>
                    {t('lottery.drawQuantity')}: {prize.drawQuantity}
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2 }}
                    disabled={prize.remaining === 0 || stats.activeUserCount < prize.drawQuantity}
                  >
                    {prize.remaining === 0 ? t('lottery.noPrize') : 
                     stats.activeUserCount < prize.drawQuantity ? 
                     t('lottery.notEnoughUsers') : t('lottery.start')}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
      <FloatingQRCode url={activateUrl} />
    </>
  );
};

export default Lottery; 