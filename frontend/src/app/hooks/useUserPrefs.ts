import { useEffect, useState } from "react";
import useAuthStatus from "./useAuthStatus";

const useUserPrefs = () => {
  // --- VARIABLES ---
  // --- States ---
  const { isLoggedIn } = useAuthStatus();
  const [userTheme, setUserTheme] = useState<string | null>(null);
  const [isGridView, setIsGridView] = useState<boolean | null>(null);
  const [isLoadingUserPrefs, setIsLoadingUserPrefs] = useState(false);

  // --- Other ---
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  /* --- BACKEND --- */
  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    // --- Fetch user preferences ---
    const fetchUserPreferences = async () => {
      setIsLoadingUserPrefs(true);
      try {
        const response = await fetch(`${apiUrl}/user-preferences`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          return;
        }

        const result = await response.json();
        setUserTheme(result.theme);
        setIsGridView(result.isGridView);
      } catch (err) {
      } finally {
        setIsLoadingUserPrefs(false);
      }
    };

    fetchUserPreferences();
  }, [isLoggedIn]);

  const updateUserTheme = async (newTheme: string) => {
    try {
      await fetch(`${apiUrl}/user-preferences/theme`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ theme: newTheme }),
      });
      setUserTheme(newTheme);
    } catch (err) {}
  };

  const updateIsGridView = async (isGrid: boolean) => {
    try {
      await fetch(`${apiUrl}/user-preferences/view`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isGridView: isGrid }),
      });
      setIsGridView(isGrid);
    } catch (err) {}
  };

  // --- UPDATE USER THEME ---
  useEffect(() => {
    if (userTheme) {
      document.documentElement.setAttribute("data-theme", userTheme);
      localStorage.setItem("theme", userTheme);
      window.dispatchEvent(new Event("theme-changed"));
    }
  }, [userTheme]);

  return {
    userTheme,
    updateUserTheme,
    isGridView,
    updateIsGridView,
    isLoadingUserPrefs,
  };
};

export default useUserPrefs;
