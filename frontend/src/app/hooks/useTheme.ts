import { useCallback } from "react";
import useUserPrefs from "./useUserPrefs";

const useTheme = () => {
  const { userTheme, updateUserTheme } = useUserPrefs();

  const toggleTheme = useCallback(() => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    window.dispatchEvent(new Event("theme-changed"));

    updateUserTheme(newTheme);
  }, [updateUserTheme]);

  return { toggleTheme, userTheme };
};

export default useTheme;
