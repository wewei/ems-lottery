import express, { Request, Response, Router, RequestHandler } from 'express';
import User, { IUser } from '../models/User';
import DrawRecord from '../models/DrawRecord';
import Setting from '../models/Setting';
import { authenticateToken } from '../middleware/auth';
import fs from 'fs';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { generateTestUsers } from '../utils/userGenerator';

interface ImportUser {
  alias: string;
  nickname: string;
}

const router: Router = express.Router();
const upload = multer();

// 创建用户
router.post('/', authenticateToken as RequestHandler, (async (req: Request, res: Response) => {
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
router.get('/', authenticateToken as RequestHandler, (async (req: Request, res: Response) => {
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
router.put('/:id', authenticateToken as RequestHandler, (async (req: Request, res: Response) => {
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
router.post('/preview-import', authenticateToken as RequestHandler, (async (req: Request, res: Response) => {
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
router.post('/batch-import', authenticateToken as RequestHandler, (async (req: Request, res: Response) => {
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
router.post('/batch-delete', authenticateToken as RequestHandler, (async (req: Request, res: Response) => {
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

// 检查用户状态
router.get('/check/:alias', (async (req: Request, res: Response) => {
  try {
    const { alias } = req.params;
    const user = await User.findOne({ alias });

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({ 
      user: {
        alias: user.alias,
        nickname: user.nickname,
        isActive: user.isActive
      }
    });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}) as RequestHandler);

// 激活用户
router.post('/activate/:alias', (async (req: Request, res: Response) => {
  try {
    const { alias } = req.params;
    const { browserId } = req.body;

    if (!browserId) {
      return res.status(400).json({ message: '缺少浏览器标识' });
    }

    const user = await User.findOne({ alias });

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    if (user.isActive) {
      return res.status(400).json({ message: '用户已经激活' });
    }

    user.isActive = true;
    user.activatedFrom = {
      browserId,
      activatedAt: new Date()
    };
    await user.save();

    res.json({ 
      message: '激活成功',
      user: {
        alias: user.alias,
        nickname: user.nickname,
        isActive: user.isActive
      }
    });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}) as RequestHandler);

// 撤销激活
router.post('/deactivate/:alias', (async (req: Request, res: Response) => {
  try {
    const { alias } = req.params;
    const user = await User.findOne({ alias });

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    if (!user.isActive) {
      return res.status(400).json({ message: '用户尚未激活' });
    }

    user.isActive = false;
    await user.save();

    res.json({ 
      message: '已撤销激活',
      user: {
        alias: user.alias,
        nickname: user.nickname,
        isActive: user.isActive
      }
    });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}) as RequestHandler);

// 根据浏览器ID查询激活用户
router.get('/activated-by-browser', (async (req: Request, res: Response) => {
  try {
    const { browserId } = req.query;
    if (!browserId) {
      return res.status(400).json({ message: '缺少浏览器标识' });
    }

    const user = await User.findOne({ 'activatedFrom.browserId': browserId });
    if (!user || !user.isActive) {
      return res.json({ user: null });
    }

    res.json({ 
      user: {
        alias: user.alias,
        nickname: user.nickname,
        isActive: user.isActive
      }
    });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}) as RequestHandler);

// 修改管理员激活用户的路由
router.post('/admin/activate/:id', (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    if (user.isActive) {
      return res.status(400).json({ message: '用户已经激活' });
    }

    // 生成带有admin-前缀的随机ID
    const adminBrowserId = `admin-${Math.random().toString(36).substring(2)}`;

    user.isActive = true;
    user.activatedFrom = {
      browserId: adminBrowserId,
      activatedAt: new Date()
    };
    await user.save();

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}) as RequestHandler);

// 获取用户统计信息
router.get('/stats', (async (req: Request, res: Response) => {
  try {
    const activeUserCount = await User.countDocuments({ isActive: true });
    res.json({ activeUserCount });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}) as RequestHandler);

// 获取可参与抽奖的用户列表
router.get('/active', (async (req: Request, res: Response) => {
  try {
    const prizeId = req.query.prizeId as string;
    if (!prizeId) {
      return res.status(400).json({ message: '缺少奖项ID参数' });
    }

    const settings = await Setting.getInstance();
    let winnersQuery;

    if (settings.allowMultipleWins) {
      // 只排除当前奖项的获奖用户
      const drawRecords = await DrawRecord.find({ prizeId });
      winnersQuery = {
        alias: { 
          $nin: drawRecords.flatMap(record => 
            record.winners.map(winner => winner.alias)
          )
        }
      };
    } else {
      // 排除所有获奖用户
      const allDrawRecords = await DrawRecord.find();
      winnersQuery = {
        alias: { 
          $nin: allDrawRecords.flatMap(record => 
            record.winners.map(winner => winner.alias)
          )
        }
      };
    }

    const users = await User.find({ 
      isActive: true,
      ...winnersQuery
    })
    .select('alias nickname')
    .lean();

    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: '获取用户列表失败' });
  }
}) as RequestHandler);

// 导入用户
router.post('/import', upload.single('file'), (async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '未上传文件' });
    }

    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    // 支持 \r\n (Windows), \n (Unix), \r (Mac) 换行符
    const rows = fileContent.split(/\r\n|\r|\n/)
      .filter(row => row.trim())
      // 跳过第一行 header
      .slice(1)
      .map(row => {
        const [alias, nickname] = row
          .split(',')
          .map(field => field.trim().replace(/^["']|["']$/g, ''));
        return { alias, nickname };
      })
      .filter(({ alias, nickname }) => alias && nickname);

    // ... 其他代码
  } catch (err) {
    res.status(500).json({ message: '导入失败' });
  }
}) as RequestHandler);

// 批量激活用户
router.post('/batch-activate', authenticateToken as RequestHandler, (async (req: Request, res: Response) => {
  try {
    const { aliases } = req.body;
    if (!Array.isArray(aliases)) {
      return res.status(400).json({ message: '无效的用户列表' });
    }

    const users = await User.find({ alias: { $in: aliases } });
    const activated: IUser[] = [];
    const unchanged: IUser[] = [];

    for (const user of users) {
      if (!user.isActive) {
        user.isActive = true;
        user.activatedFrom = {
          browserId: `admin-${Date.now()}`,
          activatedAt: new Date()
        };
        await user.save();
        activated.push(user);
      } else {
        unchanged.push(user);
      }
    }

    res.json({
      activated: activated.map(u => ({ alias: u.alias, nickname: u.nickname })),
      unchanged: unchanged.map(u => ({ alias: u.alias, nickname: u.nickname }))
    });
  } catch (err) {
    res.status(500).json({ message: '批量激活失败' });
  }
}) as RequestHandler);

// 批量撤销激活
router.post('/batch-deactivate', authenticateToken as RequestHandler, (async (req: Request, res: Response) => {
  try {
    const { aliases } = req.body;
    if (!Array.isArray(aliases)) {
      return res.status(400).json({ message: '无效的用户列表' });
    }

    const users = await User.find({ alias: { $in: aliases } });
    const deactivated: IUser[] = [];
    const unchanged: IUser[] = [];

    for (const user of users) {
      if (user.isActive) {
        user.isActive = false;
        user.activatedFrom = undefined;
        await user.save();
        deactivated.push(user);
      } else {
        unchanged.push(user);
      }
    }

    res.json({
      deactivated: deactivated.map(u => ({ alias: u.alias, nickname: u.nickname })),
      unchanged: unchanged.map(u => ({ alias: u.alias, nickname: u.nickname }))
    });
  } catch (err) {
    res.status(500).json({ message: '批量撤销激活失败' });
  }
}) as RequestHandler);

// 生成测试用户
router.post('/generate-test', authenticateToken as RequestHandler, async (req: Request, res: Response) => {
  try {
    const count = parseInt(req.query.count as string) || 10; // 默认生成10个用户
    const testUsers = generateTestUsers(count);
    
    const createdUsers = await Promise.all(
      testUsers.map(async (userData) => {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        const user = new User({
          alias: userData.alias,
          nickname: userData.nickname,
          password: hashedPassword,
          isTest: true // 标记为测试用户
        });
        
        return user.save();
      })
    );

    res.status(201).json({
      message: `成功生成 ${createdUsers.length} 个测试用户`,
      users: createdUsers.map(user => ({
        alias: user.alias,
        nickname: user.nickname,
        _id: user._id
      }))
    });
  } catch (error) {
    console.error('生成测试用户失败:', error);
    res.status(500).json({ message: '生成测试用户失败' });
  }
});

// 删除测试用户
router.post('/delete-test-users', authenticateToken as RequestHandler, async (req: Request, res: Response) => {
  console.log('删除测试用户');
  try {
    // 先找到所有测试用户
    const testUsers = await User.find({ alias: /^test-/ });
    console.log(`找到 ${testUsers.length} 个测试用户`);

    // 删除这些用户
    const result = await User.deleteMany({ alias: /^test-/ });
    console.log('删除结果:', result);

    res.json({ 
      message: `成功删除 ${result.deletedCount} 个测试用户`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('删除测试用户时发生错误:', error);
    res.status(500).json({ 
      message: '删除测试用户失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// ... 其他路由

export default router; 