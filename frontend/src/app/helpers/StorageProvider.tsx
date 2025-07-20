"use client";

import { ReactNode, useEffect, useState } from "react";

export default function StorageProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("dataTheme", savedTheme);
  }, []);

  if (theme === null) {
    return <></>;
  }

  return <>{children}</>;
}
