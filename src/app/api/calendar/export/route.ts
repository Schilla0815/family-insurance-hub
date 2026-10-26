import { NextRequest, NextResponse } from "next/server";
import { generateIcsCalendar } from "@/lib/calculations";
import { INITIAL_CONTRACTS, INITIAL_PROVIDERS } from "@/lib/seed-data";

export async function GET(request: NextRequest) {
  try {
    // In self-hosted environment, initial contracts provide the baseline
    const icsContent = generateIcsCalendar(
      INITIAL_CONTRACTS,
      INITIAL_PROVIDERS,
      "Familien-Versicherungen & Kündigungsfristen"
    );

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="familien-vertraege.ics"',
        "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Fehler beim Generieren des iCal-Kalenders",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
