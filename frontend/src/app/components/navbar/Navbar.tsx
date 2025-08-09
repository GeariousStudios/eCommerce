"use client";

import { useTranslations } from "next-intl";
import NavbarLink from "./NavbarLink";
import NavbarSubmenu from "./NavbarSubmenu";
import useTheme from "../../hooks/useTheme";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Message from "../common/Message";
import useAuthStatus from "@/app/hooks/useAuthStatus";
import CustomTooltip from "../common/CustomTooltip";
import { useToast } from "../toast/ToastProvider";
import { iconButtonPrimaryClass } from "@/app/styles/buttonClasses";
import { FocusTrap } from "focus-trap-react";
import useIsDesktop from "@/app/hooks/useIsDesktop";
import useFavourites from "@/app/hooks/useFavourites";
import * as Outline from "@heroicons/react/24/outline";
import * as Solid from "@heroicons/react/24/solid";
import type { ElementType } from "react";
import DragDrop from "../common/DragDrop";

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
  icon?: string;

  overrideLabel?: string;
  isFavourite?: boolean;
  onToggleFavourite?: (isFavourite: boolean, href: string) => void;
};

type SubmenuGroup = {
  label: string;
  items: SubmenuItem[];
};

const Navbar = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- Refs ---
  const innerRef = useRef<HTMLDivElement>(null);

  // --- States ---
  const [units, setUnits] = useState<SubmenuGroup[]>([]);
  const [unitItems, setUnitItems] = useState<SubmenuItem[]>([]);
  const [unitsLoaded, setUnitsLoaded] = useState(false);
  const [isAnyDragging, setIsAnyDragging] = useState(false);

  // --- Other ---
  const { isAuthReady, isDev, isAdmin } = useAuthStatus();
  const { currentTheme } = useTheme();
  const { notify } = useToast();
  const isDesktop = useIsDesktop();
  const prefix = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const token = localStorage.getItem("token");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const {
    favourites,
    addUserFavourite,
    removeUserFavourite,
    reorderFavourites,
  } = useFavourites();

  // --- BACKEND ---
  // --- Fetch units ---
  const fetchUnits = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/unit?sortBy=unitGroupName&sortOrder=asc`,
        {
          headers: {
            "X-User-Language": localStorage.getItem("language") || "sv",
            "Content-Type": "application/json",
          },
        },
      );

      // --- Fail ---
      const result = await response.json();

      if (!response.ok) {
        notify("error", result?.message ?? t("Modal/Unknown error"));
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
            href: `/report/units/${unit.unitGroupId}/${unit.id}`,
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
            icon: "CubeIcon",
            onToggleFavourite,
          })),
        ],
      );

      setUnitItems(itemsWithTitles);
      setUnitsLoaded(true);
    } catch (err) {
    } finally {
    }
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

  // --- ADD/REMOVE FAVOURITE ---
  const onToggleFavourite = (isFavourite: boolean, href: string) => {
    if (isFavourite) {
      removeUserFavourite(href);
    } else {
      addUserFavourite(href);
    }
  };

  // --- LOOK UP LABELS AND ICONS ---
  const getMenuLookup = () => {
    const staticEntries: SubmenuItem[] = [
      { href: "/", label: t("Navbar/Home"), icon: "HomeIcon" },
      {
        href: "/developer/manage/users/",
        label: t("Common/Users"),
        icon: "UserGroupIcon",
      },
      {
        href: "/admin/manage/units/categories/",
        // label: t("Common/Manage") + " / " + t("Common/Categories"),
        label: t("Common/Categories"),
        icon: "WrenchIcon",
      },
      {
        href: "/admin/manage/units/",
        // label: t("Common/Manage") + " / " + t("Common/Units"),
        label: t("Common/Units"),
        icon: "WrenchIcon",
      },
      {
        href: "/admin/manage/units/unit-groups/",
        // label: t("Common/Manage") + " / " + t("Common/Groups"),
        label: t("Common/Groups"),
        icon: "WrenchIcon",
      },
      {
        href: "/admin/manage/units/unit-columns/",
        // label: t("Common/Manage") + " / " + t("Common/Columns"),
        label: t("Common/Columns"),
        icon: "WrenchIcon",
      },
      {
        href: "/admin/manage/news/news-types/",
        // label: t("Common/Manage") + " / " + t("Navbar/Types"),
        label: t("Navbar/Types"),
        icon: "WrenchIcon",
      },
      {
        href: "/admin/manage/shifts/",
        // label: t("Common/Manage") + " / " + t("Navbar/Types"),
        label: t("Navbar/Shifts"),
        icon: "WrenchIcon",
      },
    ];

    const dynamicUnits = unitItems.map((u) => ({
      href: u.href,
      label: u.overrideLabel ?? u.label,
      icon: u.icon ?? "CubeIcon",
    }));

    const all = [...staticEntries, ...dynamicUnits];

    const map = new Map<string, { label: string; icon?: string }>();
    all.forEach((item) =>
      map.set(item.href, {
        label: (item as any).overrideLabel ?? item.label,
        icon: item.icon,
      }),
    );
    return map;
  };

  const menuLookup = useMemo(() => getMenuLookup(), [unitItems, t]);

  const validFavourites = favourites.filter((f) => menuLookup.has(f.href));

  const resolvedFavourites = validFavourites.map((f) => {
    const hit = menuLookup.get(f.href)!;
    return { href: f.href, label: hit.label, icon: hit.icon ?? "" };
  });

  const unitItemsResolved = useMemo(
    () =>
      unitItems.map((it) => ({
        ...it,
        isFavourite: favourites.some((f) => f.href === it.href),
        onToggleFavourite,
      })),
    [unitItems, favourites],
  );

  useEffect(() => {
    if (!isAuthReady || !unitsLoaded) {
      return;
    }

    const isUnitHref = (href: string) => href.startsWith("/report/units/");

    const stale = favourites.filter(
      (f) => isUnitHref(f.href) && !menuLookup.has(f.href),
    );

    if (stale.length === 0) {
      return;
    }

    stale.forEach((f) => removeUserFavourite(f.href));
  }, [isAuthReady, unitsLoaded, menuLookup, favourites, removeUserFavourite]);

  return (
    <>
      <div
        className={`${
          !props.navbarHidden
            ? "fixed inset-0 z-[var(--z-overlay)] h-full w-screen bg-black/50 md:static md:h-auto md:w-auto md:bg-transparent"
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
              fallbackFocus: () => innerRef.current ?? document.body,
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
              <div className="pointer-events-none absolute top-0 left-0 h-full w-full border-r-1 border-[var(--border-main)]" />
              {/* Simulated border. */}

              {isAuthReady && unitsLoaded ? (
                <>
                  <div
                    ref={innerRef}
                    id="navbar-menu"
                    role="navigation"
                    aria-label={t("Navbar/Main menu")}
                    className={
                      "flex h-full flex-col gap-4 overflow-x-hidden p-4"
                    }
                  >
                    <div className="flex flex-col">
                      <div className="fixed top-0 flex h-18 transition-transform duration-[var(--slow)]">
                        <Link
                          href={`/`}
                          className="mt-2.25 -ml-2.25 flex h-15 max-w-17 min-w-40"
                          aria-label={t("Navbar/Home")}
                        >
                          <img
                            src={`${prefix}/images/logo_expnd_${currentTheme === "dark" ? "dark" : "light"}.svg`}
                            alt={t("Navbar/Logo")}
                            className="h-full w-full"
                          />
                        </Link>
                      </div>

                      <button
                        onClick={() => toggleNavbar()}
                        className={`${iconButtonPrimaryClass} ${props.navbarHidden ? "invisible" : "visible"} fixed top-0 mt-5 ml-48 h-6 min-h-6 w-6 min-w-6`}
                      >
                        <Outline.ChevronDoubleLeftIcon />
                      </button>

                      <hr className="mt-1 mb-7 rounded-full text-[var(--border-main)]" />

                      {/* --- USER FAVOURITES --- */}
                      {resolvedFavourites.length > 0 && (
                        <div>
                          <span className="flex pb-1 text-xs font-semibold whitespace-nowrap uppercase">
                            {t("Navbar/Favourites")}
                          </span>

                          <DragDrop
                            disableClass
                            items={resolvedFavourites.map((f) => f.href)}
                            getId={(id) => id}
                            onReorder={(newOrderHrefs) => {
                              reorderFavourites(newOrderHrefs);
                            }}
                            onDraggingChange={setIsAnyDragging}
                            renderItem={(href, isDragging) => {
                              const fav = resolvedFavourites.find(
                                (f) => f.href === href,
                              )!;
                              return (
                                <NavbarLink
                                  key={fav.href}
                                  href={fav.href}
                                  label={fav.label}
                                  icon={fav.icon}
                                  isFavourite
                                  isDragging={isAnyDragging}
                                  onToggleFavourite={(isFav, href) =>
                                    onToggleFavourite(isFav, href)
                                  }
                                />
                              );
                            }}
                          />

                          <hr className="mt-4 mb-7 rounded-full text-[var(--border-main)]" />
                        </div>
                      )}

                      {isDev && (
                        <div>
                          <span className="flex pb-1 text-xs font-semibold whitespace-nowrap uppercase">
                            {t("Common/Developer")}
                          </span>
                          <NavbarLink
                            href="/developer/manage/users/"
                            label={t("Common/Users")}
                            icon="UserGroupIcon"
                            isFavourite={favourites.some(
                              (f) => f.href === "/developer/manage/users/",
                            )}
                            onToggleFavourite={onToggleFavourite}
                          />
                          <hr className="mt-4 mb-7 rounded-full text-[var(--border-main)]" />
                        </div>
                      )}

                      <span className="flex pb-1 text-xs font-semibold whitespace-nowrap uppercase">
                        {t("Navbar/Your dashboard")}
                      </span>

                      <NavbarLink
                        href="/"
                        label={t("Navbar/Home")}
                        icon="HomeIcon"
                        isFavourite={favourites.some((f) => f.href === "/")}
                        onToggleFavourite={onToggleFavourite}
                      />

                      <NavbarSubmenu
                        label={t("Navbar/Report")}
                        icon={Outline.ChatBubbleBottomCenterTextIcon}
                        iconHover={Solid.ChatBubbleBottomCenterTextIcon}
                        hasScrollbar={props.hasScrollbar}
                        menus={[
                          ...(unitItemsResolved.length > 0
                            ? [
                                {
                                  label: t("Common/Units"),
                                  items: unitItemsResolved,
                                },
                              ]
                            : []),
                        ]}
                      />

                      <NavbarLink
                        tooltip={t("Common/Not implemented")}
                        disabled
                        href={`#`}
                        label={t("Navbar/Pulse boards")}
                        icon="PresentationChartLineIcon"
                      />

                      {isAdmin && (
                        <div>
                          <hr className="mt-4 mb-7 rounded-full text-[var(--border-main)]" />

                          <span className="flex pb-1 text-xs font-semibold whitespace-nowrap uppercase">
                            {t("Common/Admin")}
                          </span>
                          <NavbarSubmenu
                            label={t("Common/Manage")}
                            icon={Outline.WrenchIcon}
                            iconHover={Solid.WrenchIcon}
                            requiresAdmin
                            menus={[
                              {
                                label: t("Common/Units"),
                                items: [
                                  {
                                    href: "/admin/manage/units/unit-groups/",
                                    label: t("Common/Groups"),
                                    onToggleFavourite,
                                    isFavourite: favourites.some(
                                      (f) =>
                                        f.href ===
                                        "/admin/manage/units/unit-groups/",
                                    ),
                                  },
                                  {
                                    href: "/admin/manage/units/",
                                    label: t("Common/Units"),

                                    onToggleFavourite,
                                    isFavourite: favourites.some(
                                      (f) => f.href === "/admin/manage/units/",
                                    ),
                                  },
                                  {
                                    title: t("Navbar/Report"),
                                    href: "/admin/manage/units/categories/",
                                    label: t("Common/Categories"),

                                    onToggleFavourite,
                                    isFavourite: favourites.some(
                                      (f) =>
                                        f.href ===
                                        "/admin/manage/units/categories/",
                                    ),
                                  },
                                  {
                                    href: "/admin/manage/units/unit-columns/",
                                    label: t("Common/Columns"),

                                    onToggleFavourite,
                                    isFavourite: favourites.some(
                                      (f) =>
                                        f.href ===
                                        "/admin/manage/units/unit-columns/",
                                    ),
                                  },
                                ],
                              },
                              {
                                label: t("Navbar/Shifts"),
                                items: [
                                  {
                                    href: "/admin/manage/shifts/",
                                    label: t("Navbar/Shifts"),

                                    onToggleFavourite,
                                    isFavourite: favourites.some(
                                      (f) =>
                                        f.href ===
                                        "/admin/manage/shifts/",
                                    ),
                                  },
                                ],
                              },
                              {
                                label: t("Common/News"),
                                items: [
                                  {
                                    href: "/admin/manage/news/news-types/",
                                    label: t("Navbar/Types"),

                                    onToggleFavourite,
                                    isFavourite: favourites.some(
                                      (f) =>
                                        f.href ===
                                        "/admin/manage/news/news-types/",
                                    ),
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
                <Message icon="loading" content="content" />
              )}
            </div>
          </FocusTrap>
        </nav>
      </div>
    </>
  );
};

export default Navbar;
