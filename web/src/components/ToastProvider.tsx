"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastType = "success" | "info" | "error";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  leaving: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, string> = { success: "✅", info: "📌", error: "❌" };
const AUTO_DISMISS_MS = 2800;
const LEAVE_MS = 300;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message, type, leaving: false }]);
      window.setTimeout(() => {
        setToasts((current) =>
          current.map((t) => (t.id === id ? { ...t, leaving: true } : t))
        );
        window.setTimeout(() => remove(id), LEAVE_MS);
      }, AUTO_DISMISS_MS);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast ${toast.type}${toast.leaving ? " toast-leaving" : ""}`}
            role={toast.type === "error" ? "alert" : "status"}
          >
            <span className="toast-icon" aria-hidden="true">
              {ICONS[toast.type]}
            </span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
