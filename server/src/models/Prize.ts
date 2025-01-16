import mongoose, { Schema, Document } from 'mongoose';

export interface IPrize extends Document {
  name: string;
  description: string;
  quantity: number;
  remaining: number;
  probability: number;
}

const PrizeSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  quantity: { type: Number, required: true },
  remaining: { type: Number, required: true },
  probability: { type: Number, required: true }
});

export default mongoose.model<IPrize>('Prize', PrizeSchema); 