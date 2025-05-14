"use client";

import { ReactNode, useEffect, useState } from "react";

export default function StorageProvider({ children }: { children: ReactNode }) {
  // States.
  const [theme, setTheme] = useState<string | null>(null);

  // Load current theme.
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
