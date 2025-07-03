"use client";

import { ReactNode, useEffect, useState } from "react";
import Navbar from "../navbar/Navbar";
import Topbar from "../topbar/Topbar";
import { usePathname } from "next/navigation";

type Props = {
  children: ReactNode;
};

const LayoutWrapper = (props: Props) => {
  // --- STATES ---
  const [hasScrollbar, setHasScrollbar] = useState(false);
  const [unitName, setUnitName] = useState<string | null>(null);

  // --- OTHER ---
  const pathname = usePathname();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // --- IF UNIT, GET UNIT NAME ---
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
        })
        .catch(() => {});
    } else {
      setUnitName(null);
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
    unitgroups: {
      label: "Enhetsgrupper",
      clickable: false,
    },

    // --- Developer ---
    developer: { label: "Utvecklare", clickable: false },
    users: { label: "Hantera användare", clickable: false },

    // --- Admin ---
    admin: { label: "Admin", clickable: false },
    newstypes: { label: "Nyhetstyper", clickable: false },
  };

  // --- CREATE BREADCRUMBS ---
  const createBreadcrumbs = (path: string) => {
    if (path === "/") {
      return undefined;
    }

    const parts = path.split("/").filter(Boolean);

    // If developer, remove manage.
    const filteredParts =
      parts[0] === "developer" ? parts.filter((p) => p !== "manage") : parts;

    return filteredParts.map((part, index) => {
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
  };

  const breadcrumbs = createBreadcrumbs(pathname);

  return (
    <>
      <Navbar hasScrollbar={hasScrollbar} setHasScrollbar={setHasScrollbar} />
      <Topbar hasScrollbar={hasScrollbar} breadcrumbs={breadcrumbs} />
      <div className="flex">
        <div
          className={`${hasScrollbar ? "ml-22 md:ml-67" : "ml-19 md:ml-64"} w-full max-w-[1920px] overflow-x-hidden p-4 pt-22 duration-[var(--medium)]`}
        >
          {props.children}
        </div>
      </div>
    </>
  );
};

export default LayoutWrapper;
