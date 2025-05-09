import { useEffect, useState } from "react";

const useAuthStatus = () => {
  // States.
  const [isLoading, setIsLoading] = useState<boolean | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  // Other variables.
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  /* --- BACKEND COMMUNICATION --- */
  useEffect(() => {
    const fetchAuthData = async () => {
      if (!token) {
        setIsLoggedIn(false);
        setUserRoles([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Check login.
        const loginResponse = await fetch(`${apiUrl}/user/check-login`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!loginResponse.ok) {
          setIsLoggedIn(false);
          setUserRoles([]);
          return;
        }

        const loginResult = await loginResponse.json();
        const loggedIn = loginResult.isLoggedIn === true;
        setIsLoggedIn(loggedIn);

        // Check roles.
        if (loggedIn) {
          const roleResponse = await fetch(`${apiUrl}/user/roles`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!roleResponse.ok) {
            setUserRoles([]);
            return;
          }

          const roleResult = await roleResponse.json();
          setUserRoles(roleResult.roles);
        } else {
          setUserRoles([]);
        }
      } catch (err) {
        console.error("Misslyckades med att hämta auth-status:", err);
        setIsLoggedIn(false);
        setUserRoles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuthData();
  }, []);
  /* --- BACKEND COMMUNICATION --- */

  const isAdmin = userRoles.includes("Admin");
  const isDev = userRoles.includes("Developer");

  return { isLoggedIn, isAdmin, isDev, isLoading };
};

export default useAuthStatus;
