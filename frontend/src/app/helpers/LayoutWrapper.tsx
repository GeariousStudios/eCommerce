"use client";

import { ReactNode, useEffect, useState } from "react";
import Navbar from "../components/navbar/Navbar";
import Topbar from "../components/topbar/Topbar";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

type Props = {
  children: ReactNode;
};

type Breadcrumb = {
  label: string;
  href: string;
  clickable: boolean;
  isActive: boolean;
};

const LayoutWrapper = (props: Props) => {
  const t = useTranslations();

  // --- STATES ---
  const [hasScrollbar, setHasScrollbar] = useState(false);
  // const [navbarHidden, setNavbarHidden] = useState(false);
  const [navbarHidden, setNavbarHidden] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(max-width: 767px)").matches;
    }
    return false;
  });

  const [unitName, setUnitName] = useState<string | null>(null);
  const [unitGroupId, setUnitGroupId] = useState<string | null>(null);
  const [unitGroupName, setUnitGroupName] = useState<string | null>(null);

  // --- OTHER ---
  const pathname = usePathname();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // --- IF UNIT, GET UNIT/GROUP INFO ---
  useEffect(() => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length >= 3 && parts[0] === "report" && parts[1] === "units") {
      const groupId = parts[2];
      const unitId = parts[3];

      fetch(`${apiUrl}/unit/fetch/${unitId}`)
        .then((res) => res.json())
        .then((unit) => {
          if (unit?.name) {
            setUnitName(unit.name);
          }

          if (unit?.unitGroupId) {
            setUnitGroupId(String(unit.unitGroupId));

            fetch(`${apiUrl}/unit-group/fetch/${unit.unitGroupId}`)
              .then((res) => res.json())
              .then((group) => {
                if (group?.name) {
                  setUnitGroupName(group.name);
                }
              })
              .catch(() => {});
          }
        });
    } else {
      setUnitName(null);
      setUnitGroupId(null);
      setUnitGroupName(null);
    }
  }, [pathname]);

  // --- BREADCRUMB TRANSLATION ---
  const breadcrumbTranslation: Record<
    string,
    { label: string; clickable?: boolean }
  > = {
    // --- General ---
    manage: { label: t("Common/Manage"), clickable: false },

    // --- Report ---
    report: { label: t("Navbar/Report"), clickable: false },
    categories: { label: t("Common/Categories"), clickable: false },
    units: { label: t("Common/Units"), clickable: false },
    unit: { label: t("Common/Units"), clickable: false },
    "unit-groups": {
      label: t("Common/Groups"),
      clickable: false,
    },
    "unit-columns": {
      label: t("Common/Columns"),
      clickable: false,
    },

    // --- Developer ---
    developer: { label: t("Common/Developer"), clickable: false },
    users: { label: t("Common/Users"), clickable: false },

    // --- Admin ---
    admin: { label: t("Common/Admin"), clickable: false },
    news: { label: t("Common/News"), clickable: false },
    "news-types": { label: t("Navbar/Types"), clickable: false },
  };

  // --- CREATE BREADCRUMBS ---
  const createBreadcrumbs = (path: string): Breadcrumb[] | undefined => {
    if (path === "/") {
      return undefined;
    }

    const parts = path.split("/").filter(Boolean);

    const knownKeys = Object.keys(breadcrumbTranslation);

    const isKnown =
      knownKeys.includes(parts[0]?.toLowerCase()) ||
      (parts[0] === "report" && parts[1] === "units" && parts[2] && parts[3]);

    if (!isKnown) {
      return [
        {
          label: t("Message/Invalid page"),
          href: "/",
          clickable: false,
          isActive: true,
        },
      ];
    }

    // If developer, remove manage. <-- DISABLED!
    // const filteredParts =
    //   parts[0] === "developer" ? parts.filter((p) => p !== "manage") : parts;
    const filteredParts = parts;

    let breadcrumbs: Breadcrumb[] = filteredParts.map((part, index) => {
      const key = part.toLowerCase();
      const translation = breadcrumbTranslation[key];
      const isLast = index === filteredParts.length - 1;

      const isUnitsPath =
        filteredParts[0] === "report" && filteredParts[1] === "units";

      const label =
        isUnitsPath && index === 2 && (unitGroupName || unitGroupId)
          ? (unitGroupName ?? unitGroupId!)
          :
            isUnitsPath && index === 3 && unitName
            ? unitName!
            :
              (translation?.label ??
              part.charAt(0).toUpperCase() + part.slice(1));

      const clickable = isLast
        ? false
        : (translation?.clickable ??
          (isUnitsPath && index === 1));

      const href =
        isUnitsPath && index === 1
          ? "/report/units"
          : "/" + filteredParts.slice(0, index + 1).join("/");

      return { label, href, clickable, isActive: isLast };
    });

    if (
      pathname.includes(`report/unit/`) &&
      unitGroupId &&
      unitGroupName &&
      unitName
    ) {
      const unitIndex = breadcrumbs.findIndex(
        (b: Breadcrumb) => b.label === unitName,
      );
      if (unitIndex !== -1) {
        breadcrumbs.splice(unitIndex, 0, {
          label: unitGroupName,
          href: "#",
          clickable: false,
          isActive: false,
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = createBreadcrumbs(pathname);

  return (
    <>
      <Navbar
        hasScrollbar={hasScrollbar}
        setHasScrollbar={setHasScrollbar}
        navbarHidden={navbarHidden}
        setNavbarHidden={setNavbarHidden}
      />
      <Topbar
        hasScrollbar={hasScrollbar}
        breadcrumbs={breadcrumbs}
        navbarHidden={navbarHidden}
        setNavbarHidden={setNavbarHidden}
      />
      <div className="flex">
        <div
          className={`${hasScrollbar && !navbarHidden ? "md:ml-67" : !hasScrollbar && !navbarHidden ? "md:ml-64" : ""} w-full max-w-[1920px] overflow-hidden p-4 pt-22 duration-[var(--medium)]`}
        >
          {props.children}
        </div>
      </div>
    </>
  );
};

export default LayoutWrapper;
