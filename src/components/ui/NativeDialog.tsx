"use client";

import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

interface NativeDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
}

export function NativeDialog({
  open,
  onClose,
  title,
  subtitle,
  maxWidthClass = "max-w-2xl",
  children,
}: NativeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Mandatory fallback for browsers without native <dialog closedby="any"> support
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCloseEvent = () => {
      onClose();
    };
    dialog.addEventListener("close", handleCloseEvent);

    const handleBackdropClick = (event: MouseEvent) => {
      if ("closedBy" in HTMLDialogElement.prototype) return;
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;

      if (isDialogContent) return;
      dialog.close();
    };

    dialog.addEventListener("click", handleBackdropClick);
    return () => {
      dialog.removeEventListener("close", handleCloseEvent);
      dialog.removeEventListener("click", handleBackdropClick);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: "any" } as React.DialogHTMLAttributes<HTMLDialogElement>)}
      aria-labelledby={titleId}
      className={`w-full ${maxWidthClass} m-auto rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] text-slate-900 dark:text-slate-100 shadow-2xl p-0 backdrop:bg-slate-950/70 backdrop:backdrop-blur-sm open:animate-in open:fade-in open:zoom-in-95`}
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 px-5 py-4 sticky top-0 bg-white/95 dark:bg-[#121622]/95 backdrop-blur-md z-10">
        <div>
          <h2 id={titleId} className="text-lg font-bold tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
          aria-label="Dialog schließen"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-5 max-h-[82dvh] overflow-y-auto">{children}</div>
    </dialog>
  );
}
