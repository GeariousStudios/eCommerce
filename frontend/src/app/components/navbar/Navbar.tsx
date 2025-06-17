"use client";

import {
  UserGroupIcon as OutlineUserGroupIcon,
  HomeIcon as OutlineHomeIcon,
  PresentationChartLineIcon as OutlinePresentationChartLineIcon,
  ChatBubbleBottomCenterTextIcon as OutlineChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/outline";
import {
  UserGroupIcon as SolidUserGroupIcon,
  HomeIcon as SolidHomeIcon,
  PresentationChartLineIcon as SolidPresentationChartLineIcon,
  ChatBubbleBottomCenterTextIcon as SolidChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/solid";
import NavbarLink from "./NavbarLink";
import NavbarSubmenu from "./NavbarSubmenu";
import useTheme from "../../hooks/useTheme";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Message from "../message/Message";
import useAuthStatus from "@/app/hooks/useAuthStatus";
import CustomTooltip from "../customTooltip/CustomTooltip";
import { useToast } from "../toast/ToastProvider";

type Props = {
  hasScrollbar: boolean;
  setHasScrollbar: (value: boolean) => void;
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
  const prefix = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const token = localStorage.getItem("token");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // --- BACKEND ---
  // --- Fetch units ---
  const fetchUnits = async () => {
    try {
      const response = await fetch(`${apiUrl}/unit`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

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
            href: `#`,
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
                    <NavbarLink
                      href="/users/"
                      label="Hantera användare"
                      icon={OutlineUserGroupIcon}
                      iconHover={SolidUserGroupIcon}
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
                          href: "/categories/",
                          label: "Kategorier",
                        },
                        {
                          href: "/units/",
                          label: "Enheter",
                        },
                        {
                          href: "/unitGroups/",
                          label: "Enhetsgrupper",
                        },
                      ],
                    },
                  ]}
                  hasScrollbar={props.hasScrollbar}
                  onOpen={() => {
                    if (isAuthReady && units.length === 0) {
                      fetchUnits();
                    }
                  }}
                />

                <NavbarLink
                  tooltip="Ej implementerat!"
                  disabled
                  href="#"
                  label="Pulstavlor"
                  icon={OutlinePresentationChartLineIcon}
                  iconHover={SolidPresentationChartLineIcon}
                />
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
