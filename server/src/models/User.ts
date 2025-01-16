import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  alias: string;      // 唯一标识符
  nickname: string;   // 显示名称
  isActive: boolean;  // 是否已激活
  activatedFrom?: {
    browserId: string;
    activatedAt: Date;
  };
}

const UserSchema: Schema = new Schema({
  alias: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  nickname: { 
    type: String, 
    required: true,
    trim: true 
  },
  isActive: { 
    type: Boolean, 
    default: false 
  },
  activatedFrom: {
    browserId: { 
      type: String,
      index: true
    },
    activatedAt: { type: Date }
  }
});

export default mongoose.model<IUser>('User', UserSchema); 