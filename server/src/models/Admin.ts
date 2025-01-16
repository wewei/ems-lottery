import mongoose, { Schema } from 'mongoose';

const AdminSchema: Schema = new Schema({
  password: { type: String, required: true }
});

// 确保只有一条记录
AdminSchema.statics.findAdmin = function() {
  return this.findOne();
};

export default mongoose.model('Admin', AdminSchema); 