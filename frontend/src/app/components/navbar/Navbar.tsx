"use client";

import {
  UserGroupIcon as OutlineUserGroupIcon,
  HomeIcon as OutlineHomeIcon,
  InboxStackIcon as OutlineInboxStackIcon,
  ArrowTrendingUpIcon as OutlineArrowTrendingUpIcon,
  UsersIcon as OutlineUsersIcon,
  TagIcon as OutlineTagIcon,
} from "@heroicons/react/24/outline";
import {
  UserGroupIcon as SolidUserGroupIcon,
  HomeIcon as SolidHomeIcon,
  InboxStackIcon as SolidInboxStackIcon,
  ArrowTrendingUpIcon as SolidArrowTrendingUpIcon,
  UsersIcon as SolidUsersIcon,
  TagIcon as SolidTagIcon,
} from "@heroicons/react/24/solid";
import NavbarLink from "./NavbarLink";
import NavbarSubmenu from "./NavbarSubmenu";
import useTheme from "../../hooks/useTheme";
import { useEffect, useRef } from "react";
import Link from "next/link";
import Message from "../message/Message";
import useAuthStatus from "@/app/hooks/useAuthStatus";
import CustomTooltip from "../customTooltip/CustomTooltip";

type Props = {
  hasScrollbar: boolean;
  setHasScrollbar: (value: boolean) => void;
};

const Navbar = (props: Props) => {
  // --- VARIABLES ---
  // --- Refs ---
  const innerRef = useRef<HTMLDivElement>(null);

  // --- Other ---
  const { isAuthReady, isDev, isAdmin } = useAuthStatus();
  const { currentTheme } = useTheme();
  const prefix = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

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

  return (
    <>
      <nav
        className={`${props.hasScrollbar ? "max-w-22 md:max-w-67" : "max-w-19 md:max-w-64"} transtion-[max-width] fixed z-[calc(var(--z-overlay)-1)] flex h-full w-full flex-col bg-[var(--bg-navbar)] duration-[var(--slow)]`}
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
                        srcSet={`${prefix}/images/logo_expnd_${currentTheme === "dark" ? "dark" : "light"}.svg`}
                        media="(min-width: 768px)"
                      />
                      <img
                        src={`${prefix}/images/logo_clpsd_${currentTheme === "dark" ? "dark" : "light"}.svg`}
                        alt="Logga"
                        className="h-full w-full"
                      />
                    </picture>
                  </Link>
                </div>

                <hr className="mb-4 rounded-full text-[var(--border-main)] md:mb-8" />

                {isDev && (
                  <div>
                    <span className="hidden pb-1 text-xs font-semibold whitespace-nowrap uppercase md:flex">
                      Utvecklare
                    </span>
                    <NavbarSubmenu
                      label="Användare"
                      icon={OutlineUserGroupIcon}
                      iconHover={SolidUserGroupIcon}
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
                    <hr className="mt-4 mb-4 rounded-full text-[var(--border-main)] md:mb-8" />
                  </div>
                )}

                <span className="hidden pb-1 text-xs font-semibold whitespace-nowrap uppercase md:flex">
                  Din dashboard
                </span>

                <NavbarLink
                  href="/"
                  label="Startsida"
                  icon={OutlineHomeIcon}
                  iconHover={SolidHomeIcon}
                />

                {isAdmin && (
                  <div>
                    <NavbarLink
                      tooltip="Ej implementerat!"
                      disabled
                      href="#"
                      label="Beställningar"
                      icon={OutlineInboxStackIcon}
                      iconHover={SolidInboxStackIcon}
                    />

                    <NavbarLink
                      tooltip="Ej implementerat!"
                      disabled
                      href="#"
                      label="Försäljningsstatistik"
                      icon={OutlineArrowTrendingUpIcon}
                      iconHover={SolidArrowTrendingUpIcon}
                    />

                    <hr className="mt-4 mb-4 rounded-full text-[var(--border-main)] md:mb-8" />

                    <span className="hidden pb-1 text-xs font-semibold whitespace-nowrap uppercase md:flex">
                      LÖPANDE
                    </span>
                    <NavbarLink
                      tooltip="Ej implementerat!"
                      disabled
                      href="#"
                      label="Kunder"
                      icon={OutlineUsersIcon}
                      iconHover={SolidUsersIcon}
                    />

                    <NavbarLink
                      tooltip="Ej implementerat!"
                      disabled
                      href="#"
                      label="Produkter"
                      icon={OutlineTagIcon}
                      iconHover={SolidTagIcon}
                    />
                  </div>
                )}
              </div>

              <div className="mb-4" />
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
