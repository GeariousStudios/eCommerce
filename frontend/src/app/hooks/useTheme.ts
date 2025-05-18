import { useCallback, useEffect, useState } from "react";
import useUserPrefs from "./useUserPrefs";

const useTheme = () => {
  // States.
  const [currentTheme, setCurrentTheme] = useState<string | null>(null);

  // Other variables.
  const { userTheme, updateUserTheme } = useUserPrefs();

  // Update currentTheme.
  useEffect(() => {
    const updateTheme = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      setCurrentTheme(theme);
    };

    updateTheme();

    window.addEventListener("theme-changed", updateTheme);
    return () => {
      window.removeEventListener("theme-changed", updateTheme);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    window.dispatchEvent(new Event("theme-changed"));

    updateUserTheme(newTheme);
  }, [updateUserTheme]);

  return { toggleTheme, userTheme, currentTheme };
};

export default useTheme;
