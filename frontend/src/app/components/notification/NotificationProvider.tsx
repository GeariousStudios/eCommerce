"use client";

import {
  ReactNode,
  useCallback,
  useContext,
  useState,
  createContext,
} from "react";
import Notification from "./Notification";
import { v4 as uuid } from "uuid";

type NotificationType = "success" | "error" | "info";

type NotificationItem = {
  id: string;
  content: string;
  type: NotificationType;
  duration?: number;
};

type NotificationContextType = {
  notify: (type: NotificationType, content: string, duration?: number) => void;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotification must be used inside NotificationProvider");
  }

  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const notify = useCallback(
    (type: NotificationType, content: string, duration?: number) => {
      const id = uuid();
      setNotifications((prev) => [...prev, { id, type, content, duration }]);

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, (duration ?? 3000) + 500);
    },
    [],
  );

  const remove = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-3 right-3 z-[calc(var(--z-tooltip)-1)] flex w-72 min-w-72 flex-col gap-3">
        {notifications.map((n) => (
          <Notification
            key={n.id}
            content={n.content}
            type={n.type}
            duration={n.duration}
            onDone={() => remove(n.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
