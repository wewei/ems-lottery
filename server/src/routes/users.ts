import express, { Request, Response, Router, RequestHandler } from 'express';
import User from '../models/User';

const router: Router = express.Router();

// 创建用户
router.post('/', (async (req: Request, res: Response) => {
  try {
    const { alias, nickname } = req.body;

    // 检查必填字段
    if (!alias || !nickname) {
      return res.status(400).json({ message: '别名和昵称不能为空' });
    }

    // 检查别名是否已存在
    const existingUser = await User.findOne({ alias });
    if (existingUser) {
      return res.status(400).json({ message: '该别名已被使用' });
    }

    // 创建新用户
    const user = new User({
      alias,
      nickname,
      isActive: false
    });

    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}) as RequestHandler);

// 获取用户列表
router.get('/', (async (_req: Request, res: Response) => {
  try {
    const users = await User.find().sort({ alias: 1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}) as RequestHandler);

// 更新用户
router.put('/:id', (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const update = req.body;

    // 如果要更新别名，检查是否已存在
    if (update.alias) {
      const existingUser = await User.findOne({ 
        alias: update.alias,
        _id: { $ne: id }
      });
      if (existingUser) {
        return res.status(400).json({ message: '该别名已被使用' });
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      update,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}) as RequestHandler);

// 删除用户
router.delete('/:id', (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({ message: '用户已删除' });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}) as RequestHandler);

// ... 其他路由

export default router; 