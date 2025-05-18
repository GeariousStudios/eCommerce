"use client";

import { UserIcon as OutlineUserIcon } from "@heroicons/react/24/outline";
import { UserIcon as SolidUserIcon } from "@heroicons/react/24/solid";
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
  // Refs.
  const innerRef = useRef<HTMLDivElement>(null);

  // Other variables.
  const { isAuthReady, isDev } = useAuthStatus();
  const { currentTheme } = useTheme();

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

  return (
    <>
      <div className="overflow-y-auto" />
      <nav
        className={`${props.hasScrollbar ? "w-22 md:w-67" : "w-19 md:w-64"} fixed z-[calc(var(--z-overlay)-1)] flex h-full flex-col bg-[var(--bg-navbar)] duration-[var(--slow)]`}
      >
        {/* Simulated border. */}
        <div className="relative h-full w-full pt-18">
          <div className="pointer-events-none absolute top-0 left-0 h-full w-full border-r-1 border-[var(--border-main)]" />
          {/* Simulated border */}
          {!isAuthReady ? (
            <div className="inline">
              <span className="hidden md:inline">
                <Message icon="loading" content="Hämtar innehåll..." />
              </span>
              <span className="inline md:hidden">
                <Message icon="loading" />
              </span>
            </div>
          ) : (
            <div
              ref={innerRef}
              id="navbar-menu"
              role="navigation"
              aria-label="Huvudmeny"
              className={"flex h-full flex-col gap-4 overflow-x-hidden p-4"}
            >
              <div className="flex flex-col">
                <div className="fixed top-0 flex h-18 transition-transform duration-[var(--slow)]">
                  <Link
                    href="/"
                    className="mt-1.25 -ml-2.25 flex h-15 max-w-17 min-w-17 md:max-w-17 md:min-w-40"
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
                {isDev && (
                  <div>
                    <span className="hidden pb-1 text-sm font-semibold md:flex">
                      Utvecklare
                    </span>
                    <NavbarSubmenu
                      label="Användare"
                      icon={OutlineUserIcon}
                      iconHover={SolidUserIcon}
                      menus={[
                        {
                          label: "För utvecklare",
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
                )}
                {/* <NavbarLink
                  href={""}
                  label="Användare"
                  icon={OutlineUserIcon}
                  iconHover={SolidUserIcon}
                /> */}
              </div>

              <div className="mb-3" />
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
