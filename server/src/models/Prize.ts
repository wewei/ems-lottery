import mongoose, { Schema, Document } from 'mongoose';

export interface IPrize extends Document {
  name: string;        // 奖项名称
  image: string;       // 奖品图片URL
  totalQuantity: number;    // 总数量
  drawQuantity: number;     // 每次抽取数量
  remaining: number;        // 剩余数量
}

const PrizeSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  image: { 
    type: String,
    required: true 
  },
  totalQuantity: { 
    type: Number, 
    required: true,
    min: 0 
  },
  drawQuantity: { 
    type: Number, 
    required: true,
    min: 1 
  },
  remaining: { 
    type: Number, 
    required: true,
    min: 0 
  }
});

export default mongoose.model<IPrize>('Prize', PrizeSchema); 