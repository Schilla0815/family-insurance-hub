/**
 * Paperless-ngx API Helper & URL/Token Normalizer
 */

export function normalizePaperlessUrl(rawUrl?: string | null): string {
  if (!rawUrl) return "";
  let url = rawUrl.trim();
  if (!url) return "";

  // Add http:// if protocol is omitted
  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`;
  }

  // Remove trailing slashes
  url = url.replace(/\/+$/, "");

  // If user accidentally typed ".../api/documents" or ".../api", strip it
  url = url.replace(/\/api\/documents\/?$/i, "");
  url = url.replace(/\/api\/?$/i, "");

  return url.replace(/\/+$/, "");
}

export function normalizePaperlessToken(rawToken?: string | null): string {
  if (!rawToken) return "";
  let token = rawToken.trim();
  // Strip accidental "Token " or "Bearer " prefix
  if (/^Token\s+/i.test(token)) {
    token = token.replace(/^Token\s+/i, "").trim();
  } else if (/^Bearer\s+/i.test(token)) {
    token = token.replace(/^Bearer\s+/i, "").trim();
  }
  return token;
}

export interface PaperlessTestResult {
  ok: boolean;
  connected: boolean;
  documentCount?: number;
  totalDocuments?: number;
  message: string;
  error?: string;
  status?: number;
}

export async function testPaperlessConnection(
  rawUrl: string,
  rawToken: string
): Promise<PaperlessTestResult> {
  const url = normalizePaperlessUrl(rawUrl);
  const token = normalizePaperlessToken(rawToken);

  if (!url) {
    return {
      ok: false,
      connected: false,
      error: "Keine Paperless-ngx Server-URL angegeben.",
      message: "Bitte trage die Server-Adresse deines NAS ein (z. B. http://192.168.178.50:8000).",
    };
  }

  if (!token || token === "dein_paperless_api_token_hier") {
    return {
      ok: false,
      connected: false,
      error: "Kein API-Token angegeben.",
      message: "Bitte erstelle in Paperless-ngx unter 'Mein Profil > API-Tokens' einen Token und trage ihn hier ein.",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const target = `${url}/api/documents/?page_size=1`;
    const res = await fetch(target, {
      method: "GET",
      headers: {
        Authorization: `Token ${token}`,
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const count = typeof data.count === "number" ? data.count : 0;
      return {
        ok: true,
        connected: true,
        documentCount: count,
        totalDocuments: count,
        status: res.status,
        message: `Erfolgreich mit Paperless-ngx verbunden! ${count} Dokumente im Archiv gefunden.`,
      };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        connected: false,
        status: res.status,
        error: `Authentifizierungsfehler (HTTP ${res.status})`,
        message: "Der angegebene API-Token ist ungültig oder abgelaufen. Bitte prüfe den Token in Paperless-ngx.",
      };
    }

    if (res.status === 404) {
      return {
        ok: false,
        connected: false,
        status: res.status,
        error: `Endpunkt nicht gefunden (HTTP 404)`,
        message: `Die URL '${url}' antwortet mit 404. Läuft Paperless-ngx unter diesem Pfad und Port?`,
      };
    }

    return {
      ok: false,
      connected: false,
      status: res.status,
      error: `Server-Antwort HTTP ${res.status}`,
      message: `Paperless-ngx antwortete mit HTTP ${res.status}. Bitte prüfe URL und Port.`,
    };
  } catch (err: unknown) {
    const errorObj = err as Error & { cause?: { code?: string; message?: string } };
    const causeMsg = errorObj.cause?.message || (errorObj.cause?.code ? String(errorObj.cause.code) : "");
    const message = [errorObj.message, causeMsg].filter(Boolean).join(" - ");
    const isTimeout = message.includes("aborted") || message.includes("timeout") || errorObj.name === "AbortError";
    const isConnRefused = message.includes("ECONNREFUSED") || message.includes("ENOTFOUND") || message.includes("EHOSTUNREACH");
    const isSslError = message.includes("CERT_") || message.includes("DEPTH_ZERO_SELF_SIGNED_CERT");

    let friendlyError = message;
    if (isTimeout) {
      friendlyError = "Zeitüberschreitung (8s). Der NAS-Server antwortet nicht. Bitte IP und Port prüfen.";
    } else if (isConnRefused) {
      friendlyError = `Verbindung verweigert (${causeMsg || "ECONNREFUSED"}). Läuft Paperless-ngx auf dem angegebenen Host und Port?`;
    } else if (isSslError) {
      friendlyError = "SSL-Zertifikatsfehler. Falls du ein selbstsigniertes Zertifikat nutzt, verwende HTTP im lokalen Heimnetzwerk.";
    }

    return {
      ok: false,
      connected: false,
      error: friendlyError,
      message: `Verbindung fehlgeschlagen: ${friendlyError}`,
    };
  }
}
