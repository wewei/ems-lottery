import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import prizeRoutes from './routes/prize';
import lotteryRoutes from './routes/lottery';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// 连接 MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lottery');

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/prizes', prizeRoutes);
app.use('/api/lottery', lotteryRoutes);

// 服务静态文件
app.use(express.static(path.resolve(__dirname, 'public')));

// 所有其他请求返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 