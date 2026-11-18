import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

export type ToastTone = "success" | "error" | "warning" | "info";

type Toast = { id: string; message: string; tone: ToastTone };
type ToastValue = {
  show(message: string, tone?: ToastTone): void;
  dismiss(id: string): void;
};

const ToastContext = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((message: string, tone: ToastTone = "info") => {
    const id = crypto.randomUUID();
    if (tone === "error") {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current.clear();
    }
    setToasts((current) => tone === "error" ? [{ id, message, tone }] : [...current, { id, message, tone }]);
    timers.current.set(id, window.setTimeout(() => dismiss(id), tone === "error" ? 6500 : 4500));
  }, [dismiss]);

  const value = useMemo(() => ({ show, dismiss }), [dismiss, show]);
  return <ToastContext.Provider value={value}>{children}<aside className="toast-viewport" aria-live="polite" aria-relevant="additions">
    {toasts.map((toast) => <div className={`toast toast--${toast.tone}`} key={toast.id} role={toast.tone === "error" ? "alert" : "status"}>
      <p>{toast.message}</p><button type="button" onClick={() => dismiss(toast.id)} aria-label="Закрыть уведомление">×</button>
    </div>)}
  </aside></ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used under ToastProvider");
  return context;
}
