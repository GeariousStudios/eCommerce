"use client";

import { ReactNode, useEffect, useState } from "react";
import Navbar from "../components/navbar/Navbar";
import Topbar from "../components/topbar/Topbar";
import { usePathname } from "next/navigation";

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

  // --- IF UNIT, GET UNIT INFO ---
  useEffect(() => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length >= 3 && parts[0] === "report" && parts[1] === "unit") {
      const unitId = parts[2];

      fetch(`${apiUrl}/unit/fetch/${unitId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.name) {
            setUnitName(data.name);
          }

          if (data?.unitGroupId) {
            setUnitGroupId(String(data.unitGroupId));

            fetch(`${apiUrl}/unit-group/fetch/${data.unitGroupId}`)
              .then((res) => res.json())
              .then((groupData) => {
                if (groupData?.name) {
                  setUnitGroupName(groupData.name);
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
    manage: { label: "Administrera", clickable: false },

    // --- Report ---
    report: { label: "Rapportering", clickable: false },
    categories: { label: "Kategorier", clickable: false },
    units: { label: "Enheter", clickable: false },
    unit: { label: "Enheter", clickable: false },
    "unit-groups": {
      label: "Grupper",
      clickable: false,
    },
    "unit-columns": {
      label: "Kolumner",
      clickable: false,
    },

    // --- Developer ---
    developer: { label: "Utvecklare", clickable: false },
    users: { label: "Hantera användare", clickable: false },

    // --- Admin ---
    admin: { label: "Admin", clickable: false },
    "news-types": { label: "Nyhetstyper", clickable: false },
  };

  // --- CREATE BREADCRUMBS ---
  const createBreadcrumbs = (path: string): Breadcrumb[] | undefined => {
    if (path === "/") {
      return undefined;
    }

    const parts = path.split("/").filter(Boolean);

    // If developer, remove manage.
    const filteredParts =
      parts[0] === "developer" ? parts.filter((p) => p !== "manage") : parts;

    let breadcrumbs: Breadcrumb[] = filteredParts.map((part, index) => {
      const key = part.toLowerCase();
      const translation = breadcrumbTranslation[key];
      const isLast = index === filteredParts.length - 1;

      return {
        label:
          translation?.label ??
          (key === filteredParts[2] && filteredParts[1] === "unit" && unitName
            ? unitName
            : part.charAt(0).toUpperCase() + part.slice(1)),
        href: "/" + filteredParts.slice(0, index + 1).join("/"),
        clickable: isLast ? false : (translation?.clickable ?? false),
        isActive: isLast,
      };
    });

    if (
      pathname.includes("/report/unit/") &&
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
