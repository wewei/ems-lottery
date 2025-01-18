import express, { RequestHandler } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import prizeRoutes from './routes/prize';
import lotteryRoutes from './routes/lottery';
import userRoutes from './routes/users';
import drawRecordRoutes from './routes/drawRecords';
import settingsRoutes from './routes/settings';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authenticateToken } from './middleware/auth';

dotenv.config();

const isDev = process.env.NODE_ENV === 'development';

const app = express();

// 配置 body-parser 限制
app.use(express.json({ limit: '10mb' }));  // 增加 JSON 请求体大小限制
app.use(express.urlencoded({ limit: '10mb', extended: true }));  // 增加 URL 编码请求体大小限制

app.use(cors());

// MongoDB 连接配置
const mongoUri = process.env.AZURE_COSMOS_CONNECTIONSTRING || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lottery';

// 连接 MongoDB
mongoose.connect(mongoUri)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

// 监听数据库连接事件
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

// 添加调试中间件
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/prizes', authenticateToken as RequestHandler, prizeRoutes);
app.use('/api/lottery', authenticateToken as RequestHandler, lotteryRoutes);
app.use('/api/draw-records', authenticateToken as RequestHandler, drawRecordRoutes);
app.use('/api/settings', authenticateToken as RequestHandler, settingsRoutes);
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