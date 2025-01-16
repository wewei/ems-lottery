import mongoose, { Schema, Document } from 'mongoose';

export interface IPrize extends Document {
  name: string;        // 奖项名称
  image: {
    data: Buffer;
    contentType: string;
    originalName?: string;
    size?: number;
    uploadedAt?: Date;
    lastModified?: Date;
    dimensions?: {
      width?: number;
      height?: number;
    };
  };
  totalQuantity: number;    // 总数量
  drawQuantity: number;     // 每次抽取数量
}

const PrizeSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  image: { 
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    originalName: { type: String },
    size: { type: Number },
    uploadedAt: { type: Date, default: Date.now },
    lastModified: { type: Date },
    dimensions: {
      width: { type: Number },
      height: { type: Number }
    }
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
  }
});

export default mongoose.model<IPrize>('Prize', PrizeSchema); 