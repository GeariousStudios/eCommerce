import { roundedButtonClass } from "@/app/styles/buttonClasses";
import { ReactNode, RefObject, useEffect, useState } from "react";
import {
  filterClass,
  filterIconClass,
  tdClass,
  thClass,
} from "./ManageClasses";
import {
  ChevronDownIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import MenuDropdown from "../common/MenuDropdown/MenuDropdown";
import Input from "../common/Input";
import CustomTooltip from "../common/CustomTooltip";
import { useTranslations } from "next-intl";

// --- PROPS ---
type FilterData = {
  label: string;
  show: boolean;
  setShow: (value: boolean) => void;
  count?: number;
};

// --- COMPONENTS ---
// --- Filter ---
export const Filter = ({
  filterRef,
  label,
  breakpoint,
  filterData,
}: {
  filterRef: RefObject<HTMLButtonElement | null>;
  label: string;
  breakpoint: string;
  filterData: FilterData[];
}) => {
  const [filterOpen, setFilterOpen] = useState(false);

  let divClassName = "relative hidden ";

  if (breakpoint === "2xs") {
    divClassName += "2xs:flex";
  } else if (breakpoint === "xs") {
    divClassName += "xs:flex";
  } else if (breakpoint === "sm") {
    divClassName += "sm:flex";
  } else if (breakpoint === "md") {
    divClassName += "md:flex";
  } else if (breakpoint === "ml") {
    divClassName += "ml:flex";
  } else if (breakpoint === "lg") {
    divClassName += "lg:flex";
  } else if (breakpoint === "xl") {
    divClassName += "xl:flex";
  } else if (breakpoint === "2xl") {
    divClassName += "2xl:flex";
  }

  return (
    <div className={divClassName}>
      <button
        ref={filterRef}
        className={`${roundedButtonClass} group w-auto gap-2 px-4`}
        onClick={() => {
          setFilterOpen((prev) => !prev);
        }}
        aria-haspopup="menu"
        aria-expanded={filterOpen}
      >
        <span
          className={`${filterClass} ${filterOpen ? "text-(--accent-color)" : ""}`}
        >
          {label}
        </span>
        <ChevronDownIcon
          className={`${filterIconClass} ${filterOpen ? "-rotate-180 text-(--accent-color)" : ""}`}
        />
      </button>

      <MenuDropdown
        triggerRef={filterRef}
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
      >
        <div className="flex w-full flex-col gap-4">
          {filterData.map((item, index) => (
            <div
              key={index}
              onClick={() => item.setShow(!item.show)}
              className="group flex cursor-pointer items-center justify-between gap-4"
            >
              <div className="break-all">
                <Input
                  type="checkbox"
                  checked={item.show}
                  label={item.label}
                  readOnly
                />
              </div>
              <span>({item.count ?? 0})</span>
            </div>
          ))}
        </div>
      </MenuDropdown>
    </div>
  );
};

// --- AllFlter ---
export const AllFilter = ({
  filterRef,
  label,
  filterData,
}: {
  filterRef: RefObject<HTMLDivElement | null>;
  label: string;
  filterData: FilterData[];
}) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterHeight, setFilterHeight] = useState("0px");

  useEffect(() => {
    if (filterRef.current) {
      setFilterHeight(
        filterOpen ? `${filterRef.current.scrollHeight}px` : "0px",
      );
    }
  }, [filterOpen]);

  return (
    <div>
      <button
        onClick={() => setFilterOpen((prev) => !prev)}
        className={`${filterOpen ? "text-(--accent-color)" : ""} flex w-full cursor-pointer items-center justify-between py-4 duration-(--fast) hover:text-(--accent-color)`}
      >
        <span className="text-lg font-semibold">{label}</span>
        <ChevronDownIcon
          className={`${filterOpen ? "-rotate-180" : ""} transition-rotate h-6 w-6 duration-(--fast)`}
        />
      </button>

      <div
        style={{ height: filterHeight }}
        className="overflow-hidden transition-[height] duration-(--slow)"
      >
        <div ref={filterRef}>
          <div className="flex w-full flex-col">
            {filterData.map((item, index) => (
              <div
                key={index}
                onClick={() => item.setShow(!item.show)}
                className={`${index === filterData.length - 1 ? "mb-4" : ""} group flex cursor-pointer items-center justify-between gap-4 py-4`}
              >
                <div className="break-all">
                  <Input
                    type="checkbox"
                    checked={item.show}
                    label={item.label}
                    readOnly
                  />
                </div>
                <span>({item.count ?? 0})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <hr className="-ml-4 flex w-[calc(100%+2rem)] text-(--border-main)" />
    </div>
  );
};

// --- FilterChip ---
export const FilterChip = ({
  onClickEvent,
  label,
}: {
  onClickEvent: (value: boolean) => void;
  label: string;
}) => {
  return (
    <>
      <button
        className={`${roundedButtonClass} group w-auto gap-2 px-4`}
        onClick={() => {
          onClickEvent(false);
        }}
      >
        <span className={`${filterClass}`}>{label}</span>
        <XMarkIcon className={`${filterIconClass}`} />
      </button>
    </>
  );
};

// --- ThCell ---
export const ThCell = ({
  sortingItem,
  label,
  labelAsc,
  labelDesc,
  sortBy,
  sortOrder,
  onSort,
  classNameAddition,
  sortable = true,
}: {
  sortingItem?: string;
  label: string;
  labelAsc?: string;
  labelDesc?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (field: string) => void;
  classNameAddition?: string;
  sortable?: boolean;
}) => {
  const t = useTranslations();

  const baseClass =
    "pl-4 p-2 min-w-48 h-[40px] border border-t-0 border-(--border-secondary) border-b-(--border-main) text-left transition-[background] duration-(--fast)";

  const hoverClass = sortable
    ? "cursor-pointer hover:bg-(--bg-grid-header-hover)"
    : "cursor-default";

  if (!sortable) {
    return (
      <th className={`${baseClass} ${hoverClass} ${classNameAddition ?? ""}`}>
        <div className="flex gap-2">
          <span className="w-full truncate overflow-hidden text-ellipsis">
            {label}
          </span>
        </div>
      </th>
    );
  }

  const getSortIcon = (field: string) => {
    if (!sortBy || sortBy !== field)
      return <ChevronUpDownIcon className="h-6 w-6" />;
    return sortOrder === "asc" ? (
      <ChevronUpIcon className="h-6 w-6" />
    ) : (
      <ChevronDownIcon className="h-6 w-6" />
    );
  };

  return (
    <CustomTooltip
      content={
        sortBy === sortingItem
          ? sortOrder === "asc"
            ? t("Manage/Sort") + (labelAsc ?? "")
            : t("Manage/Sort") + (labelDesc ?? "")
          : t("Manage/Sort") + (labelDesc ?? "")
      }
      longDelay
      showOnTouch
    >
      <th
        className={`${baseClass} ${hoverClass} ${classNameAddition ?? ""}`}
        onClick={() => {
          if (sortingItem && onSort) onSort(sortingItem);
        }}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && sortingItem && onSort) {
            e.preventDefault();
            onSort(sortingItem);
          }
        }}
        tabIndex={0}
        aria-sort={
          sortBy === sortingItem
            ? sortOrder === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
      >
        <div className="flex gap-2">
          <span className="w-full truncate overflow-hidden text-ellipsis">
            {label}
          </span>
          <span className="flex">{getSortIcon(sortingItem ?? "")}</span>
        </div>
      </th>
    </CustomTooltip>
  );
};

// --- TdCell ---
export const TdCell = ({
  children,
  classNameAddition,
  childClassNameAddition,
}: {
  children: ReactNode;
  classNameAddition?: string;
  childClassNameAddition?: string;
}) => {
  return (
    <td className={`${tdClass} ${classNameAddition ? classNameAddition : ""}`}>
      <div
        className={`${childClassNameAddition ? childClassNameAddition : ""} flex truncate overflow-hidden text-ellipsis`}
      >
        {children}
      </div>
    </td>
  );
};
