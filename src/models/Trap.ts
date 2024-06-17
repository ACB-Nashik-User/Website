import { Document, model, models, Schema } from "mongoose";

export interface TrapUnit {
  unit: string;
  trap: number;
  dpa: number;
  misconduct: number;
  total: number;
  _id: false;
}

export interface Trap extends Document {
  year: number;
  data: TrapUnit[];
  total: number;
}

const TrapUnitSchema = new Schema<TrapUnit>({
  unit: {
    type: String,
    ref: "Unit",
    required: true,
  },
  trap: {
    type: Number,
    required: true,
  },
  dpa: {
    type: Number,
    required: true,
  },
  misconduct: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  _id: false,
});

const TrapSchema = new Schema<Trap>({
  year: {
    type: Number,
    required: true,
  },
  data: {
    type: [TrapUnitSchema],
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
});

export default models.Trap || model<Trap>("Trap", TrapSchema);
