import { useEffect, useState } from "react";
import useAuthStatus from "./useAuthStatus";

const useUserPreferences = () => {
  // States.
  const { isLoggedIn } = useAuthStatus();
  const [userTheme, setUserTheme] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Other variables.
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  /* --- BACKEND COMMUNICATION --- */
  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    // Theme fetcher.
    const fetchUserTheme = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${apiUrl}/user-preferences`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          return;
        }

        const result = await response.json();
        setUserTheme(result.theme);
      } catch (err) {
        console.error("Misslyckades att hämta användartema:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserTheme();
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
    } catch (err) {
      console.error("Misslyckades att uppdatera användartema:", err);
    }
  };
  /* --- BACKEND COMMUNICATION --- */

  return { userTheme, updateUserTheme, isLoading };
};

export default useUserPreferences;
