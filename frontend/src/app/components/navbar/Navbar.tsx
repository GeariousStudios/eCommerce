"use client";

import { UserIcon as OutlineUserIcon } from "@heroicons/react/24/outline";
import { UserIcon as SolidUserIcon } from "@heroicons/react/24/solid";
import NavbarLink from "./NavbarLink";
import NavbarSubmenu from "./NavbarSubmenu";
import useTheme from "../../hooks/useTheme";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Message from "../message/Message";
import useAuthStatus from "@/app/hooks/useAuthStatus";
import { useNotification } from "../notification/NotificationProvider";
import { InformationCircleIcon } from "@heroicons/react/20/solid";
import CustomTooltip from "../customTooltip/CustomTooltip";

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
        className={`${props.hasScrollbar ? "w-22 md:w-67" : "w-19 md:w-64"} fixed z-[calc(var(--z-overlay)-2)] flex h-full flex-col bg-[var(--bg-navbar)] duration-[var(--slow)]`}
      >
        {/* Simulated border. */}
        <div className="relative h-full w-full pt-18">
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
              className={"flex h-full flex-col gap-4 overflow-x-hidden py-4"}
            >
              <div className="flex flex-col">
                <span className="hidden px-4 pb-1 text-sm font-semibold md:flex">
                  Utvecklare
                </span>
                <span className="px-4 pb-1 font-semibold md:hidden">
                  <CustomTooltip side="left" content="Utvecklare">
                    <InformationCircleIcon className="h-5 w-5 opacity-50" />
                  </CustomTooltip>
                </span>
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
                        {
                          title: "Hantera",
                          href: "/users",
                          label: "Användare",
                        },
                      ],
                    },
                  ]}
                  hasScrollbar={props.hasScrollbar}
                />
              </div>

              {/* <NavbarLink
                href="/users"
                label="Länk 2"
                icon={OutlineUserIcon}
                iconHover={SolidUserIcon}
              /> */}

              <div className="mb-3" />
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
