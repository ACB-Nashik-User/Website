import { Document, model, models, Schema } from "mongoose";

import dbConnect from "@/lib/dbConnect";

export interface UnitDocument extends Document {
  _id: string;
  name: string;
}

const UnitSchema: Schema<UnitDocument> = new Schema({
  _id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
});

const Unit = models.Unit || model<UnitDocument>("Unit", UnitSchema);

export const getUnitId = async (name: string): Promise<string> => {
  await dbConnect();

  let id = name.toLowerCase().replace(/\s+/g, "-");

  let existing = await Unit.findById(id);

  if (existing) {
    let count = 1;
    while (true) {
      let newId = `${id}-${count}`;
      existing = await Unit.findById(newId);
      if (!existing) {
        id = newId;
        break;
      }
      count++;
    }
  }

  return id;
};

export default Unit;
