import express from 'express';
import { Request, Response, RequestHandler } from 'express';
import Prize from '../models/Prize';
import multer from 'multer';
import mongoose from 'mongoose';
import DrawRecord from '../models/DrawRecord';

// 配置内存存储
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片文件!'));
    }
  }
});

const router = express.Router();

async function calculateRemaining(prizeId: string): Promise<number> {
  const [prize, drawnCount] = await Promise.all([
    Prize.findById(prizeId),
    DrawRecord.aggregate([
      { $match: { prizeId: new mongoose.Types.ObjectId(prizeId) } },
      { $group: { _id: null, total: { $sum: { $size: '$winners' } } } }
    ])
  ]);

  if (!prize) return 0;
  return prize.totalQuantity - (drawnCount[0]?.total || 0);
}

router.get('/', (async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    const [prizes, total] = await Promise.all([
      Prize.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Prize.countDocuments()
    ]);

    // 计算每个奖项的剩余数量
    const prizesWithRemaining = await Promise.all(
      prizes.map(async prize => ({
        ...prize,
        image: prize.image ? `data:${prize.image.contentType};base64,${prize.image.data.toString('base64')}` : null,
        remaining: await calculateRemaining(prize._id.toString())
      }))
    );

    res.json({
      prizes: prizesWithRemaining,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}) as RequestHandler);

// 上传图片
router.post('/upload', upload.single('image'), (async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    const imageData = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
      originalName: req.file.originalname,
      size: req.file.size,
      uploadedAt: new Date(),
      lastModified: new Date()
    };

    const base64Data = `data:${imageData.contentType};base64,${imageData.data.toString('base64')}`;
    res.json({ 
      url: base64Data,
      metadata: {
        originalName: imageData.originalName,
        size: imageData.size,
        contentType: imageData.contentType
      }
    });
  } catch (err) {
    res.status(500).json({ message: '上传失败' });
  }
}) as RequestHandler);

// 创建奖项
router.post('/', (async (req: Request, res: Response) => {
  try {
    const { name, image, totalQuantity, drawQuantity } = req.body;

    if (!Number.isInteger(drawQuantity) || drawQuantity < 1 || drawQuantity > 5) {
      return res.status(400).json({ message: '每轮抽奖数量必须是1-5之间的整数' });
    }

    // 从 base64 转换回二进制
    const matches = image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ message: '无效的图片格式' });
    }

    const imageData = {
      data: Buffer.from(matches[2], 'base64'),
      contentType: matches[1],
      uploadedAt: new Date(),
      lastModified: new Date(),
      dimensions: {
        width: null,
        height: null
      }
    };

    const prize = new Prize({
      name,
      image: imageData,
      totalQuantity,
      drawQuantity,
      remaining: totalQuantity
    });

    await prize.save();
    res.status(201).json(prize);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}) as RequestHandler);

// 更新奖项
router.put('/:id', (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, image, totalQuantity, drawQuantity } = req.body;

    if (!Number.isInteger(drawQuantity) || drawQuantity < 1 || drawQuantity > 5) {
      return res.status(400).json({ message: '每轮抽奖数量必须是1-5之间的整数' });
    }

    const update: any = { name, totalQuantity, drawQuantity };

    // 如果更新了图片
    if (image && image !== (await Prize.findById(id))?.image?.data) {
      const matches = image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        update.image = {
          data: Buffer.from(matches[2], 'base64'),
          contentType: matches[1]
        };
      }
    }

    const prize = await Prize.findByIdAndUpdate(id, update, { new: true });
    if (!prize) {
      return res.status(404).json({ message: '奖项不存在' });
    }

    res.json(prize);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}) as RequestHandler);

// 删除奖项
router.delete('/:id', (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const prize = await Prize.findByIdAndDelete(id);
    if (!prize) {
      return res.status(404).json({ message: '奖项不存在' });
    }

    res.json({ message: '奖项已删除' });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}) as RequestHandler);

// 获取单个奖项
router.get('/:id', (async (req: Request, res: Response) => {
  try {
    const prizeId = req.params.id;
    const [prize, drawnCount] = await Promise.all([
      Prize.findById(prizeId).lean().exec(),
      DrawRecord.aggregate([
        { $match: { prizeId: new mongoose.Types.ObjectId(prizeId) } },
        { $group: { _id: null, total: { $sum: { $size: '$winners' } } } }
      ])
    ]);

    if (!prize) {
      return res.status(404).json({ message: '奖项不存在' });
    }

    const remaining = prize.totalQuantity - (drawnCount[0]?.total || 0);

    // 处理图片数据
    const processedPrize = {
      ...prize,
      remaining,
      image: prize.image ? `data:${prize.image.contentType};base64,${prize.image.data.toString('base64')}` : null
    };
    res.json({ prize: processedPrize });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}) as RequestHandler);

export default router; 