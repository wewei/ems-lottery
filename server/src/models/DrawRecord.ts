import mongoose, { Schema, Document } from 'mongoose';

export interface IDrawRecord extends Document {
  prize: mongoose.Types.ObjectId;  // 关联奖项
  user: mongoose.Types.ObjectId;   // 关联用户
  drawTime: Date;                  // 抽奖时间
}

const DrawRecordSchema: Schema = new Schema({
  prize: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Prize',
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  drawTime: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model<IDrawRecord>('DrawRecord', DrawRecordSchema); 