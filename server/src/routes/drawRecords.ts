import express, { Request, Response, RequestHandler } from 'express';
import DrawRecord from '../models/DrawRecord';

const router = express.Router();

// 获取抽奖记录列表
router.get('/', (async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      DrawRecord.find()
        .sort({ drawTime: -1 })
        .skip(skip)
        .limit(limit),
      DrawRecord.countDocuments()
    ]);

    res.json({
      records,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}) as RequestHandler);

// 获取用户的中奖记录
router.get('/user/:alias', (async (req: Request, res: Response) => {
  try {
    const { alias } = req.params;
    const records = await DrawRecord.find({ 'winners.alias': alias })
      .sort({ drawTime: -1 });
    
    res.json({ records });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}) as RequestHandler);

// 获取奖项的抽奖记录
router.get('/prize/:prizeId', (async (req: Request, res: Response) => {
  try {
    const { prizeId } = req.params;
    const records = await DrawRecord.find({ prizeId })
      .sort({ drawTime: -1 });
    
    res.json({ records });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}) as RequestHandler);

// 删除抽奖记录
router.delete('/:id', (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const record = await DrawRecord.findByIdAndDelete(id);

    if (!record) {
      return res.status(404).json({ message: '记录不存在' });
    }

    res.json({ message: '记录已删除' });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}) as RequestHandler);

export default router; 