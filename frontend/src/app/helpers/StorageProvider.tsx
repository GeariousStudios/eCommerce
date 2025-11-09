"use client";

import { ReactNode, useEffect, useState } from "react";

export default function StorageProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<string | null>(null);
  const [language, setLanguage] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    const savedLanguage = localStorage.getItem("language") || "sv";
    setTheme(savedTheme);
    setLanguage(savedLanguage);
    document.documentElement.setAttribute("data-theme", savedTheme);
    document.documentElement.setAttribute("data-language", savedLanguage);
    document.documentElement.setAttribute("lang", savedLanguage);
  }, []);

  if (theme === null || language === null) {
    return <></>;
  }

  return <>{children}</>;
}
