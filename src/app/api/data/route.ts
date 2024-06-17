import { NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import Aquted from "@/models/Aquted";
import Trap from "@/models/Trap";
import Unit from "@/models/Unit";

export const revalidate = 0;

export async function GET() {
  await dbConnect();

  let [aquted, trap] = await Promise.all([
    Aquted.find().select("-_id -__v").populate("data.unit", "name", Unit),
    Trap.find().select("-_id -__v").populate("data.unit", "name", Unit),
  ]);

  [aquted, trap] = [aquted, trap].map((data) => {
    return data.map((d) => {
      return {
        ...d.toObject(),
        data: d.data.map((unit: any) => {
          return {
            ...unit.toObject(),
            unit: {
              id: unit.unit._id,
              name: unit.unit.name,
            },
          };
        }),
      };
    });
  });

  return NextResponse.json({
    success: true,
    data: {
      aquted,
      trap,
    },
  });
}
