import express, { Request, Response, RequestHandler } from 'express';
import Prize from '../models/Prize';
import User from '../models/User';
import DrawRecord from '../models/DrawRecord';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 给所有抽奖路由添加认证中间件
router.use('/', authenticateToken as RequestHandler);

// 抽奖
router.post('/draw/:prizeId', (async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { prizeId } = req.params;
    
    // 获取奖项信息
    const prize = await Prize.findById(prizeId).session(session);
    if (!prize) {
      await session.abortTransaction();
      return res.status(404).json({ message: '奖项不存在' });
    }

    // 检查剩余数量
    if (prize.remaining < prize.drawQuantity) {
      await session.abortTransaction();
      return res.status(400).json({ message: '奖品数量不足' });
    }

    // 获取所有已激活但未中奖的用户
    const winners = await User.aggregate([
      { 
        $match: { 
          isActive: true,
          // 这里可以添加其他条件，比如未中过奖的用户
        } 
      },
      { $sample: { size: prize.drawQuantity } }
    ]).session(session);

    if (winners.length < prize.drawQuantity) {
      await session.abortTransaction();
      return res.status(400).json({ message: '可参与用户数量不足' });
    }

    // 更新奖品剩余数量
    prize.remaining -= prize.drawQuantity;
    await prize.save({ session });

    // 记录抽奖结果
    const drawRecord = new DrawRecord({
      drawTime: new Date(),
      prizeId: prize._id,
      prizeName: prize.name,
      drawQuantity: prize.drawQuantity,
      winners: winners.map(w => ({
        alias: w.alias,
        nickname: w.nickname
      }))
    });
    await drawRecord.save({ session });

    await session.commitTransaction();
    res.json({ 
      winners: winners.map(w => ({
        alias: w.alias,
        nickname: w.nickname
      }))
    });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: '抽奖失败' });
  } finally {
    session.endSession();
  }
}) as RequestHandler);

export default router; 