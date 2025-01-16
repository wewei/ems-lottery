import express, { Request, Response, RequestHandler } from 'express';
import Prize from '../models/Prize';
import DrawRecord from '../models/DrawRecord';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 给所有抽奖路由添加认证中间件
router.use('/', authenticateToken as RequestHandler);

interface Winner {
  alias: string;
  nickname: string;
}

// 抽奖
router.post('/draw/:prizeId', (async (req: Request, res: Response) => {
  try {
    const { prizeId } = req.params;
    const { winners } = req.body as { winners: Winner[] };
    
    // 获取奖项信息和已抽取数量
    const [prize, drawnCount] = await Promise.all([
      Prize.findById(prizeId),
      DrawRecord.aggregate([
        { $match: { prizeId: new mongoose.Types.ObjectId(prizeId) } },
        { $group: { _id: null, total: { $sum: { $size: '$winners' } } } }
      ])
    ]);

    if (!prize) {
      return res.status(404).json({ message: '奖项不存在' });
    }

    const remaining = prize.totalQuantity - (drawnCount[0]?.total || 0);

    // 检查剩余数量
    if (remaining < winners.length) {
      return res.status(400).json({ message: '奖品数量不足' });
    }

    // 验证中奖用户数量
    if (!winners || winners.length === 0 || winners.length > prize.drawQuantity) {
      return res.status(400).json({ message: '中奖用户数量不正确' });
    }

    // 记录抽奖结果
    const drawRecord = new DrawRecord({
      drawTime: new Date(),
      prizeId: prize._id,
      prizeName: prize.name,
      winners: winners.map(w => ({
        alias: w.alias,
        nickname: w.nickname
      }))
    });
    await drawRecord.save();

    res.json({ 
      winners,
      remaining: remaining - winners.length
    });
  } catch (err) {
    console.error('抽奖失败:', err);
    res.status(500).json({ message: '抽奖失败' });
  }
}) as RequestHandler);

export default router; 