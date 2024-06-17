import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import readExcel from "@/lib/readExcel";
import Trap from "@/models/Trap";
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
    Trap.findOne({ year }),
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
  let trap = data.find((row) => row[0].toLowerCase().includes("trap"));
  let dpa = data.find((row) => row[0].toLowerCase().includes("dpa"));
  let misconduct = data.find((row) =>
    row[0].toLowerCase().includes("misconduct")
  );
  let total = data.find((row) => row[0].toLowerCase().includes("total"));

  if (!units || !trap || !dpa || !misconduct || !total)
    return NextResponse.json(
      { success: false, error: "Invalid file format" },
      { status: 400 }
    );

  if (
    units.length !== trap.length ||
    units.length !== dpa.length ||
    units.length !== misconduct.length ||
    units.length !== total.length
  )
    return NextResponse.json(
      { success: false, error: "Invalid file format" },
      { status: 400 }
    );

  [units, trap, dpa, misconduct, total].forEach((arr) => arr.shift());

  for (let i = 0; i < units.length; i++) {
    if (
      parseInt(trap[i]) + parseInt(dpa[i]) + parseInt(misconduct[i]) !==
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

  let trapData = [];
  for (let i = 0; i < units.length; i++) {
    trapData.push({
      unit: units[i],
      trap: parseInt(trap[i]),
      dpa: parseInt(dpa[i]),
      misconduct: parseInt(misconduct[i]),
      total: parseInt(total[i]),
    });
  }

  const totalTrap = trapData.reduce((acc, curr) => acc + curr.total, 0);

  const newTrap = new Trap({ year, data: trapData, total: totalTrap });
  await newTrap.save();

  revalidatePath("/api/data");

  return NextResponse.json({
    success: true,
    data: { year, trap: trapData, total: totalTrap },
  });
}
