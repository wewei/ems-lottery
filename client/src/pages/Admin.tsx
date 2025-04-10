import React, { useEffect } from 'react';
import { Container, Box, Paper, Tabs, Tab } from '@mui/material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // 根据当前路径设置选中的标签
  const getCurrentTab = () => {
    const path = location.pathname.split('/')[2] || 'password';
    const tabMap: { [key: string]: number } = {
      prizes: 0,
      users: 1,
      records: 2,
      settings: 3
    };
    return tabMap[path] || 0;
  };

  useEffect(() => {
    // 认证相关的拦截器设置
    const interceptor = axios.interceptors.request.use(
      config => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [navigate]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    const paths = ['prizes', 'users', 'records', 'settings'];
    navigate(`/admin/${paths[newValue]}`);
  };

  return (
    <>
      <Header title={t('common.admin')} />
      <Container>
        <Box sx={{ width: '100%', mt: 4 }}>
          <Paper>
            <Tabs value={getCurrentTab()} onChange={handleTabChange}>
              <Tab label={t('lottery.management')} />
              <Tab label={t('user.management')} />
              <Tab label={t('drawRecord.management')} />
              <Tab label={t('admin.settings')} />
            </Tabs>
            <Box sx={{ p: 3 }}>
              <Outlet />
            </Box>
          </Paper>
        </Box>
      </Container>
    </>
  );
};

export default Admin; 