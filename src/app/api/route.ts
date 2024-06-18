import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "ACB Nashik Website API",
    documentation: "https://documenter.getpostman.com/view/30434267/2sA3XSBMLu",
    note: "This is a temporary documentation, will be updated as the project progresses",
  });
}
