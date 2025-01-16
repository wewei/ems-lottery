import express from 'express';
const router = express.Router();

router.post('/draw', async (req, res) => {
  // TODO: 实现抽奖逻辑
  res.json({ message: '抽奖接口' });
});

export default router; 