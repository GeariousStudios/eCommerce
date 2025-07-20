"use client";

import {
  UserGroupIcon as OutlineUserGroupIcon,
  HomeIcon as OutlineHomeIcon,
  PresentationChartLineIcon as OutlinePresentationChartLineIcon,
  ChatBubbleBottomCenterTextIcon as OutlineChatBubbleBottomCenterTextIcon,
  NewspaperIcon as OutlineNewspaperIcon,
  ChevronDoubleLeftIcon,
} from "@heroicons/react/24/outline";
import {
  UserGroupIcon as SolidUserGroupIcon,
  HomeIcon as SolidHomeIcon,
  PresentationChartLineIcon as SolidPresentationChartLineIcon,
  ChatBubbleBottomCenterTextIcon as SolidChatBubbleBottomCenterTextIcon,
  NewspaperIcon as SolidNewspaperIcon,
} from "@heroicons/react/24/solid";
import NavbarLink from "./NavbarLink";
import NavbarSubmenu from "./NavbarSubmenu";
import useTheme from "../../hooks/useTheme";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Message from "../common/Message";
import useAuthStatus from "@/app/hooks/useAuthStatus";
import CustomTooltip from "../common/CustomTooltip";
import { useToast } from "../toast/ToastProvider";
import { iconButtonPrimaryClass } from "@/app/styles/buttonClasses";
import { FocusTrap } from "focus-trap-react";
import useIsDesktop from "@/app/hooks/useIsDesktop";

type Props = {
  hasScrollbar: boolean;
  setHasScrollbar: (value: boolean) => void;
  navbarHidden: boolean;
  setNavbarHidden: (value: boolean) => void;
};

// --- UNITS IN SUBMENU ---
type SubmenuItem = {
  title?: string;
  label: string;
  href: string;
};

type SubmenuGroup = {
  label: string;
  items: SubmenuItem[];
};

const Navbar = (props: Props) => {
  // --- VARIABLES ---
  // --- Refs ---
  const innerRef = useRef<HTMLDivElement>(null);

  // --- States ---
  const [units, setUnits] = useState<SubmenuGroup[]>([]);

  // --- Other ---
  const { isAuthReady, isDev, isAdmin } = useAuthStatus();
  const { currentTheme } = useTheme();
  const { notify } = useToast();
  const isDesktop = useIsDesktop();
  const prefix = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const token = localStorage.getItem("token");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // --- BACKEND ---
  // --- Fetch units ---
  const fetchUnits = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/unit?sortBy=unitGroupName&sortOrder=asc`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      // --- Fail ---
      const result = await response.json();

      if (!response.ok) {
        notify("error", result.message);
        return;
      }

      const visibleUnits = result.items.filter((unit: any) => !unit.isHidden);

      // --- Success ---
      const grouped: Record<string, SubmenuItem[]> = visibleUnits.reduce(
        (acc: Record<string, SubmenuItem[]>, unit: any) => {
          const groupName = unit.unitGroupName;

          if (!acc[groupName]) {
            acc[groupName] = [];
          }

          acc[groupName].push({
            label: unit.name,
            href: `/report/unit/${unit.id}`,
          });

          return acc;
        },
        {},
      );

      const itemsWithTitles: SubmenuItem[] = Object.entries(grouped).flatMap(
        ([groupName, items]) => [
          ...items.map((item, index) => ({
            ...item,
            title: index === 0 ? groupName : undefined,
          })),
        ],
      );

      if (itemsWithTitles.length > 0) {
        setUnits([{ label: "Enheter", items: itemsWithTitles }]);
      } else {
        setUnits([]);
      }
    } catch (err) {}
  };

  // --- INITIALLY FETCH UNITS ---
  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    fetchUnits();

    const handleUpdate = () => fetchUnits();
    window.addEventListener("unit-list-updated", handleUpdate);

    return () => {
      window.removeEventListener("unit-list-updated", handleUpdate);
    };
  }, [isAuthReady]);

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

  // --- HIDE/SHOW NAVBAR ---
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    const handleResize = (e: MediaQueryListEvent) => {
      props.setNavbarHidden(e.matches);
    };

    props.setNavbarHidden(mediaQuery.matches);

    mediaQuery.addEventListener("change", handleResize);

    return () => {
      mediaQuery.removeEventListener("change", handleResize);
    };
  }, []);

  const toggleNavbar = (hide?: boolean, show?: boolean) => {
    if (hide) {
      props.setNavbarHidden(false);
    } else if (show) {
      props.setNavbarHidden(true);
    } else {
      props.setNavbarHidden(!props.navbarHidden);
    }
  };

  return (
    <>
      <div
        className={`${
          !props.navbarHidden
            ? "fixed inset-0 z-[var(--z-overlay)] h-svh w-screen bg-black/50 md:static md:h-auto md:w-auto md:bg-transparent"
            : ""
        }`}
        onPointerDown={() => toggleNavbar()}
      >
        <nav
          className={`fixed z-[calc(var(--z-overlay)-1)] flex h-full w-full flex-col bg-[var(--bg-navbar)] ${
            props.navbarHidden
              ? "pointer-events-none max-w-0 opacity-0 transition-[max-width,opacity]"
              : props.hasScrollbar
                ? "max-w-67 opacity-100 transition-[max-width]"
                : "max-w-64 opacity-100 transition-[max-width]"
          } duration-[var(--medium)]`}
          inert={props.navbarHidden}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            if (
              !isDesktop &&
              e.target instanceof HTMLElement &&
              e.target.closest("a")
            ) {
              toggleNavbar(false);
            }
          }}
        >
          {/* Simulated border. */}

          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              allowOutsideClick: true,
              escapeDeactivates: false,
            }}
            paused={isDesktop || props.navbarHidden || !isAuthReady}
          >
            <div className="relative h-full w-full pt-18">
              <button
                tabIndex={0}
                aria-label="Dummy focus trap anchor"
                style={{
                  position: "absolute",
                  width: 1,
                  height: 1,
                  opacity: 0,
                  top: 0,
                  left: 0,
                  zIndex: 0,
                }}
              />
              {isAuthReady ? (
                <>
                  <div className="pointer-events-none absolute top-0 left-0 h-full w-full border-r-1 border-[var(--border-main)]" />
                  {/* Simulated border. */}
                  <div
                    ref={innerRef}
                    id="navbar-menu"
                    role="navigation"
                    aria-label="Huvudmeny"
                    className={
                      "flex h-full flex-col gap-4 overflow-x-hidden p-4"
                    }
                  >
                    <div className="flex flex-col">
                      <div className="fixed top-0 flex h-18 transition-transform duration-[var(--slow)]">
                        <Link
                          href="/"
                          className="mt-2.25 -ml-2.25 flex h-15 max-w-17 min-w-40"
                          aria-label="Startsida"
                        >
                          <img
                            src={`${prefix}/images/logo_expnd_${currentTheme === "dark" ? "dark" : "light"}.svg`}
                            alt="Logga"
                            className="h-full w-full"
                          />
                        </Link>
                      </div>

                      <button
                        onClick={() => toggleNavbar()}
                        className={`${iconButtonPrimaryClass} ${props.navbarHidden ? "invisible" : "visible"} fixed top-0 mt-5 ml-48 h-6 min-h-6 w-6 min-w-6`}
                      >
                        <ChevronDoubleLeftIcon />
                      </button>

                      <hr className="mt-1 mb-8 rounded-full text-[var(--border-main)]" />

                      {isAuthReady && isDev && (
                        <div>
                          <span className="flex pb-1 text-xs font-semibold whitespace-nowrap uppercase">
                            Utvecklare
                          </span>
                          <NavbarLink
                            href="/developer/manage/users/"
                            label="Hantera användare"
                            icon={OutlineUserGroupIcon}
                            iconHover={SolidUserGroupIcon}
                          />
                          <hr className="mt-4 mb-8 rounded-full text-[var(--border-main)]" />
                        </div>
                      )}

                      <span className="flex pb-1 text-xs font-semibold whitespace-nowrap uppercase">
                        Din dashboard
                      </span>

                      <NavbarLink
                        href="/"
                        label="Startsida"
                        icon={OutlineHomeIcon}
                        iconHover={SolidHomeIcon}
                      />

                      <NavbarSubmenu
                        label="Rapportering"
                        icon={OutlineChatBubbleBottomCenterTextIcon}
                        iconHover={SolidChatBubbleBottomCenterTextIcon}
                        menus={[
                          ...units,
                          {
                            label: "Administrera",
                            requiresAdmin: true,
                            items: [
                              {
                                title: "Hantera",
                                href: "/report/manage/categories/",
                                label: "Kategorier",
                              },
                              {
                                href: "/report/manage/units/",
                                label: "Enheter",
                              },
                              {
                                href: "/report/manage/unit-groups/",
                                label: "Grupper",
                              },
                              {
                                href: "/report/manage/unit-columns/",
                                label: "Kolumner",
                              },
                            ],
                          },
                        ]}
                        hasScrollbar={props.hasScrollbar}
                      />

                      <NavbarLink
                        tooltip="Ej implementerat!"
                        disabled
                        href="#"
                        label="Pulstavlor"
                        icon={OutlinePresentationChartLineIcon}
                        iconHover={SolidPresentationChartLineIcon}
                      />

                      {isAuthReady && isAdmin && (
                        <div>
                          <hr className="mt-4 mb-8 rounded-full text-[var(--border-main)]" />

                          <span className="flex pb-1 text-xs font-semibold whitespace-nowrap uppercase">
                            Admin
                          </span>
                          <NavbarSubmenu
                            label="Nyheter"
                            icon={OutlineNewspaperIcon}
                            iconHover={SolidNewspaperIcon}
                            menus={[
                              {
                                label: "Administrera",
                                requiresAdmin: true,
                                items: [
                                  {
                                    title: "Hantera",
                                    href: "/admin/manage/news-types/",
                                    label: "Nyhetstyper",
                                  },
                                ],
                              },
                            ]}
                            hasScrollbar={props.hasScrollbar}
                          />
                        </div>
                      )}
                    </div>

                    <div className="mb-4" />
                  </div>
                </>
              ) : (
                <div className="inline">
                  <span className="hidden md:inline">
                    <Message icon="loading" content="Hämtar innehåll..." />
                  </span>
                  <span className="inline md:hidden">
                    <Message icon="loading" />
                  </span>
                </div>
              )}
            </div>
          </FocusTrap>
        </nav>
      </div>
    </>
  );
};

export default Navbar;
