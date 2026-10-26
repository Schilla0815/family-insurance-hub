import type { Metadata, Viewport } from "next";
import "./globals.css";
import { HubProvider } from "@/context/HubContext";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "FamilyHub — Versicherungen & Abos",
  description:
    "Selbstgehostete Familien-Versicherungs- und Abo-Verwaltung mit Wallos-Design und Paperless-ngx Integration",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=localStorage.getItem("color-scheme");var isDark=s==="dark"||(!s&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(isDark)document.documentElement.classList.add("dark");else document.documentElement.classList.remove("dark");var m=document.querySelector('meta[name="color-scheme"]');if(m)m.content=s||"light dark";}catch(e){}`,
          }}
        />
      </head>
      <body className="antialiased selection:bg-emerald-500 selection:text-white">
        <HubProvider>
          <AppShell>{children}</AppShell>
        </HubProvider>
      </body>
    </html>
  );
}
