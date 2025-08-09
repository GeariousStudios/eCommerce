import { useEffect, useState } from "react";
import useAuthStatus from "./useAuthStatus";
import { useToast } from "../components/toast/ToastProvider";
import { useTranslations } from "next-intl";

type FavouriteItem = {
  href: string;
  order: number;
};

const useFavourites = () => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- States ---
  const { isLoggedIn } = useAuthStatus();
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);
  const [isLoadingFavourites, setIsLoadingFavourites] = useState(false);

  // --- Other ---
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const { notify } = useToast();

  /* --- BACKEND --- */
  const reorderFavourites = async (hrefOrder: string[]) => {
    setFavourites((prev) => {
      const map = new Map(prev.map((f) => [f.href, f]));
      const reordered: FavouriteItem[] = hrefOrder
        .map((href, index) => {
          const item = map.get(href);
          if (!item) return null;
          return { ...item, order: index };
        })
        .filter(Boolean) as FavouriteItem[];
      return reordered;
    });

    try {
      const response = await fetch(`${apiUrl}/user-favourites`, {
        method: "PUT",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: hrefOrder.map((href, order) => ({ href, order })),
        }),
      });

      if (!response.ok) {
        await fetchUserFavourites();

        let result: any = null;

        if (
          response.headers.get("content-type")?.includes("application/json")
        ) {
          result = await response.json();
        }

        notify("error", result?.message ?? t("Modal/Unknown error"));
        return;
      }

      await fetchUserFavourites();
      window.dispatchEvent(new Event("favourites-updated"));
    } catch (err) {
      await fetchUserFavourites();
    }
  };

  // --- Fetch user favourites ---
  const fetchUserFavourites = async () => {
    setIsLoadingFavourites(true);
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
      setIsLoadingFavourites(false);
    }
  };

  const addUserFavourite = async (href: string) => {
    try {
      const response = await fetch(`${apiUrl}/user-favourites`, {
        method: "POST",
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
        notify("error", result?.message ?? t("Modal/Unknown error"));
        return;
      }

      setFavourites((prev) => prev.filter((f) => f.href !== href));
      notify("info", t("Navbar/Added favourite"));

      fetchUserFavourites();
      window.dispatchEvent(new Event("favourites-updated"));
    } catch (err) {}
  };

  const removeUserFavourite = async (href: string) => {
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
        notify("error", result?.message ?? t("Modal/Unknown error"));
        return;
      }

      setFavourites((prev) => prev.filter((f) => f.href !== href));
      notify("info", t("Navbar/Deleted favourite"));

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
    isLoadingFavourites,
    addUserFavourite,
    removeUserFavourite,
    reorderFavourites,
  };
};

export default useFavourites;
