import { Document, model, models, Schema } from "mongoose";

export interface AqutedUnit {
  unit: string;
  innocent: number;
  discharge: number;
  abait: number;
  closed: number;
  total: number;
  _id: false;
}

export interface Aquted extends Document {
  year: number;
  data: AqutedUnit[];
  total: number;
}

const AqutedUnitSchema = new Schema<AqutedUnit>({
  unit: {
    type: String,
    ref: "Unit",
    required: true,
  },
  innocent: {
    type: Number,
    required: true,
  },
  discharge: {
    type: Number,
    required: true,
  },
  abait: {
    type: Number,
    required: true,
  },
  closed: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  _id: false,
});

const AqutedSchema = new Schema<Aquted>({
  year: {
    type: Number,
    required: true,
  },
  data: {
    type: [AqutedUnitSchema],
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
});

export default models.Aquted || model<Aquted>("Aquted", AqutedSchema);
