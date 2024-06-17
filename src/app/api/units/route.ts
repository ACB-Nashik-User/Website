import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import Unit, { getUnitId } from "@/models/Unit";

export async function GET() {
  await dbConnect();
  const units = await Unit.find();
  return NextResponse.json({
    success: true,
    data: units.map(({ _id, name }) => ({ id: _id, name })),
  });
}

export async function POST(req: NextRequest) {
  await dbConnect();
  let name: string;

  try {
    const body = await req.json();
    name = body.name;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Name is required" },
      { status: 400 }
    );
  }

  if (!name)
    return NextResponse.json(
      { success: false, error: "Name is required" },
      { status: 400 }
    );

  console.log(name);

  const id = await getUnitId(name);
  const unit = new Unit({ _id: id, name });
  await unit.save();
  return NextResponse.json({
    success: true,
    data: { id, name },
  });
}

export async function PUT(req: NextRequest) {
  await dbConnect();
  const { id, name } = await req.json();

  if (!id || !name)
    return NextResponse.json(
      { success: false, error: "Id and Name are required" },
      { status: 400 }
    );

  const unit = await Unit.findById(id);
  if (!unit)
    return NextResponse.json(
      { success: false, error: "Unit not found" },
      { status: 404 }
    );

  unit.name = name;
  await unit.save();
  return NextResponse.json({
    success: true,
    data: unit,
  });
}

export async function DELETE(req: NextRequest) {
  await dbConnect();
  const { id } = await req.json();

  if (!id)
    return NextResponse.json(
      { success: false, error: "Id is required" },
      { status: 400 }
    );

  const unit = await Unit.findByIdAndDelete(id);
  if (!unit)
    return NextResponse.json(
      { success: false, error: "Unit not found" },
      { status: 404 }
    );

  return NextResponse.json({
    success: true,
    data: unit,
  });
}
