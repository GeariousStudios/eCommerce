"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Navbar from "../components/navbar/Navbar";
import Topbar from "../components/topbar/Topbar";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

type Props = {
  children: ReactNode;
};

type Breadcrumb = {
  label: string;
  href: string;
  clickable: boolean;
  isActive: boolean;
};

const sameCrumbs = (a?: Breadcrumb[], b?: Breadcrumb[]) =>
  JSON.stringify(a) === JSON.stringify(b);

const LayoutWrapper = (props: Props) => {
  const t = useTranslations();

  // --- STATES ---
  const [hasScrollbar, setHasScrollbar] = useState(false);
  const [navbarHidden, setNavbarHidden] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(max-width: 767px)").matches;
    }
    return false;
  });

  const [unitName, setUnitName] = useState<string | null>(null);
  const [unitGroupId, setUnitGroupId] = useState<string | null>(null);
  const [unitGroupName, setUnitGroupName] = useState<string | null>(null);

  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[] | undefined>(
    undefined,
  );
  const [breadcrumbsReady, setBreadcrumbsReady] = useState(false);

  // --- OTHER ---
  const pathname = usePathname();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const parts = pathname.split("/").filter(Boolean);
  const isUnitsPath =
    parts.length >= 3 && parts[0] === "report" && parts[1] === "units";
  const [breadcrumbsLoading, setBreadcrumbsLoading] = useState(false);

  // --- IF UNIT, GET UNIT/GROUP INFO ---
  useEffect(() => {
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
  type CrumbMap = Record<string, { label: string; clickable?: boolean }>;

  const breadcrumbTranslation = useMemo<CrumbMap>(
    () => ({
      // --- General ---
      manage: { label: t("Common/Manage"), clickable: false },
      "audit-trail": { label: t("Navbar/Audit trail"), clickable: false },

      // --- Report ---
      report: { label: t("Navbar/Report"), clickable: false },
      unit: { label: t("Common/Units"), clickable: false },

      // --- Admin ---
      admin: { label: t("Common/Admin"), clickable: false },

      "unit-groups": {
        label: t("Common/Groups"),
        clickable: false,
      },
      units: { label: t("Common/Units"), clickable: false },
      categories: { label: t("Common/Categories"), clickable: false },
      "unit-columns": {
        label: t("Common/Columns"),
        clickable: false,
      },
      "master-plans": {
        label: t("Common/Master plans"),
        clickable: false,
      },

      news: { label: t("Common/News"), clickable: false },
      "news-types": { label: t("Common/News types"), clickable: false },

      shifts: { label: t("Common/Shifts"), clickable: false },
      "shift-teams": { label: t("Common/Shift teams"), clickable: false },

      "planned-stops": { label: t("Common/Planned stops"), clickable: false },
      "stop-types": { label: t("Common/Stop types"), clickable: false },

      // --- Developer ---
      developer: { label: t("Common/Developer"), clickable: false },
      users: { label: t("Common/Users"), clickable: false },
    }),
    [t],
  );

  // --- CREATE BREADCRUMBS ---
  const createBreadcrumbs = (
    path: string,
    names?: {
      unitName?: string | null;
      unitGroupId?: string | null;
      unitGroupName?: string | null;
    },
  ): Breadcrumb[] | undefined => {
    if (path === "/") {
      return undefined;
    }

    const localParts = path.split("/").filter(Boolean);
    const filteredParts = localParts;
    const crumbs: Breadcrumb[] = [];

    const { unitName, unitGroupId, unitGroupName } = names || {};

    const localIsUnitsPath =
      filteredParts[0] === "report" && filteredParts[1] === "units";

    for (let index = 0; index < filteredParts.length; index++) {
      const part = filteredParts[index];
      const key = part.toLowerCase();
      const translation = breadcrumbTranslation[key];
      const isLast = index === filteredParts.length - 1;

      // --- Special cases ---
      const isUnitsSpecialKnown =
        (localIsUnitsPath && index === 2 && (unitGroupName || unitGroupId)) ||
        (isUnitsPath && index === 3 && unitName);

      // --- Don't continue if invalid segment ---
      if (!translation && !isUnitsSpecialKnown) {
        break;
      }

      const label =
        localIsUnitsPath && index === 2 && (unitGroupName || unitGroupId)
          ? (unitGroupName ?? unitGroupId!)
          : localIsUnitsPath && index === 3 && unitName
            ? unitName!
            : (translation?.label ??
              part.charAt(0).toUpperCase() + part.slice(1));

      const clickable = isLast
        ? false
        : (translation?.clickable ?? (localIsUnitsPath && index === 1));

      const href =
        localIsUnitsPath && index === 1
          ? "/report/units"
          : "/" + filteredParts.slice(0, index + 1).join("/");

      crumbs.push({ label, href, clickable, isActive: isLast });
    }

    // --- Invalid page if invalid href ---
    if (crumbs.length < filteredParts.length) {
      return [
        {
          label: t("Message/Invalid"),
          href: "/",
          clickable: false,
          isActive: true,
        },
      ];
    }

    return crumbs.length === 0 ? undefined : crumbs;
  };

  useEffect(() => {
    let isMounted = true;
    setBreadcrumbsReady(false);

    const localParts = pathname.split("/").filter(Boolean);
    const localIsUnitsPath =
      localParts.length >= 3 &&
      localParts[0] === "report" &&
      localParts[1] === "units";

    if (!localIsUnitsPath) {
      const next = createBreadcrumbs(pathname, {
        unitName,
        unitGroupId,
        unitGroupName,
      });

      if (isMounted) {
        setBreadcrumbs(next);
        setBreadcrumbsReady(true);
      }
      return () => {
        isMounted = false;
      };
    }

    const groupId = localParts[2];
    const unitId = localParts[3];

    const fetchGroup = groupId
      ? fetch(`${apiUrl}/unit-group/fetch/${groupId}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      : Promise.resolve(null);

    const fetchUnit = unitId
      ? fetch(`${apiUrl}/unit/fetch/${unitId}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      : Promise.resolve(null);

    Promise.all([fetchGroup, fetchUnit]).then(([group, unit]) => {
      if (!isMounted) {
        return;
      }

      const names = {
        unitName: unit?.name ?? null,
        unitGroupId: groupId ?? null,
        unitGroupName: group?.name ?? null,
      };

      const next = createBreadcrumbs(pathname, names);

      if (!sameCrumbs(breadcrumbs, next)) {
        setBreadcrumbs(next);
      }
      setBreadcrumbsReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, [pathname, apiUrl, t, unitName, unitGroupId, unitGroupName]);

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
        breadcrumbsLoading={breadcrumbsLoading}
      />
      <div className="flex">
        <div
          className={`${hasScrollbar && !navbarHidden ? "md:ml-67" : !hasScrollbar && !navbarHidden ? "md:ml-64" : ""} w-full overflow-hidden p-4 pt-22 duration-[var(--medium)]`}
        >
          {props.children}
        </div>
      </div>
    </>
  );
};

export default LayoutWrapper;
