import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import prizeRoutes from './routes/prize';
import lotteryRoutes from './routes/lottery';
import userRoutes from './routes/users';
import drawRecordRoutes from './routes/drawRecords';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();

const isDev = process.env.NODE_ENV === 'development';

const app = express();

app.use(cors());
app.use(express.json());

// 连接 MongoDB
mongoose.connect(process.env.AZURE_COSMOS_CONNECTIONSTRING || process.env.MONGODB_URI || 'mongodb://localhost:27017/lottery');

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/prizes', prizeRoutes);
app.use('/api/lottery', lotteryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/draw-records', drawRecordRoutes);

// 开发环境代理到 Vite
if (isDev) {
  app.use('/', createProxyMiddleware({
    target: 'http://localhost:5173',
    changeOrigin: true,
    ws: true,
  }));
} else {
  // 生产环境服务静态文件
  app.use(express.static(path.resolve(__dirname, 'public')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
  });
}

// Azure Web Apps 使用环境变量 WEBSITE_HOSTNAME 来指示应用程序的主机名
const PORT = process.env.PORT || process.env.WEBSITE_PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 