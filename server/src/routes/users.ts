import express, { Request, Response, Router, RequestHandler } from 'express';
import User from '../models/User';

interface ImportUser {
  alias: string;
  nickname: string;
}

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
router.get('/', (async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string || '').trim();
    const skip = (page - 1) * limit;

    // 构建搜索条件
    const searchQuery = search ? {
      $or: [
        { alias: { $regex: search, $options: 'i' } },
        { nickname: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const [users, total] = await Promise.all([
      User.find()
        .where(searchQuery)
        .sort({ alias: 1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(searchQuery)
    ]);

    res.json({ 
      users,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
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

// 预览导入数据
router.post('/preview-import', (async (req: Request, res: Response) => {
  try {
    const { users } = req.body as { users: ImportUser[] };
    const newUsers: typeof users = [];
    const updateUsers: typeof users = [];
    const unchangedUsers: typeof users = [];

    for (const user of users as ImportUser[]) {
      const existingUser = await User.findOne({ alias: user.alias });
      if (existingUser) {
        if (existingUser.nickname === user.nickname) {
          unchangedUsers.push(user);
        } else {
          updateUsers.push(user);
        }
      } else {
        newUsers.push(user);
      }
    }

    res.json({ newUsers, updateUsers, unchangedUsers });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}) as RequestHandler);

// 批量导入用户
router.post('/batch-import', (async (req: Request, res: Response) => {
  try {
    const { newUsers, updateUsers } = req.body as { 
      newUsers: ImportUser[],
      updateUsers: ImportUser[]
    };

    // 创建新用户
    if (newUsers?.length) {
      await User.insertMany(
        newUsers.map((user: ImportUser) => ({
          ...user,
          isActive: false
        }))
      );
    }

    // 更新现有用户
    if (updateUsers?.length) {
      for (const user of updateUsers as ImportUser[]) {
        await User.findOneAndUpdate(
          { alias: user.alias },
          { nickname: user.nickname }
        );
      }
    }

    res.json({ message: '导入成功' });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}) as RequestHandler);

// 批量删除用户
router.post('/batch-delete', (async (req: Request, res: Response) => {
  try {
    const { ids } = req.body as { ids: string[] };
    
    if (!ids?.length) {
      return res.status(400).json({ message: '未选择要删除的用户' });
    }

    await User.deleteMany({ _id: { $in: ids } });
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}) as RequestHandler);

// ... 其他路由

export default router; 