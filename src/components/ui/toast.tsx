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
    <div className="fixed top-4 right-4 z-[100] flex max-w-md flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const iconConfig = {
    success: {
      icon: <CheckCircle2 className="h-5 w-5" />,
      borderColor: "border-l-success",
      iconBg: "bg-success/10",
      iconColor: "text-success",
    },
    error: {
      icon: <AlertCircle className="h-5 w-5" />,
      borderColor: "border-l-destructive",
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive",
    },
    warning: {
      icon: <AlertTriangle className="h-5 w-5" />,
      borderColor: "border-l-warning",
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
    },
    info: {
      icon: <Info className="h-5 w-5" />,
      borderColor: "border-l-primary",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
  };

  const config = iconConfig[toast.type];

  return (
    <div
      className={cn(
        "animate-slide-up group relative flex items-start gap-3 overflow-hidden rounded-lg border-t border-r border-b border-l-4",
        "bg-card shadow-[0_10px_38px_-10px_rgba(22,23,24,0.35),0_10px_20px_-15px_rgba(22,23,24,0.2)]",
        "backdrop-blur-sm",
        config.borderColor,
        "border-border/50",
        "p-4 pr-3"
      )}
      style={{
        boxShadow:
          "0 10px 38px -10px rgba(22, 38, 96, 0.15), 0 10px 20px -15px rgba(22, 38, 96, 0.1)",
      }}
    >
      {/* Icon with background */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
          config.iconBg
        )}
      >
        <div className={config.iconColor}>{config.icon}</div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-foreground text-sm leading-5 font-semibold">{toast.title}</p>
        {toast.description && (
          <p className="text-muted-foreground text-sm leading-5">{toast.description}</p>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100"
        aria-label="Close toast"
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
