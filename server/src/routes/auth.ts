import express from 'express';
const router = express.Router();

router.post('/login', async (req, res) => {
  // TODO: 实现登录逻辑
  res.json({ message: '登录接口' });
});

export default router; 