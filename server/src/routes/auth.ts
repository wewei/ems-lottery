import express, { Request, Response, Router, RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';
import { generateRandomPassword } from '../utils/password';

const router: Router = express.Router();

interface AdminRequest extends Request {
  body: {
    password: string;
  };
}

interface AdminDocument extends Document {
  password: string;
}

// 检查管理员是否已初始化
router.get('/check-admin', async (_req: Request, res: Response) => {
  try {
    const admin = await Admin.findOne();
    res.json({ initialized: !!admin });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 初始化管理员
router.post('/init', (async (req: AdminRequest, res: Response) => {
  try {
    // 检查是否已经初始化
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      return res.status(400).json({ message: '管理员已经初始化' });
    }

    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // 创建管理员
    const admin = new Admin({ password: hashedPassword });
    await admin.save();

    // 生成 token
    const token = jwt.sign(
      { isAdmin: true },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}) as RequestHandler);

// 管理员登录
router.post('/login', (async (req: AdminRequest, res: Response) => {
  try {
    const admin = await Admin.findOne() as AdminDocument | null;
    if (!admin) {
      return res.status(400).json({ message: '管理员未初始化' });
    }

    // 验证密码
    const validPassword = await bcrypt.compare(
      req.body.password,
      admin.password as string
    );
    if (!validPassword) {
      return res.status(400).json({ message: '密码错误' });
    }

    // 生成 token
    const token = jwt.sign(
      { isAdmin: true },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}) as RequestHandler);

// 重置管理员密码
router.post('/reset-password', (async (req: Request, res: Response) => {
  try {
    const admin = await Admin.findOne();
    if (!admin) {
      return res.status(400).json({ message: '管理员未初始化' });
    }

    // 删除管理员记录
    await Admin.deleteOne({ _id: admin._id });

    res.json({ 
      message: '管理员已重置'
    });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}) as RequestHandler);

export default router; 