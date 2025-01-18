import express, { Request, Response, RequestHandler } from 'express';
import Setting from '../models/Setting';
import User from '../models/User';
import Prize from '../models/Prize';
import DrawRecord from '../models/DrawRecord';
import Admin from '../models/Admin';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 获取设置
router.get('/', authenticateToken as RequestHandler, (async (req: Request, res: Response) => {
  try {
    const settings = await Setting.getInstance();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: '获取设置失败' });
  }
}) as RequestHandler);

// 更新设置
router.post('/', authenticateToken as RequestHandler, (async (req: Request, res: Response) => {
  try {
    const { allowMultipleWins } = req.body;
    const settings = await Setting.getInstance();
    settings.allowMultipleWins = allowMultipleWins;
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: '更新设置失败' });
  }
}) as RequestHandler);

// 重置系统
router.post('/reset-system', authenticateToken as RequestHandler, (async (req: Request, res: Response) => {
  try {
    // 删除所有数据
    await Promise.all([
      User.deleteMany({}),
      Prize.deleteMany({}),
      DrawRecord.deleteMany({}),
      Setting.deleteMany({}),
      Admin.deleteMany({})
    ]);

    // 重置系统设置
    await Setting.create({ allowMultipleWins: false });

    res.json({ message: '系统已重置' });
  } catch (err) {
    console.error('重置系统失败:', err);
    res.status(500).json({ message: '重置系统失败' });
  }
}) as RequestHandler);

export default router; 