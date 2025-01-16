import express from 'express';
import { Request, Response, RequestHandler } from 'express';
import Prize from '../models/Prize';
import multer from 'multer';

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

router.get('/', (async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    const [prizes, total] = await Promise.all([
      Prize.find()
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec() as unknown as Promise<Array<{ 
          _id: string;
          name: string;
          image: { data: Buffer; contentType: string };
          totalQuantity: number;
          drawQuantity: number;
          remaining: number;
        }>>,
      Prize.countDocuments()
    ]);

    // 转换图片数据为 base64
    const prizesWithBase64 = prizes.map(prize => ({
      ...prize,
      image: prize.image ? `data:${prize.image.contentType};base64,${prize.image.data.toString('base64')}` : null
    }));

    res.json({ 
      prizes: prizesWithBase64,
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

export default router; 