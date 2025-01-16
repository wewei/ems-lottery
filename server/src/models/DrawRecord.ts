import mongoose, { Schema, Document } from 'mongoose';

export interface IDrawRecord extends Document {
  drawTime: Date;          // 抽奖时间
  prizeId: string;         // 奖项ID
  prizeName: string;       // 奖项名称（冗余存储，方便查询显示）
  drawQuantity: number;    // 本次抽取数量
  winners: Array<{        // 中奖者列表
    alias: string;        // 用户别名
    nickname: string;     // 用户昵称（冗余存储）
  }>;
}

const DrawRecordSchema: Schema = new Schema({
  drawTime: { 
    type: Date, 
    required: true,
    default: Date.now,
    index: true          // 添加索引以支持按时间查询
  },
  prizeId: {
    type: Schema.Types.ObjectId,
    ref: 'Prize',
    required: true,
    index: true          // 添加索引以支持按奖项查询
  },
  prizeName: {
    type: String,
    required: true
  },
  drawQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  winners: [{
    alias: {
      type: String,
      required: true,
      index: true        // 添加索引以支持按中奖者查询
    },
    nickname: {
      type: String,
      required: true
    }
  }]
});

// 添加复合索引支持多条件查询
DrawRecordSchema.index({ drawTime: -1, prizeId: 1 });
DrawRecordSchema.index({ drawTime: -1, 'winners.alias': 1 });

export default mongoose.model<IDrawRecord>('DrawRecord', DrawRecordSchema); 