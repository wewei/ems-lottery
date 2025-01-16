import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISetting extends Document {
  allowMultipleWins: boolean;  // 是否允许重复获奖
}

interface ISettingModel extends Model<ISetting> {
  getInstance(): Promise<ISetting>;
}

const SettingSchema: Schema = new Schema({
  allowMultipleWins: {
    type: Boolean,
    required: true,
    default: false
  }
});

// 确保只有一条记录
SettingSchema.statics.getInstance = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({ allowMultipleWins: false });
  }
  return settings;
};

export default mongoose.model<ISetting, ISettingModel>('Setting', SettingSchema); 