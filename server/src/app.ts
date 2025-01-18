import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';

const app = express();

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// 认证路由不需要验证
app.use('/api/auth', authRoutes);

// 其他 API 路由需要认证

// ... 其他代码 