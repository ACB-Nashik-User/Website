import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import readExcel from "@/lib/readExcel";
import Aquted from "@/models/Aquted";
import Unit from "@/models/Unit";

export async function POST(req: NextRequest) {
  await dbConnect();
  let file: File | null = null;
  let year: number | null = null;

  try {
    const formData = await req.formData();
    file = formData.get("file") as File;
    year = parseInt(formData.get("year") as string);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "File and Year are required" },
      { status: 400 }
    );
  }

  if (!file)
    return NextResponse.json(
      { success: false, error: "File is required" },
      { status: 400 }
    );

  if (!year)
    return NextResponse.json(
      { success: false, error: "Year is required" },
      { status: 400 }
    );

  const [existing, dBunits] = await Promise.all([
    Aquted.findOne({ year }),
    Unit.find(),
  ]);

  if (existing)
    return NextResponse.json(
      { success: false, error: "Data already exists for this year" },
      { status: 400 }
    );

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const data = readExcel(buffer);

  let units = data.find((row) => row[0].toLowerCase().includes("unit"));
  let innocent = data.find((row) => row[0].toLowerCase().includes("innocent"));
  let discharge = data.find((row) =>
    row[0].toLowerCase().includes("discharge")
  );
  let abait = data.find((row) => row[0].toLowerCase().includes("abait"));
  let closed = data.find((row) => row[0].toLowerCase().includes("close"));
  let total = data.find((row) => row[0].toLowerCase().includes("total"));

  if (!units || !innocent || !discharge || !abait || !closed || !total)
    return NextResponse.json(
      { success: false, error: "Invalid file format" },
      { status: 400 }
    );

  if (
    units.length !== innocent.length ||
    units.length !== discharge.length ||
    units.length !== abait.length ||
    units.length !== closed.length ||
    units.length !== total.length
  )
    return NextResponse.json(
      { success: false, error: "Invalid file format" },
      { status: 400 }
    );

  [units, innocent, discharge, abait, closed, total].forEach((arr) =>
    arr.shift()
  );

  for (let i = 0; i < units.length; i++) {
    if (
      parseInt(innocent[i]) +
        parseInt(discharge[i]) +
        parseInt(abait[i]) +
        parseInt(closed[i]) !==
      parseInt(total[i])
    ) {
      return NextResponse.json(
        { success: false, error: `Mismatch in total for unit ${units[i]}` },
        { status: 400 }
      );
    }
  }

  for (let i = 0; i < units.length; i++) {
    let unit = units[i];
    const dbUnit = dBunits.find((u) => u.name === unit);
    if (!dbUnit) {
      return NextResponse.json(
        { success: false, error: `Unit ${unit} not found` },
        { status: 404 }
      );
    }

    units[i] = dbUnit._id;
  }

  let aquted = [];
  for (let i = 0; i < units.length; i++) {
    aquted.push({
      unit: units[i],
      innocent: parseInt(innocent[i]),
      discharge: parseInt(discharge[i]),
      abait: parseInt(abait[i]),
      closed: parseInt(closed[i]),
      total: parseInt(total[i]),
    });
  }

  const totalAquted = aquted.reduce((acc, curr) => acc + curr.total, 0);

  const newAquted = new Aquted({ year, data: aquted, total: totalAquted });
  await newAquted.save();

  revalidatePath("/api/data");

  return NextResponse.json({
    success: true,
    data: { year, aquted, total: totalAquted },
  });
}
