import { connection } from "next/server";
import { useEffect, useState } from "react";

const useAuthStatus = () => {
  // States.
  const [isLoadingAuthStatus, setIsLoadingAuthStatus] = useState<
    boolean | null
  >(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Other variables.
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  /* --- BACKEND COMMUNICATION --- */
  useEffect(() => {
    const fetchAuthData = async () => {
      try {
        setIsLoadingAuthStatus(true);

        // Test API connection.
        const connectionResponse = await fetch(`${apiUrl}/ping`);
        setIsConnected(connectionResponse.ok);

        // Skip the rest if not connected.
        if (!connectionResponse.ok) {
          setIsLoggedIn(false);
          setUserRoles([]);
          return;
        }

        // Check login.
        if (!token) {
          setIsLoggedIn(false);
          setUserRoles([]);
          return;
        }

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
        setIsConnected(false);
        setIsLoggedIn(false);
        setUserRoles([]);
      } finally {
        setIsLoadingAuthStatus(false);
        setIsAuthReady(true);
      }
    };

    fetchAuthData();
  }, []);
  /* --- BACKEND COMMUNICATION --- */

  return {
    isLoggedIn,
    isAdmin: userRoles.includes("Admin"),
    isDev: userRoles.includes("Developer"),
    isConnected,
    isAuthReady,
  };
};

export default useAuthStatus;
