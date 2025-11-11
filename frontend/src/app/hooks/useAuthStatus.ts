import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const useAuthStatus = () => {
  // --- VARIABLES ---
  // --- Refs ---
  const isLoggedInRef = useRef<boolean | null>(null);

  // --- States ---
  const [isLoadingAuthStatus, setIsLoadingAuthStatus] = useState<
    boolean | null
  >(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // --- Other variables ---
  const pathname = usePathname();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const resetInfo = () => {
    setUserRoles([]);
    setUsername("");
    setUserId(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setIsLoggedIn(false);
  };

  /* --- BACKEND --- */
  const fetchAuthData = async () => {
    const token = localStorage.getItem("token");
    const wasLoggedIn = isLoggedInRef.current;

    try {
      setIsLoadingAuthStatus(true);

      // --- Test API connection ---
      const connectionResponse = await fetch(`${apiUrl}/ping`);
      setIsConnected(connectionResponse.ok);

      // --- Return if not connected ---
      if (!connectionResponse.ok) {
        resetInfo();
        return;
      }

      // --- Return if not logged in ---
      if (!token) {
        resetInfo();
        return;
      }

      const loginResponse = await fetch(`${apiUrl}/user/check-login`, {
        headers: {"X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!loginResponse.ok) {
        if (wasLoggedIn) {
          location.reload();
          return;
        }

        resetInfo();
        return;
      }

      const loginResult = await loginResponse.json();
      const loggedIn = loginResult.isLoggedIn === true;

      if (wasLoggedIn === true && loggedIn === false) {
        location.reload();
        return;
      }

      setIsLoggedIn(loggedIn);
      isLoggedInRef.current = loggedIn;

      // --- User info ---
      if (loggedIn) {
        const infoResponse = await fetch(`${apiUrl}/user/info`, {
          headers: {"X-User-Language": localStorage.getItem("language") || "sv",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!infoResponse.ok) {
          if (wasLoggedIn) {
            location.reload();
            return;
          }

          resetInfo();
          return;
        }

        const infoResult = await infoResponse.json();
        setUserRoles(infoResult.roles);
        setUsername(infoResult.username);
        setUserId(infoResult.userId);
        setFirstName(infoResult.firstName);
        setLastName(infoResult.lastName);
        setEmail(infoResult.email);
      } else {
        resetInfo();
      }
    } catch (err) {
      resetInfo();
      setIsConnected(false);
    } finally {
      setIsLoadingAuthStatus(false);
      setIsAuthReady(true);
    }
  };

  useEffect(() => {
    fetchAuthData();
  }, [pathname]);
  

  return {
    isLoggedIn,
    isAdmin: userRoles.includes("Admin"),
    isDev: userRoles.includes("Developer"),
    isReporter: userRoles.includes("Reporter"),
    isPlanner: userRoles.includes("Planner"),
    isMasterPlanner: userRoles.includes("MasterPlanner"),
    isConnected,
    isAuthReady,
    username,
    userId,
    firstName,
    lastName,
    email,
    fetchAuthData,
  };
};

export default useAuthStatus;
