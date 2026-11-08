import { NextRequest, NextResponse } from "next/server";
import {
  checkPocketBaseHealth,
  pullFromLocalStoreFallback,
  pullFromPocketBase,
  pushToPocketBase,
} from "@/lib/pocketbase-server";

export async function GET() {
  try {
    const health = await checkPocketBaseHealth();
    if (!health.online) {
      const fallback = pullFromLocalStoreFallback();
      return NextResponse.json({
        connected: false,
        url: health.url,
        error: health.error,
        hasData: fallback.hasData,
        data: fallback.hasData ? fallback.data : null,
      });
    }

    const payload = await pullFromPocketBase();
    return NextResponse.json({
      connected: true,
      url: health.url,
      ...payload,
    });
  } catch (err: unknown) {
    const fallback = pullFromLocalStoreFallback();
    return NextResponse.json(
      {
        connected: false,
        hasData: fallback.hasData,
        data: fallback.hasData ? fallback.data : null,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await pushToPocketBase(body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
