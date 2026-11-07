import { NextResponse } from "next/server";
import { checkPocketBaseHealth } from "@/lib/pocketbase-server";

export async function GET() {
  const health = await checkPocketBaseHealth();
  return NextResponse.json(health);
}
