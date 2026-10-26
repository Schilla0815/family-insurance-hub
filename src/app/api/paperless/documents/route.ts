import { NextRequest, NextResponse } from "next/server";
import { DEMO_PAPERLESS_DOCUMENTS } from "@/lib/seed-data";
import { PaperlessDocument } from "@/types/models";
import { normalizePaperlessUrl, normalizePaperlessToken } from "@/lib/paperless";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId")
    ? Number(searchParams.get("documentId"))
    : null;
  const policyNumber = (searchParams.get("policyNumber") || "").trim();
  const tag = (searchParams.get("tag") || "").trim();
  const correspondent = (searchParams.get("correspondent") || "").trim();
  const customQuery = (searchParams.get("query") || "").trim();
  const contractTitle = (searchParams.get("title") || "").trim();

  // Erlaube Überschreibung aus den lokalen Einstellungen (Header) oder .env
  const paperlessUrl = normalizePaperlessUrl(
    request.headers.get("x-paperless-url") ||
    searchParams.get("paperlessUrl") ||
    process.env.PAPERLESS_URL ||
    ""
  );

  const paperlessToken = normalizePaperlessToken(
    request.headers.get("x-paperless-token") ||
    searchParams.get("paperlessToken") ||
    process.env.PAPERLESS_TOKEN ||
    ""
  );

  // 1. Live-Abfrage gegen echte paperless-ngx Instanz, falls URL + gültiger Token konfiguriert sind
  if (
    paperlessUrl &&
    paperlessToken &&
    paperlessToken !== "dein_paperless_api_token_hier"
  ) {
    try {
      const queryParts: string[] = [];
      if (policyNumber) queryParts.push(`"${policyNumber}"`);
      if (tag) queryParts.push(`tag:${tag}`);
      if (customQuery) queryParts.push(customQuery);

      const searchQuery =
        queryParts.length > 0 ? queryParts.join(" OR ") : contractTitle;

      const apiUrl = new URL(`${paperlessUrl}/api/documents/`);
      if (searchQuery) {
        apiUrl.searchParams.set("query", searchQuery);
      }
      apiUrl.searchParams.set("ordering", "-created");
      apiUrl.searchParams.set("page_size", "25");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(apiUrl.toString(), {
        headers: {
          Authorization: `Token ${paperlessToken}`,
          Accept: "application/json",
        },
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const docs: PaperlessDocument[] = (data.results || []).map(
          (item: Record<string, unknown>) => ({
            id: Number(item.id),
            title: String(item.title || `Dokument #${item.id}`),
            created: String(item.created_date || item.created || "").slice(0, 10),
            added: String(item.added || ""),
            correspondent_name: correspondent || undefined,
            document_type_name: "Paperless-ngx Dokument",
            tags: tag ? [tag] : ["paperless-ngx"],
            archive_serial_number:
              typeof item.archive_serial_number === "number"
                ? item.archive_serial_number
                : null,
            policy_number_matched: policyNumber || undefined,
            page_count:
              typeof item.page_count === "number" ? item.page_count : undefined,
            summary_excerpt:
              typeof item.content === "string"
                ? item.content.slice(0, 240) +
                  (item.content.length > 240 ? "…" : "")
                : undefined,
            is_demo: false,
          })
        );

        if (documentId && !docs.some((d) => d.id === documentId)) {
          try {
            const singleRes = await fetch(
              `${paperlessUrl}/api/documents/${documentId}/`,
              {
                headers: {
                  Authorization: `Token ${paperlessToken}`,
                  Accept: "application/json",
                },
                cache: "no-store",
              }
            );
            if (singleRes.ok) {
              const item = await singleRes.json();
              docs.unshift({
                id: Number(item.id),
                title: String(item.title || `Dokument #${item.id}`),
                created: String(item.created_date || item.created || "").slice(0, 10),
                added: String(item.added || ""),
                correspondent_name: correspondent || undefined,
                document_type_name: "Paperless-ngx Dokument",
                tags: tag ? [tag] : ["paperless-ngx"],
                archive_serial_number:
                  typeof item.archive_serial_number === "number"
                    ? item.archive_serial_number
                    : null,
                policy_number_matched: policyNumber || undefined,
                page_count:
                  typeof item.page_count === "number" ? item.page_count : undefined,
                summary_excerpt:
                  typeof item.content === "string"
                    ? item.content.slice(0, 240) +
                      (item.content.length > 240 ? "…" : "")
                    : undefined,
                is_demo: false,
              });
            }
          } catch {
            // Ignore single doc fetch error
          }
        }

        if (documentId) {
          docs.sort((a, b) => (a.id === documentId ? -1 : b.id === documentId ? 1 : 0));
        }

        return NextResponse.json({
          mode: "live",
          paperlessPublicUrl:
            process.env.NEXT_PUBLIC_PAPERLESS_PUBLIC_URL || paperlessUrl,
          count: docs.length,
          documents: docs,
        });
      }
    } catch {
      // Fallback auf Demo-/Simulations-Modus, wenn NAS lokal gerade nicht erreichbar ist
    }
  }

  // 2. Intelligenter Matching-Fallback (für Demo & lokale Entwicklung ohne aktive NAS-Verbindung)
  const pLower = policyNumber.toLowerCase();
  const tagLower = tag.toLowerCase();
  const corrLower = correspondent.toLowerCase();
  const qLower = customQuery.toLowerCase();

  let matched = DEMO_PAPERLESS_DOCUMENTS.filter((doc) => {
    if (
      pLower &&
      (doc.policy_number_matched?.toLowerCase() === pLower ||
        doc.title.toLowerCase().includes(pLower) ||
        doc.summary_excerpt?.toLowerCase().includes(pLower))
    ) {
      return true;
    }
    if (
      tagLower &&
      doc.tags.some(
        (t) => t.toLowerCase() === tagLower || tagLower.includes(t.toLowerCase())
      )
    ) {
      return true;
    }
    if (
      qLower &&
      (doc.title.toLowerCase().includes(qLower) ||
        doc.summary_excerpt?.toLowerCase().includes(qLower))
    ) {
      return true;
    }
    if (
      corrLower &&
      !pLower &&
      !tagLower &&
      doc.correspondent_name?.toLowerCase().includes(corrLower)
    ) {
      return true;
    }
    return false;
  });

  // Falls ein Dokument explizit per ID verknüpft wurde, dieses sicherstellen und an erster Stelle platzieren
  if (documentId) {
    const pinnedDoc = DEMO_PAPERLESS_DOCUMENTS.find((d) => d.id === documentId);
    if (pinnedDoc && !matched.some((d) => d.id === documentId)) {
      matched.unshift(pinnedDoc);
    }
    matched.sort((a, b) => (a.id === documentId ? -1 : b.id === documentId ? 1 : 0));
  }

  // Wenn kein Dokument in Paperless bzw. in den Demodaten gefunden wurde, bleibt die Liste leer.
  // Es werden keine Scheindokumente mehr für Abos oder Verträge ohne Unterlagen erzeugt.

  return NextResponse.json({
    mode: "demo_fallback",
    paperlessPublicUrl:
      process.env.NEXT_PUBLIC_PAPERLESS_PUBLIC_URL ||
      paperlessUrl ||
      "http://192.168.178.50:8000",
    count: matched.length,
    documents: matched,
  });
}
