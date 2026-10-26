import { NextRequest, NextResponse } from "next/server";
import { testPaperlessConnection } from "@/lib/paperless";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawUrl =
      body.url ||
      request.headers.get("x-paperless-url") ||
      process.env.PAPERLESS_URL ||
      "";
    const rawToken =
      body.token ||
      request.headers.get("x-paperless-token") ||
      process.env.PAPERLESS_TOKEN ||
      "";

    const result = await testPaperlessConnection(rawUrl, rawToken);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        connected: false,
        error: err instanceof Error ? err.message : String(err),
        message: "Interner Serverfehler beim Testen der Paperless-Verbindung",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUrl =
      searchParams.get("url") ||
      request.headers.get("x-paperless-url") ||
      process.env.PAPERLESS_URL ||
      "";
    const rawToken =
      searchParams.get("token") ||
      request.headers.get("x-paperless-token") ||
      process.env.PAPERLESS_TOKEN ||
      "";

    const result = await testPaperlessConnection(rawUrl, rawToken);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        connected: false,
        error: err instanceof Error ? err.message : String(err),
        message: "Interner Serverfehler beim Testen der Paperless-Verbindung",
      },
      { status: 500 }
    );
  }
}
