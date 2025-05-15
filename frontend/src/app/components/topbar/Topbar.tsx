import {
  iconButtonPrimaryClass,
  roundedButtonClass,
} from "@/app/styles/buttonClasses";
import { BellIcon, UserIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useNotification } from "../notification/NotificationProvider";
import useAuthStatus from "@/app/hooks/useAuthStatus";

const Topbar = () => {
  // States.
  const [currentTheme, setCurrentTheme] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Other variables.
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");
  const { notify } = useNotification();
  const { username, name, isLoggedIn } = useAuthStatus();

  //   Hide topbar on scroll.
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Update theme variable.
  useEffect(() => {
    const updateTheme = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      setCurrentTheme(theme);
    };

    updateTheme();

    window.addEventListener("theme-changed", updateTheme);
    return () => {
      window.removeEventListener("theme-changed", updateTheme);
    };
  }, []);

  return (
    <>
      <div
        inert={isVisible}
        className={`${isVisible ? "-translate-y-full" : "translate-y-0"} fixed top-0 z-[calc(var(--z-overlay)-1)] flex h-18 transition-transform duration-[var(--slow)]`}
      >
        <Link
          href="/"
          className="mt-1.25 ml-1.75 flex h-15 w-17 md:w-40"
          aria-label="Startsida"
        >
          <picture>
            <source
              srcSet={`${currentTheme === "dark" ? "/images/logo_expnd_dark.svg" : "/images/logo_expnd_light.svg"}`}
              media="(min-width: 768px)"
            />
            <img
              src={`${currentTheme === "dark" ? "/images/logo_clpsd_dark.svg" : "/images/logo_clpsd_light.svg"}`}
              alt="Logga"
              className="h-full w-full"
            />
          </picture>
        </Link>
      </div>

      <div
        inert={!isVisible}
        className={`${isVisible ? "translate-y-0" : "-translate-y-full"} fixed top-0 z-[calc(var(--z-overlay)-1)] flex h-18 w-full border-b-2 border-[var(--border-main)] bg-[var(--bg-navbar)] transition-transform duration-[var(--slow)]`}
      >
        <Link
          href="/"
          className="mt-1.25 ml-1.75 flex h-15 w-17 md:w-40"
          aria-label="Startsida"
        >
          <picture>
            <source
              srcSet={`${currentTheme === "dark" ? "/images/logo_expnd_dark.svg" : "/images/logo_expnd_light.svg"}`}
              media="(min-width: 768px)"
            />
            <img
              src={`${currentTheme === "dark" ? "/images/logo_clpsd_dark.svg" : "/images/logo_clpsd_light.svg"}`}
              alt="Logga"
              className="h-full w-full"
            />
          </picture>
        </Link>

        {/* Buttons */}
        <div className="mr-4 flex h-full w-full items-center justify-end gap-4">
          {isLoggedIn && (
            <div className="hidden whitespace-nowrap md:flex">
              Inloggad som:{" "}
              <span className="font-semibold text-[var(--accent-color)]">
                {name || username}
              </span>
            </div>
          )}
          <button className={`${roundedButtonClass}`}>
            <UserIcon className="h-6 w-6" />
          </button>
          {isLoggedIn && (
            <button className={`${roundedButtonClass}`}>
              <BellIcon className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default Topbar;
