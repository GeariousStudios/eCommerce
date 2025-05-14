"use client";

import { UserIcon as OutlineUserIcon } from "@heroicons/react/24/outline";
import { UserIcon as SolidUserIcon } from "@heroicons/react/20/solid";
import NavbarLink from "./NavbarLink";
import NavbarSubmenu from "./NavbarSubmenu";
import useTheme from "../../hooks/useTheme";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Message from "../message/Message";
import useAuthStatus from "@/app/hooks/useAuthStatus";
import { useNotification } from "../notification/NotificationProvider";

type Props = {
  hasScrollbar: boolean;
  setHasScrollbar: (value: boolean) => void;
};

const Navbar = (props: Props) => {
  // Refs.
  const innerRef = useRef<HTMLDivElement>(null);

  // States.
  const { isAuthReady } = useAuthStatus();
  const { toggleTheme, userTheme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<string | null>(null);

  // Other variables.
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");
  const { notify } = useNotification();

  // Display logout message.
  useEffect(() => {
    const message = localStorage.getItem("postLogoutNotification");
    if (message) {
      notify("info", message, 6000);
      localStorage.removeItem("postLogoutNotification");
    }
  }, []);

  /* --- BACKEND COMMUNICATION --- */
  const handleLogout = async () => {
    try {
      await fetch(`${apiUrl}/user/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
    } finally {
      localStorage.removeItem("token");
      localStorage.setItem("postLogoutNotification", "Du är nu utloggad!");
      window.location.reload();
    }
  };
  /* --- BACKEND COMMUNICATION --- */

  // Attach observer to check for scrollbar.
  useEffect(() => {
    const element = innerRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver(() => {
      props.setHasScrollbar(element.scrollHeight > element.clientHeight);
    });

    observer.observe(element);

    props.setHasScrollbar(element.scrollHeight > element.clientHeight);

    return () => {
      observer.disconnect();
    };
  }, [isAuthReady]);

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
      <div className="overflow-y-auto" />
      <nav
        className={`${props.hasScrollbar ? "w-21 md:w-67" : "w-18 md:w-64"} fixed z-[calc(var(--z-overlay)-1)] flex h-svh flex-col bg-[var(--bg-navbar)] duration-[var(--slow)]`}
      >
        {/* Simulated border. */}
        <div className="relative h-full w-full">
          <div className="pointer-events-none absolute top-0 left-0 h-full w-full border-r-2 border-[var(--border-main)]" />
          {/* Simulated border */}
          {!isAuthReady ? (
            <Message icon="loading" content="Hämtar innehåll..." />
          ) : (
            <div
              ref={innerRef}
              id="navbar-menu"
              role="navigation"
              aria-label="Huvudmeny"
              className={"flex h-full flex-col overflow-x-hidden"}
            >
              <Link href="/" className="mt-4 mb-4" aria-label="Startsida">
                <picture className="flex items-center justify-center">
                  <source
                    srcSet={`${currentTheme === "dark" ? "/images/logo_expnd_dark.svg" : "/images/logo_expnd_light.svg"}`}
                    media="(min-width: 768px)"
                  />
                  <img
                    src={`${currentTheme === "dark" ? "/images/logo_clpsd_dark.svg" : "/images/logo_clpsd_light.svg"}`}
                    alt="Logga"
                    className="h-12 md:h-32"
                  />
                </picture>
              </Link>

              <NavbarSubmenu
                label="Användare"
                icon={OutlineUserIcon}
                iconHover={SolidUserIcon}
                menus={[
                  {
                    label: "Inställningar",
                    items: [
                      {
                        title: "Tema",
                        onClick: toggleTheme,
                        label:
                          currentTheme === "dark"
                            ? "Byt till ljust tema"
                            : "Byt till mörkt tema",
                      },
                      {
                        title: "Session",
                        onClick: handleLogout,
                        label: "Logga ut",
                        requiresLogin: true,
                      },
                    ],
                  },
                  {
                    label: "För utvecklare",
                    requiresDev: true,
                    items: [
                      { title: "Hantera", href: "/users", label: "Användare" },
                    ],
                  },
                ]}
                hasScrollbar={props.hasScrollbar}
              />

              {/* <NavbarLink href="/users" label="Länk 2" icon={OutlineUserIcon} iconHover={SolidUserIcon} /> */}

              <div className="mb-3" />
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
