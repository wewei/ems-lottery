import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  alias: string;      // 唯一标识符
  nickname: string;   // 显示名称
  isActive: boolean;  // 是否已激活
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
  }
});

export default mongoose.model<IUser>('User', UserSchema); 