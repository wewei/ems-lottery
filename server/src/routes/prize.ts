import express from 'express';
const router = express.Router();

router.get('/', async (req, res) => {
  // TODO: 获取奖品列表
  res.json({ message: '奖品列表' });
});

export default router; 