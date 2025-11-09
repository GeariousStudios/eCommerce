import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const useUserPrefs = () => {
  // --- VARIABLES ---
  // --- States ---
  const { isLoggedIn } = useAuth();
  const [userTheme, setUserTheme] = useState<string | null>(null);
  const [userLanguage, setUserLanguage] = useState<string | null>(null);
  const [isGridView, setIsGridView] = useState<boolean | null>(null);
  const [isLoadingUserPrefs, setIsLoadingUserPrefs] = useState(false);

  // --- Other ---
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  // const token = localStorage.getItem("token");
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

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
          headers: {
            "X-User-Language": localStorage.getItem("language") || "sv",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const result = await response.json();
        setUserTheme(result.theme);
        setUserLanguage(result.language);
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
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ theme: newTheme }),
      });
      setUserTheme(newTheme);
    } catch (err) {}
  };

  const updateUserLanguage = async (newLanguage: string) => {
    try {
      await fetch(`${apiUrl}/user-preferences/language`, {
        method: "PUT",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ language: newLanguage }),
      });
      setUserLanguage(newLanguage);
    } catch (err) {}
  };

  const updateIsGridView = async (isGrid: boolean) => {
    try {
      await fetch(`${apiUrl}/user-preferences/view`, {
        method: "PUT",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
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

  // --- UPDATE USER LANGUAGE ---
  useEffect(() => {
    if (userLanguage) {
      document.documentElement.setAttribute("data-language", userLanguage);
      localStorage.setItem("language", userLanguage);
      window.dispatchEvent(new Event("language-changed"));
    }
  }, [userLanguage]);

  return {
    userTheme,
    updateUserTheme,
    userLanguage,
    updateUserLanguage,
    isGridView,
    updateIsGridView,
    isLoadingUserPrefs,
  };
};

export default useUserPrefs;
