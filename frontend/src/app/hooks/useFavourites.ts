import { useEffect, useState } from "react";
import useAuthStatus from "./useAuthStatus";
import { useToast } from "../components/toast/ToastProvider";
import { useTranslations } from "next-intl";

type FavouriteItem = {
  href: string;
  label: string;
  icon: string;
  order: number;
};

const useFavourites = () => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- States ---
  const { isLoggedIn } = useAuthStatus();
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- Other ---
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const { notify } = useToast();

  /* --- BACKEND --- */
  // --- Fetch user favourites ---
  const fetchUserFavourites = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/user-favourites`, {
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setFavourites([]);
        return;
      }

      const result = await response.json();

      const sorted = (result.items ?? [])
        .slice()
        .sort((a: any, b: any) => a.order - b.order);
      setFavourites(sorted);
    } catch (err) {
      setFavourites([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addUserFavourite = async (
    href: string,
    label: string,
    icon: string,
  ) => {
    try {
      const response = await fetch(`${apiUrl}/user-favourites`, {
        method: "POST",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ href, label, icon }),
      });

      let result: any = null;

      if (response.headers.get("content-type")?.includes("application/json")) {
        result = await response.json();
      }

      if (!response.ok) {
        notify("error", result.message);
        return;
      }

      setFavourites((prev) => prev.filter((f) => f.href !== href));
      notify("success", label + t("Navbar/added favourite"));

      fetchUserFavourites();
      window.dispatchEvent(new Event("favourites-updated"));
    } catch (err) {}
  };

  const removeUserFavourite = async (href: string, label: string) => {
    try {
      const response = await fetch(`${apiUrl}/user-favourites`, {
        method: "DELETE",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ href }),
      });

      let result: any = null;

      if (response.headers.get("content-type")?.includes("application/json")) {
        result = await response.json();
      }

      if (!response.ok) {
        notify("error", result.message);
        return;
      }

      setFavourites((prev) => prev.filter((f) => f.href !== href));
      notify("success", label + t("Navbar/removed favourite"));

      fetchUserFavourites();
      window.dispatchEvent(new Event("favourites-updated"));
    } catch (err) {}
  };

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    fetchUserFavourites();

    const onUpdate = () => fetchUserFavourites();
    window.addEventListener("favourites-updated", onUpdate);
    return () => window.removeEventListener("favourites-updated", onUpdate);
  }, [isLoggedIn]);

  return {
    favourites,
    isLoading,
    addUserFavourite,
    removeUserFavourite,
  };
};

export default useFavourites;
