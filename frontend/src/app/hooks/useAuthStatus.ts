import { useEffect, useState } from "react";

const useAuthStatus = () => {
  // --- VARIABLES ---
  // --- States ---
  const [isLoadingAuthStatus, setIsLoadingAuthStatus] = useState<
    boolean | null
  >(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // --- Other variables ---
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  const resetInfo = () => {
    setUserRoles([]);
    setUsername("");
    setFirstName("");
    setLastName("");
  };

  /* --- BACKEND --- */
  useEffect(() => {
    const fetchAuthData = async () => {
      try {
        setIsLoadingAuthStatus(true);

        // --- Test API connection ---
        const connectionResponse = await fetch(`${apiUrl}/ping`);
        setIsConnected(connectionResponse.ok);

        // --- Return if not connected ---
        if (!connectionResponse.ok) {
          setIsLoggedIn(false);
          resetInfo();
          return;
        }

        // --- Return if not logged in ---
        if (!token) {
          setIsLoggedIn(false);
          resetInfo();
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
          resetInfo();
          return;
        }

        const loginResult = await loginResponse.json();
        const loggedIn = loginResult.isLoggedIn === true;
        setIsLoggedIn(loggedIn);

        // --- User info ---
        if (loggedIn) {
          const infoResponse = await fetch(`${apiUrl}/user/info`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!infoResponse.ok) {
            resetInfo();
            return;
          }

          const infoResult = await infoResponse.json();
          setUserRoles(infoResult.roles);
          setUsername(infoResult.username);
          setFirstName(infoResult.firstName);
          setLastName(infoResult.lastName);
        } else {
          resetInfo();
        }
      } catch (err) {
        setIsConnected(false);
        setIsLoggedIn(false);
        resetInfo();
      } finally {
        setIsLoadingAuthStatus(false);
        setIsAuthReady(true);
      }
    };

    fetchAuthData();
  }, []);

  return {
    isLoggedIn,
    isAdmin: userRoles.includes("Admin"),
    isDev: userRoles.includes("Developer"),
    isConnected,
    isAuthReady,
    username,
    firstName,
    lastName,
  };
};

export default useAuthStatus;
