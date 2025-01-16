import express, { Request, Response, RequestHandler } from 'express';
import Setting from '../models/Setting';
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
router.put('/', authenticateToken as RequestHandler, (async (req: Request, res: Response) => {
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

export default router; 