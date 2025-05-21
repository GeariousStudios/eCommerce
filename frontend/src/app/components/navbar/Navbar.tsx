"use client";

import {
  UserCircleIcon as OutlineUserCircleIcon,
  HomeIcon as OutlineHomeIcon,
} from "@heroicons/react/24/outline";
import {
  UserCircleIcon as SolidUserCircleIcon,
  HomeIcon as SolidHomeIcon,
} from "@heroicons/react/24/solid";
import NavbarLink from "./NavbarLink";
import NavbarSubmenu from "./NavbarSubmenu";
import useTheme from "../../hooks/useTheme";
import { ReactNode, useEffect, useRef } from "react";
import Link from "next/link";
import Message from "../message/Message";
import useAuthStatus from "@/app/hooks/useAuthStatus";

type Props = {
  hasScrollbar: boolean;
  setHasScrollbar: (value: boolean) => void;
};

const Navbar = (props: Props) => {
  // --- VARIABLES ---
  // --- Refs ---
  const innerRef = useRef<HTMLDivElement>(null);

  // --- Other ---
  const { isAuthReady, isDev } = useAuthStatus();
  const { currentTheme } = useTheme();

  // --- SCROLLBAR OBSERVER ---
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

  // --- CLASSES ---
  let titleClass =
    "flex pb-2 text-xs font-bold text-[var(--text-navbar-header)] uppercase";

  return (
    <>
      <nav className="transtion-[max-width] fixed top-1/2 z-[calc(var(--z-overlay)-2)] ml-6 h-[calc(100%-3rem)] max-w-58 min-w-58 -translate-y-1/2 flex-col rounded-2xl bg-[var(--bg-navbar)] p-6 whitespace-nowrap text-[var(--text-navbar)] duration-[var(--slow)]">
        <div className="relative h-full w-full">
          {!isAuthReady ? (
            <div className="inline">
              <Message icon="loading" content="Hämtar innehåll..." />
            </div>
          ) : (
            <div
              ref={innerRef}
              id="navbar-menu"
              role="navigation"
              aria-label="Huvudmeny"
              className={"flex h-full flex-col overflow-x-hidden"}
            >
              {/* --- LOGO --- */}
              <div className="flex flex-col">
                <div className="mb-2 flex transition-transform duration-[var(--slow)]">
                  <Link
                    href="/"
                    className="flex h-10 max-w-38 min-w-38"
                    aria-label="Startsida"
                  >
                    <picture>
                      {/* <source
                        srcSet={`${currentTheme === "dark" ? "/images/logo_expnd_dark.svg" : "/images/logo_expnd_light.svg"}`}
                        media="(min-width: 768px)"
                      /> */}
                      <img
                        src={`${currentTheme === "dark" ? "/images/logo_expnd_dark.svg" : "/images/logo_expnd_light.svg"}`}
                        alt="Logga"
                        className="h-full w-full"
                      />
                    </picture>
                  </Link>
                </div>

                <hr className="mt-4 mb-6 rounded-full text-[var(--hr-fill)]" />

                {/* --- LINK CONTAINER 1 --- */}
                <div className="flex flex-col">
                  {isDev && (
                    <div>
                      <span className={titleClass}>Utvecklare</span>
                      <NavbarSubmenu
                        label="Användare"
                        icon={OutlineUserCircleIcon}
                        iconHover={SolidUserCircleIcon}
                        menus={[
                          {
                            items: [
                              {
                                href: "/users",
                                label: "Användare",
                              },
                            ],
                          },
                        ]}
                        hasScrollbar={props.hasScrollbar}
                      />

                      <hr className="mt-4 mb-6 rounded-full text-[var(--hr-fill)]" />
                    </div>
                  )}
                </div>

                {/* --- LINK CONTAINER 2 --- */}
                <div className="flex flex-col">
                  <span className={titleClass}>Din dashboard</span>
                  <NavbarLink
                    href="/"
                    label="Startsida"
                    icon={OutlineHomeIcon}
                    iconHover={SolidHomeIcon}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
