"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div className="fixed right-4 bottom-4 z-50 flex max-w-md flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: <CheckCircle2 className="text-success h-5 w-5" />,
    error: <AlertCircle className="text-destructive h-5 w-5" />,
    warning: <AlertTriangle className="text-warning h-5 w-5" />,
    info: <Info className="text-primary h-5 w-5" />,
  };

  const backgrounds = {
    success: "bg-success/10 border-success/20",
    error: "bg-destructive/10 border-destructive/20",
    warning: "bg-warning/10 border-warning/20",
    info: "bg-primary/10 border-primary/20",
  };

  return (
    <div
      className={cn(
        "animate-slide-up flex items-start gap-3 rounded-xl border p-4 shadow-lg",
        "bg-card",
        backgrounds[toast.type]
      )}
    >
      {icons[toast.type]}
      <div className="min-w-0 flex-1">
        <p className="text-foreground font-semibold">{toast.title}</p>
        {toast.description && (
          <p className="text-muted-foreground mt-1 text-sm">{toast.description}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Convenience hooks for different toast types
export function useSuccessToast() {
  const { addToast } = useToast();
  return (title: string, description?: string) => addToast({ type: "success", title, description });
}

export function useErrorToast() {
  const { addToast } = useToast();
  return (title: string, description?: string) => addToast({ type: "error", title, description });
}

export function useWarningToast() {
  const { addToast } = useToast();
  return (title: string, description?: string) => addToast({ type: "warning", title, description });
}

export function useInfoToast() {
  const { addToast } = useToast();
  return (title: string, description?: string) => addToast({ type: "info", title, description });
}
