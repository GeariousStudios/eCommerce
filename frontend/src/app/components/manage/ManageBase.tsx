// "use client";

import {
  createRef,
  ReactNode,
  RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  filterClass,
  filterIconClass,
  getResponsiveClass,
  tdClass,
  thClass,
  viewClass,
} from "./ManageClasses";
import Input from "../common/Input";
import {
  Filter,
  AllFilter,
  FilterChip,
  ThCell,
  TdCell,
} from "./ManageComponents";
import {
  buttonDeleteSecondaryClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
  iconButtonPrimaryClass,
  roundedButtonClass,
} from "@/app/styles/buttonClasses";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import SingleDropdown from "../common/SingleDropdown";
import Message from "../common/Message";
import CustomTooltip from "../common/CustomTooltip";
import {
  AdjustmentsHorizontalIcon,
  InformationCircleIcon,
  PlusIcon as OutlinePlusIcon,
  PencilSquareIcon as OutlinePencilSquareIcon,
  Squares2X2Icon as OutlineSquares2X2Icon,
  TableCellsIcon as OutlineTableCellsIcon,
  TrashIcon as OutlineTrashIcon,
} from "@heroicons/react/24/outline";
import {
  PlusIcon as SolidPlusIcon,
  PencilSquareIcon as SolidPencilSquareIcon,
  Squares2X2Icon as SolidSquares2X2Icon,
  TableCellsIcon as SolidTableCellsIcon,
  TrashIcon as SolidTrashIcon,
} from "@heroicons/react/24/solid";
import SideMenu from "../sideMenu/SideMenu";
import useUserPrefs from "@/app/hooks/useUserPrefs";
import HoverIcon from "../common/HoverIcon";

// --- PROPS ---
export type ManageBaseProps<TItem> = {
  itemName: string;
  items: TItem[];
  selectedItems: number[];
  setSelectedItems: (ids: number[]) => void;
  toggleEditItemModal: (id?: number | null) => void;
  toggleDeleteItemModal: (ids?: number[]) => void;
  isLoading: boolean;
  isConnected: boolean;

  isGrid: boolean;
  setIsGrid: React.Dispatch<React.SetStateAction<boolean>>;
  gridItems: ManageGridItem<TItem>[];
  tableItems: ManageTableItem<TItem>[];
  gridActions?: (item: TItem) => ReactNode;
  tableActions?: (item: TItem) => void;
  showCheckbox?: boolean;
  showInfoButton?: boolean;

  getIsDisabled: (item: TItem) => boolean;

  pagination?: {
    currentPage: number;
    setCurrentPage: (page: number) => void;
    itemsPerPage: number;
    setItemsPerPage: (count: number) => void;
    totalItems: number;
  };

  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;

  emptyState?: ReactNode;
  loadingState?: ReactNode;
  disconnectedState?: ReactNode;

  searchTerm?: string;
  onSearchChange?: (term: string) => void;

  filters?: {
    label: string;
    breakpoint?: string;
    options: {
      label: string;
      isSelected: boolean;
      setSelected: (val: boolean) => void;
      count?: number;
    }[];
  }[];
};

export type ManageTableItem<TItem> = {
  key: string;
  label: string;
  classNameAddition?: string;
  childClassNameAddition?: string;
  sortingItem?: string;
  labelAsc?: string;
  labelDesc?: string;
  getValue: (item: TItem) => ReactNode;
  responsivePriority?: number;
};

export type ManageGridItem<TItem> = {
  key: string;
  label?: string;
  classNameAddition?: string;
  getValue: (item: TItem) => ReactNode;
};

const ManageBase = <TItem extends { id: number }>({
  itemName,
  items,
  selectedItems,
  setSelectedItems,
  toggleEditItemModal,
  toggleDeleteItemModal,
  isLoading,
  isConnected,

  isGrid,
  setIsGrid,
  gridItems,
  tableItems,
  gridActions,
  tableActions,
  showCheckbox,
  showInfoButton,

  getIsDisabled,

  pagination,

  sortBy,
  sortOrder,
  onSort,

  emptyState,
  loadingState,
  disconnectedState,

  searchTerm,
  onSearchChange,

  filters,
}: ManageBaseProps<TItem>) => {
  // --- VARIABLES ---
  // --- States ---
  const [filterAllOpen, setFilterAllOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState(tableItems.length);

  // --- Refs ---
  const smallFilterRefs = useRef<RefObject<HTMLButtonElement | null>[]>([]);
  const bigFilterRefs = useRef<RefObject<HTMLDivElement | null>[]>([]);

  if (filters) {
    while (smallFilterRefs.current.length < filters.length) {
      smallFilterRefs.current.push(createRef<HTMLButtonElement>());
    }

    while (bigFilterRefs.current.length < filters.length) {
      bigFilterRefs.current.push(createRef<HTMLDivElement>());
    }
  }

  // --- UPDATE GRID/TABLE PREFERENCE ---
  const { isLoadingUserPrefs, isGridView, updateIsGridView } = useUserPrefs();
  useEffect(() => {
    if (window.innerWidth < 640) {
      setIsGrid(true);
    } else if (isGridView !== null) {
      setIsGrid(isGridView);
    }
  }, [isLoadingUserPrefs]);

  // --- ITEM SELECTION ---
  const selectableIds = items
    .filter((item) => !getIsDisabled(item))
    .map((item) => item.id);

  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedItems.includes(id));

  const indeterminate =
    !allSelected && selectableIds.some((id) => selectedItems.includes(id));

  const toggleSelect = (itemId: number) => {
    const item = items.find((u) => u.id === itemId);
    if (!item || getIsDisabled(item)) {
      return;
    }

    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter((id) => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const selectAll = () => {
    if (allSelected) {
      setSelectedItems(
        selectedItems.filter((id) => !selectableIds.includes(id)),
      );
    } else {
      setSelectedItems([...new Set([...selectedItems, ...selectableIds])]);
    }
  };

  // --- FILTER CHIPS ---
  const filterChips = useMemo(() => {
    return (
      filters?.flatMap((group) =>
        group.options
          .filter((opt) => opt.isSelected)
          .map((opt) => ({
            label: opt.label,
            onClear: () => opt.setSelected(false),
          })),
      ) ?? []
    );
  }, [filters]);

  // --- CLEAR FILTERS ---
  const clearFilters = () => {
    filters?.forEach((group) =>
      group.options.forEach((opt) => opt.setSelected(false)),
    );
  };

  // --- PAGINATION HELPGER ---
  const getPageNumbers = () => {
    if (!pagination) {
      return;
    }

    const { currentPage, itemsPerPage, totalItems } = pagination;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const pages: (number | string)[] = [];

    // If less than 7 pages, show all.
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Don't show "..." before first page if page is 3 or less.
    if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) {
        pages.push(i);
      }
      pages.push("...");
      pages.push(totalPages);
      // 1. Show "1 ..." if page is at least 2 below total pages.
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push("...");
      // 2. And then show the remaining pages.
      for (let i = totalPages - 3; i <= totalPages; i++) {
        pages.push(i);
      }
      // Show "1 ... X, X, X ... X" if none of the criterias above match.
    } else {
      pages.push(1);
      pages.push("...");

      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i);
      }

      pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  // --- SET COLSPAN ---
  useEffect(() => {
    const getVisibleCols = () => {
      const breakpoints: Record<number, number> = {
        1: 640, // sm:
        2: 768, // md:
        3: 1024, // lg:
        4: 1280, // xl:
        5: 1536, // 2xl:
      };

      const screenWidth = window.innerWidth;

      return tableItems.filter(
        (col) =>
          !col.responsivePriority ||
          screenWidth >= breakpoints[col.responsivePriority],
      ).length;
    };

    const setColSpan = () => {
      setVisibleCols(getVisibleCols());
    };

    setColSpan();
    window.addEventListener("resize", setColSpan);
    return () => window.removeEventListener("resize", setColSpan);
  }, [tableItems]);

  if (isGridView === null || isLoadingUserPrefs) {
    return (
      <>
        <div className="hidden md:block">
          <Message icon="loading" content="Nästan klar..." fullscreen />
        </div>

        <div className="block md:hidden">
          <Message
            icon="loading"
            content="Nästan klar..."
            fullscreen
            withinContainer
          />
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        {/* --- ITEM EDITING --- */}
        <div className="flex flex-wrap gap-4">
          {/* --- Add item --- */}
          <CustomTooltip content={`Lägg till ny ${itemName}`} lgHidden={true}>
            <button
              className={`${buttonPrimaryClass} group lg:w-max lg:px-4`}
              onClick={() => {
                toggleEditItemModal();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleEditItemModal();
                }
              }}
              tabIndex={0}
            >
              <div className="flex items-center justify-center gap-2 truncate">
                <HoverIcon
                  outline={OutlinePlusIcon}
                  solid={SolidPlusIcon}
                  className="h-6 min-h-6 w-6 min-w-6"
                />
                <span className="hidden lg:block">Lägg till ny {itemName}</span>
              </div>
            </button>
          </CustomTooltip>

          {/* --- Edit item --- */}
          <CustomTooltip
            content={
              selectedItems.length === 0
                ? `Välj en ${itemName}`
                : selectedItems.length === 1
                  ? `Redigera ${itemName}`
                  : `Du kan bara redigera en ${itemName} i taget!`
            }
            lgHidden={selectedItems.length === 1}
            showOnTouch={selectedItems.length === 0 || selectedItems.length > 1}
          >
            <button
              className={`${buttonSecondaryClass} group lg:w-auto lg:px-4`}
              onClick={() => {
                toggleEditItemModal(selectedItems[0]);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleEditItemModal(selectedItems[0]);
                }
              }}
              tabIndex={0}
              disabled={selectedItems.length === 0 || selectedItems.length > 1}
            >
              <div className="flex items-center justify-center gap-2 truncate">
                <HoverIcon
                  outline={OutlinePencilSquareIcon}
                  solid={SolidPencilSquareIcon}
                  className="h-6 min-h-6 w-6 min-w-6"
                />
                <span className="hidden lg:block">Redigera {itemName}</span>
              </div>
            </button>
          </CustomTooltip>

          {/* --- Delete item --- */}
          <CustomTooltip
            content={
              selectedItems.length === 0
                ? `Välj en eller fler ${itemName}`
                : `Ta bort användare (${selectedItems.length})`
            }
            lgHidden={selectedItems.length > 0}
            showOnTouch={selectedItems.length === 0}
          >
            <button
              className={`${buttonDeleteSecondaryClass} 3xs:ml-auto group lg:w-auto lg:px-4`}
              onClick={() => toggleDeleteItemModal(selectedItems)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleDeleteItemModal(selectedItems);
                }
              }}
              tabIndex={0}
              disabled={selectedItems.length === 0}
            >
              <div className="flex items-center justify-center gap-2 truncate">
                <HoverIcon
                  outline={OutlineTrashIcon}
                  solid={SolidTrashIcon}
                  className="h-6 min-h-6 w-6 min-w-6"
                />
                <span className="hidden lg:block">
                  Ta bort {itemName}
                  <span>
                    {selectedItems.length > 0
                      ? ` (${selectedItems.length})`
                      : ""}
                  </span>
                </span>
              </div>
            </button>
          </CustomTooltip>
        </div>
      </div>

      <div className="2xs:flex-nowrap 2xs:justify-between flex flex-wrap gap-4">
        {/* --- SEARCH AND FILTER --- */}
        {/* --- Search --- */}
        {onSearchChange && (
          <div className="flex w-full items-center gap-4">
            <div className="flex w-full items-center justify-start">
              <Input
                icon={<MagnifyingGlassIcon />}
                placeholder={`Sök ${itemName}...`}
                value={searchTerm}
                onChange={(val) => onSearchChange(String(val).toLowerCase())}
              />
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-4">
            <CustomTooltip
              content={`${isGrid ? "Växla till tabellvy" : "Växla till kortvy"}`}
              showOnTouch
            >
              <button
                className={`${roundedButtonClass} group gap-2`}
                onClick={() => {
                  setIsGrid(!isGrid);
                  updateIsGridView(!isGrid);
                }}
              >
                <span className="relative flex items-center justify-center">
                  {isGrid ? (
                    <>
                      <OutlineTableCellsIcon
                        className={`${viewClass} absolute opacity-100 transition-opacity duration-[var(--fast)] group-hover:opacity-0`}
                      />
                      <SolidTableCellsIcon
                        className={`${viewClass} absolute opacity-0 transition-opacity duration-[var(--fast)] group-hover:opacity-100`}
                      />
                    </>
                  ) : (
                    <>
                      <OutlineSquares2X2Icon
                        className={`${viewClass} absolute opacity-100 transition-opacity duration-[var(--fast)] group-hover:opacity-0`}
                      />
                      <SolidSquares2X2Icon
                        className={`${viewClass} absolute opacity-0 transition-opacity duration-[var(--fast)] group-hover:opacity-100`}
                      />{" "}
                    </>
                  )}
                </span>
              </button>
            </CustomTooltip>

            {filters &&
              filters.length > 0 &&
              filters.map((group, i) => (
                <Filter
                  key={i}
                  filterRef={smallFilterRefs.current[i]}
                  label={group.label}
                  breakpoint={group.breakpoint ?? ""}
                  filterData={group.options.map((opt) => ({
                    label: opt.label,
                    show: opt.isSelected,
                    setShow: opt.setSelected,
                    count: opt.count,
                  }))}
                />
              ))}
          </div>
        </div>

        {/* --- Filter: All ---  */}
        {filters && filters.length > 0 && (
          <div className="relative">
            <button
              className={`${roundedButtonClass} group xs:w-auto xs:px-4 gap-2`}
              onClick={() => {
                setFilterAllOpen(true);
              }}
            >
              <span className={`${filterClass} xs:flex hidden`}>
                Alla filter
              </span>
              <AdjustmentsHorizontalIcon className={`${filterIconClass}`} />
            </button>

            <SideMenu
              triggerRef={smallFilterRefs.current[0]}
              isOpen={filterAllOpen}
              onClose={() => setFilterAllOpen(false)}
              label="Alla filter"
            >
              <div className="flex h-full flex-col justify-between">
                <div className="flex flex-col">
                  {filters?.map((group, i) => (
                    <AllFilter
                      key={i}
                      filterRef={bigFilterRefs.current[i]}
                      label={group.label}
                      filterData={group.options.map((opt) => ({
                        label: opt.label,
                        show: opt.isSelected,
                        setShow: opt.setSelected,
                        count: opt.count,
                      }))}
                    />
                  ))}
                </div>

                <div className="flex flex-col gap-4 py-4 sm:flex-row">
                  <button
                    onClick={() => setFilterAllOpen(false)}
                    className={`${buttonPrimaryClass} w-full`}
                  >
                    Visa{" "}
                    <span className="font-normal">
                      {pagination?.totalItems ?? 0}
                    </span>
                  </button>
                  <button
                    onClick={() => clearFilters()}
                    className={`${buttonSecondaryClass} w-full`}
                    disabled={
                      !filters?.some((group) =>
                        group.options.some((opt) => opt.isSelected),
                      )
                    }
                  >
                    Rensa alla
                  </button>
                </div>
              </div>
            </SideMenu>
          </div>
        )}
      </div>

      {/* --- Filter chips --- */}
      {filterChips.length > 0 && (
        <div className="flex flex-wrap gap-4">
          <span className="flex items-center font-semibold text-[var(--text-secondary)]">
            Aktiva filter:
          </span>
          {filterChips.map((chip, idx) => (
            <FilterChip
              key={idx}
              onClickEvent={chip.onClear}
              label={chip.label}
            />
          ))}

          <button
            className="group w-auto cursor-pointer rounded-full px-4 transition-colors duration-[var(--fast)] hover:bg-[var(--bg-navbar-link)]"
            onClick={() => clearFilters()}
          >
            <span className="font-semibold text-[var(--accent-color)]">
              Rensa alla
            </span>
          </button>
        </div>
      )}

      {isGrid ? (
        // --- GRID VIEW ---
        <div>
          {!isConnected ? (
            (disconnectedState ?? (
              <div className="flex min-h-72 items-center">
                <Message icon="server" content="server" />
              </div>
            ))
          ) : isLoading ? (
            (loadingState ?? (
              <div className="flex min-h-72 items-center">
                <Message
                  icon="loading"
                  content="Hämtar innehåll..."
                  sideMessage={(items.length ?? 0) <= 2}
                />
              </div>
            ))
          ) : items.length === 0 ? (
            (emptyState ?? (
              <div className="flex min-h-72 items-center">
                <Message
                  icon="search"
                  content="Det finns inget innehåll att visa."
                />
              </div>
            ))
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`${gridItems.length > 1 ? "gap-2" : ""} ${selectedItems.includes(item.id) ? "border-[var(--accent-color)]" : "border-[var(--border-main)]"} ${getIsDisabled(item) ? "!cursor-not-allowed !border-[var(--border-main)]" : ""} flex max-h-[462.5px] cursor-pointer flex-col overflow-auto rounded border-1 p-4 transition-colors duration-[var(--fast)] hover:border-[var(--accent-color)]`}
                  onClick={() => toggleSelect(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleSelect(item.id);
                    }
                  }}
                >
                  {gridItems?.map((i) => {
                    const value = i.getValue(item);
                    if (value === null) {
                      return null;
                    }

                    return (
                      <div key={i.key}>
                        <div className={`${i.classNameAddition ?? ""}`}>
                          {i.label !== null && i.label}
                          {value}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // --- TABLE VIEW ---
        <div className="flex w-full flex-col">
          <div className="flex w-full overflow-x-auto rounded border-1 border-[var(--border-main)]">
            <table className="w-full table-fixed border-collapse">
              <thead
                className={`${!isConnected || isLoading ? "pointer-events-none" : ""} bg-[var(--bg-grid-header)]`}
              >
                <tr>
                  {showCheckbox && (
                    <th
                      className={`${thClass} !w-[40px] !min-w-[40px] !border-l-0 !pl-2`}
                      onClick={selectAll}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          selectAll();
                        }
                      }}
                    >
                      <div className="flex items-center justify-center">
                        <Input
                          type="checkbox"
                          checked={allSelected}
                          indeterminate={indeterminate}
                          readOnly
                        />
                      </div>
                    </th>
                  )}

                  {tableItems.map((item, i) =>
                    item.sortingItem ? (
                      <ThCell
                        key={i}
                        sortingItem={item.sortingItem}
                        label={item.label}
                        labelAsc={item.labelAsc}
                        labelDesc={item.labelDesc}
                        classNameAddition={`${getResponsiveClass(item.responsivePriority)} ${item.classNameAddition ?? ""}`}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={onSort}
                      />
                    ) : (
                      <th
                        key={i}
                        className={`pointer-events-none ${thClass} ${getResponsiveClass(item.responsivePriority)} ${item.classNameAddition ?? ""}`}
                      >
                        {item.label}
                      </th>
                    ),
                  )}

                  {showInfoButton && (
                    <th
                      className={`${thClass} pointer-events-none !w-[40px] !min-w-[40px] !border-r-0 !px-0`}
                    ></th>
                  )}
                </tr>
              </thead>
              <tbody>
                {!isConnected ? (
                  <tr>
                    <td
                      colSpan={
                        visibleCols +
                        (showCheckbox ? 1 : 0) +
                        (showInfoButton ? 1 : 0)
                      }
                      className="h-57"
                    >
                      {disconnectedState ?? (
                        <Message icon="server" content="server" />
                      )}
                    </td>
                  </tr>
                ) : isLoading ? (
                  <tr>
                    <td
                      colSpan={
                        visibleCols +
                        (showCheckbox ? 1 : 0) +
                        (showInfoButton ? 1 : 0)
                      }
                      className="h-57"
                    >
                      {loadingState ?? (
                        <Message
                          icon="loading"
                          content="Hämtar innehåll..."
                          sideMessage={(items.length ?? 0) <= 2}
                        />
                      )}
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        visibleCols +
                        (showCheckbox ? 1 : 0) +
                        (showInfoButton ? 1 : 0)
                      }
                      className="h-57"
                    >
                      {emptyState ?? (
                        <Message
                          icon="search"
                          content="Det finns inget innehåll att visa."
                        />
                      )}
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const isEven = index % 2 === 0;
                    const isSelected = selectedItems.includes(item.id);
                    const isDisabled = getIsDisabled
                      ? getIsDisabled(item)
                      : false;

                    const rowClass = `${
                      isEven
                        ? "bg-[var(--bg-grid)]"
                        : "bg-[var(--bg-grid-zebra)]"
                    } ${isSelected ? "bg-[var--bg-grid-header-hover)]" : ""} ${isDisabled ? "!cursor-not-allowed opacity-33" : "hover:bg-[var(--bg-grid-header-hover)]"} cursor-pointer transition-[background] duration-[var(--fast)]`;

                    return (
                      <tr
                        key={item.id}
                        className={rowClass}
                        onClick={() => !isDisabled && toggleSelect(item.id)}
                        onKeyDown={(e) => {
                          if (
                            !isDisabled &&
                            (e.key === "Enter" || e.key === " ")
                          ) {
                            e.preventDefault();
                            toggleSelect(item.id);
                          }
                        }}
                      >
                        {showCheckbox && (
                          <td
                            className={`${tdClass} !w-[40px] !min-w-[40px] !border-l-0 !pl-4`}
                          >
                            <div className="flex items-center justify-center">
                              <Input
                                type="checkbox"
                                checked={selectedItems.includes(item.id)}
                                readOnly
                              />
                            </div>
                          </td>
                        )}

                        {tableItems.map((i) => (
                          <TdCell
                            key={i.key}
                            classNameAddition={`${getResponsiveClass(i.responsivePriority)}
                            ${i.classNameAddition ?? ""}`}
                            childClassNameAddition={`${i.childClassNameAddition ?? ""}`}
                          >
                            {i.getValue(item)}
                          </TdCell>
                        ))}

                        {showInfoButton && (
                          <td
                            className={`${tdClass} !w-[40px] !min-w-[40px] cursor-pointer !border-r-0 !px-0`}
                            onClick={(e) => {
                              e.stopPropagation();
                              tableActions?.(item);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                tableActions?.(item);
                              }
                            }}
                            tabIndex={0}
                          >
                            <span className="flex h-full w-full items-center justify-center">
                              <InformationCircleIcon className="h-6 min-h-6 w-6 min-w-6" />
                            </span>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination && (
        //    --- PAGINATION ---
        <div className="flex w-full flex-wrap justify-between gap-x-12 gap-y-4">
          {/* --- Showing info --- */}
          <span className="flex w-[175.23px] text-[var(--text-secondary)]">
            Visar{" "}
            {pagination.totalItems === 0
              ? "0-0"
              : `${(pagination.currentPage - 1) * pagination.itemsPerPage + 1}-${Math.min(
                  pagination.currentPage * pagination.itemsPerPage,
                  pagination.totalItems ?? 0,
                )}`}{" "}
            av {pagination.totalItems ?? 0}
          </span>

          {/* --- Change pages --- */}
          <div className="xs:w-auto flex w-full items-center">
            <button
              type="button"
              onClick={() => {
                setSelectedItems([]);
                pagination.setCurrentPage(
                  Math.max(pagination.currentPage - 1, 1),
                );
              }}
              disabled={pagination.currentPage === 1}
              className={`${iconButtonPrimaryClass}`}
            >
              <ChevronLeftIcon className="min-h-full min-w-full" />
            </button>
            <div className="flex flex-wrap items-center justify-center">
              {getPageNumbers() &&
                getPageNumbers()!.map((page, index) =>
                  page === "..." ? (
                    <span key={index} className="flex px-2">
                      ...
                    </span>
                  ) : (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedItems([]);
                        pagination.setCurrentPage(Number(page));
                      }}
                      className={`${pagination.currentPage === page ? "bg-[var(--accent-color)] text-[var(--text-main-reverse)]" : "hover:text-[var(--accent-color)]"} ${pagination.currentPage === page && page >= 100 ? "px-5" : ""} flex max-w-7 min-w-7 cursor-pointer justify-center rounded-full px-1 text-lg transition-colors duration-[var(--fast)]`}
                    >
                      {page}
                    </button>
                  ),
                )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedItems([]);
                const totalPages = Math.ceil(
                  (pagination.totalItems ?? 0) / pagination.itemsPerPage,
                );

                pagination.setCurrentPage(
                  pagination.currentPage < totalPages
                    ? pagination.currentPage + 1
                    : pagination.currentPage,
                );
              }}
              disabled={
                pagination.currentPage >=
                Math.ceil(
                  (pagination.totalItems ?? 0) / pagination.itemsPerPage,
                )
              }
              className={`${iconButtonPrimaryClass}`}
            >
              <ChevronRightIcon className="min-h-full min-w-full" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="">Antal per sida:</span>
            <div className="3xs:min-w-20">
              <div id="portal-root" />
              <SingleDropdown
                options={[
                  { label: "4", value: "4" },
                  { label: "8", value: "8" },
                  { label: "16", value: "16" },
                  { label: "32", value: "32" },
                ]}
                value={String(pagination.itemsPerPage)}
                onChange={(val) => {
                  const newPageSize = Number(val);
                  const newMaxPages = Math.ceil(
                    (pagination.totalItems ?? 0) / newPageSize,
                  );

                  pagination.setItemsPerPage(newPageSize);

                  if (
                    pagination.totalItems > 0 &&
                    pagination.currentPage > newMaxPages
                  ) {
                    pagination.setCurrentPage(newMaxPages);
                  }
                }}
                showAbove
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBase;
