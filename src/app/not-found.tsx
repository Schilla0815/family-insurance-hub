import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
        Seite nicht gefunden (404)
      </h1>
      <p className="text-xs text-slate-500 max-w-sm">
        Die angeforderte Unterseite existiert nicht oder wurde verschoben.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Zurück zur Übersicht
      </Link>
    </div>
  );
}
