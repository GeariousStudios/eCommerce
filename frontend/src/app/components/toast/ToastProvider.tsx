"use client";

import {
  ReactNode,
  useCallback,
  useContext,
  useState,
  createContext,
} from "react";
import Toast from "./Toast";
import { v4 as uuid } from "uuid";

type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: string;
  content: string;
  type: ToastType;
  duration?: number;
};

type ToastContextType = {
  notify: (type: ToastType, content: string, duration?: number) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const notify = useCallback(
    (type: ToastType, content: string, duration?: number) => {
      const id = uuid();
      setToasts((prev) => [...prev, { id, type, content, duration }]);

      setTimeout(
        () => {
          setToasts((prev) => prev.filter((n) => n.id !== id));
        },
        (duration ?? 3000) + 500,
      );
    },
    [],
  );

  const remove = (id: string) => {
    setToasts((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-4 z-[calc(var(--z-tooltip)-1)] mx-4 flex w-[calc(100%-2rem)] flex-col sm:mx-0 gap-4 sm:right-4 sm:w-72 sm:min-w-72">
        {toasts.map((n) => (
          <Toast
            key={n.id}
            content={n.content}
            type={n.type}
            duration={n.duration}
            onDone={() => remove(n.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
