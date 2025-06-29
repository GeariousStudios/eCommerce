"use client";

import { ReactNode, RefObject, useEffect, useRef, useState } from "react";
import Input from "../../../components/input/Input";
import DeleteModal from "../../../components/modals/DeleteModal";
import { useToast } from "../../../components/toast/ToastProvider";
import CustomTooltip from "../../../components/customTooltip/CustomTooltip";
import {
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";

import {
  TrashIcon,
  PlusIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import {
  buttonDeleteSecondaryClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
  iconButtonPrimaryClass,
  roundedButtonClass,
} from "../../../styles/buttonClasses";
import Message from "../../../components/message/Message";
import SingleDropdown from "../../../components/dropdowns/SingleDropdown";
import CategoryModal from "../../../components/modals/CategoryModal";
import MenuDropdown from "../../../components/dropdowns/MenuDropdown";
import SideMenu from "../../../components/sideMenu/SideMenu";

// --- CLASSES ---
let thClass =
  "pl-4 p-2 min-w-48 h-[40px] cursor-pointer border-1 border-t-0 border-[var(--border-secondary)] border-b-[var(--border-main)] text-left transition-[background] duration-[var(--fast)] hover:bg-[var(--bg-grid-header-hover)]";

let tdClass =
  "py-2 px-4 min-w-48 h-[40px] border-1 border-b-0 border-[var(--border-secondary)] text-left break-all";

let filterClass =
  "truncate font-semibold transition-colors duration-[var(--fast)] group-hover:text-[var(--accent-color)]";

let filterIconClass =
  "h-6 w-6 transition-[color,rotate] duration-[var(--fast)] group-hover:text-[var(--accent-color)]";

// --- COMPONENTS ---
// --- Filter ---
const Filter = ({
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
      >
        <span
          className={`${filterClass} ${filterOpen ? "text-[var(--accent-color)]" : ""}`}
        >
          {label}
        </span>
        <ChevronDownIcon
          className={`${filterIconClass} ${filterOpen ? "rotate-180 text-[var(--accent-color)]" : ""}`}
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
              className="group flex cursor-pointer justify-between"
            >
              <Input
                type="checkbox"
                checked={item.show}
                label={item.label}
                readOnly
              />
              <span>({item.count ?? 0})</span>
            </div>
          ))}
        </div>
      </MenuDropdown>
    </div>
  );
};

// --- AllFilter ---
const AllFilter = ({
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
        className={`${filterOpen ? "text-[var(--accent-color)]" : ""} flex w-full cursor-pointer items-center justify-between py-4 duration-[var(--fast)] hover:text-[var(--accent-color)]`}
      >
        <span className="text-lg font-semibold">{label}</span>
        <ChevronDownIcon
          className={`${filterOpen ? "rotate-180" : ""} transition-rotate h-6 w-6 duration-[var(--fast)]`}
        />
      </button>

      <div
        style={{ height: filterHeight }}
        className="overflow-hidden transition-[height] duration-[var(--slow)]"
      >
        <div ref={filterRef}>
          <div className="flex w-full flex-col">
            {filterData.map((item, index) => (
              <div
                key={index}
                onClick={() => item.setShow(!item.show)}
                className={`${index === filterData.length - 1 ? "mb-4" : ""} group flex cursor-pointer justify-between py-4`}
              >
                <Input
                  type="checkbox"
                  checked={item.show}
                  label={item.label}
                  readOnly
                />
                <span>({item.count ?? 0})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <hr className="-ml-4 flex w-[calc(100%+2rem)] text-[var(--border-main)]" />
    </div>
  );
};

// --- PROPS ---
// --- Outside CategoriesClient ---
type FilterData = {
  label: string;
  show: boolean;
  setShow: (value: boolean) => void;
  count?: number;
};

// --- Inside CategoriesClient ---
type Item = {
  id: number;
  name: string;
  subCategories: string[];
  units: string[];

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

type Props = {
  isConnected: boolean | null;
};

type UnitOptions = {
  id: number;
  name: string;
};

const CategoriesClient = (props: Props) => {
  // --- VARIABLES ---
  const [colSpan, setColSpan] = useState(2);

  // --- States: Backend ---
  const [isLoadingContent, setIsLoadingItems] = useState(false);
  const [totalCounts, setTotalCounts] = useState<{
    unitCounts: Record<string, number>;
    withSubCategories?: number;
    withoutSubCategories?: number;
  } | null>(null);

  // --- States: Edit/Delete ---
  const [items, setItems] = useState<Item[]>([]);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);

  const [deletingItemIds, setDeletingItemIds] = useState<number[]>([]);
  const [isDeleteModalOpen, setIsDeleteItemModalOpen] = useState(false);

  // --- States: Pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setitemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState<number | null>(null);

  // --- States: Sort ---
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // --- States: Filter/Search ---
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedUnitIds, setSelectedUnitIds] = useState<number[]>([]);
  const [hasSubCategories, setHasSubCategories] = useState<boolean | null>(
    null,
  );

  const [units, setUnits] = useState<UnitOptions[]>([]);

  // --- Other ---
  const token = localStorage.getItem("token");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { notify } = useToast();
  const lastItemIndex = currentPage * itemsPerPage;
  const firstItemIndex = lastItemIndex - itemsPerPage;
  const visibleRowCount = Math.max(
    0,
    Math.min(itemsPerPage, (totalItems ?? 0) - firstItemIndex),
  );
  const rowCount = Math.max(0, Math.min(itemsPerPage, visibleRowCount));
  const totalPages = Math.max(1, Math.ceil((totalItems ?? 0) / itemsPerPage));

  // --- SMALL FILTER ---
  // --- Variables ---
  const filterOneRef = useRef<HTMLButtonElement>(null);
  const filterTwoRef = useRef<HTMLButtonElement>(null);
  const filterAllRef = useRef<HTMLButtonElement>(null);

  // --- BIG FILTER ---
  // --- Variables ---
  const allFilterOneRef = useRef<HTMLDivElement>(null);
  const allFilterTwoRef = useRef<HTMLDivElement>(null);

  const [filterAllOpen, setFilterAllOpen] = useState(false);

  // --- PAGINATION HELPGER ---
  const getPageNumbers = () => {
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

  // --- BACKEND ---
  // --- Fetch items ---
  const fetchItems = async (
    page: number,
    pageSize: number,
    sortByField: string,
    sortOrderField: "asc" | "desc",
    showLoading = true,
  ) => {
    try {
      if (showLoading) {
        setIsLoadingItems(true);
      }

      // --- Pagination, filter & sort parameters ---
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortBy: sortByField,
        sortOrder: sortOrderField,
        search: searchTerm,
      });

      if (selectedUnitIds.length > 0) {
        selectedUnitIds.forEach((id) => {
          params.append("units", id.toString());
        });
      }

      if (hasSubCategories !== null) {
        params.append("hasSubCategories", String(hasSubCategories));
      }

      // --- Data ---
      const response = await fetch(`${apiUrl}/category?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // --- Fail ---
      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        notify("error", result.message);
        return;
      }

      // --- Success ---
      setItems(Array.isArray(result.items) ? result.items : []);
      setTotalItems(result.totalCount ?? 0);
      setTotalCounts(result.counts ?? null);
    } catch (err) {
    } finally {
      if (showLoading) {
        setIsLoadingItems(false);
      }
    }
  };

  // --- Delete item(s)
  const finishDeleteItem = async (id: number) => {
    try {
      // --- Delete data ---
      const response = await fetch(`${apiUrl}/category/delete/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // --- Fail ---
      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        notify("error", result.message);
        return;
      }

      // --- Success ---
      await fetchItems(currentPage, itemsPerPage, sortBy, sortOrder);
      notify("success", "Kategori borttagen!", 4000);
    } catch (err) {
      notify("error", String(err));
    }
  };

  // --- Fetch units ---
  const fetchUnits = async () => {
    try {
      const response = await fetch(`${apiUrl}/unit`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        notify("error", result.message);
      } else {
        setUnits(result.items);
      }
    } catch (err) {
      notify("error", String(err));
    }
  };

  // --- FETCH UNITS INITIALIZATION ---
  useEffect(() => {
    fetchUnits();
  }, []);

  // --- FETCH FREQUENCY ---
  useEffect(() => {
    fetchItems(currentPage, itemsPerPage, sortBy, sortOrder);
  }, [
    currentPage,
    itemsPerPage,
    sortBy,
    sortOrder,
    searchTerm,
    selectedUnitIds,
    hasSubCategories,
  ]);

  // --- When filter, go to page 1 ---
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, hasSubCategories, selectedUnitIds]);

  // --- SORTING ---
  const handleSort = (field: string) => {
    const isSameField = field === sortBy;
    const newSortOrder = isSameField && sortOrder === "asc" ? "desc" : "asc";

    setSortBy(field);
    setSortOrder(newSortOrder);
    fetchItems(currentPage, itemsPerPage, field, newSortOrder, false);
  };

  // --- Icon swapper ---
  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ChevronUpDownIcon className="h-6 w-6" />;
    }
    return sortOrder === "asc" ? (
      <ChevronUpIcon className="h-6 w-6" />
    ) : (
      <ChevronDownIcon className="h-6 w-6" />
    );
  };

  // --- ITEM SELECTION ---
  const visibleContentIds = items.map((item) => item.id);

  const selectableIds = items.map((item) => item.id);

  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedItems.includes(id));

  const selectCategory = (itemId: number) => {
    const item = items.find((u) => u.id === itemId);
    if (!item) {
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

  // --- SET COLSPAN ---
  useEffect(() => {
    const updateColSpan = () => {
      const width = window.innerWidth;

      let span = 2;
      if (width >= 512) {
        span += 1;
      }
      if (width >= 1024) {
        span += 1;
      }

      setColSpan(span);
    };

    updateColSpan();
    window.addEventListener("resize", updateColSpan);
    return () => removeEventListener("resize", updateColSpan);
  }, []);

  // --- TOGGLE MODAL(S) ---
  // --- Delete ---
  const toggleDeleteItemModal = (itemIds: number[] = []) => {
    setDeletingItemIds(itemIds);
    setIsDeleteItemModalOpen((prev) => !prev);
  };

  // --- Edit ---
  const openItemEditModal = (itemId: number | null = null) => {
    setEditingItemId(itemId);
    setIsEditItemModalOpen(true);
  };

  const closeItemEditModal = () => {
    setIsEditItemModalOpen(false);
    setEditingItemId(null);
  };

  // --- COMPONENTS ---
  // --- FilterChip ---
  const FilterChip = ({
    visible,
    onClickEvent,
    label,
  }: {
    visible: boolean;
    onClickEvent: (value: boolean) => void;
    label: string;
  }) => {
    return (
      <>
        {visible && (
          <button
            className={`${roundedButtonClass} group w-auto gap-2 px-4`}
            onClick={() => {
              onClickEvent(false);
            }}
          >
            <span className={`${filterClass}`}>{label}</span>
            <XMarkIcon className={`${filterIconClass}`} />
          </button>
        )}
      </>
    );
  };

  // --- ThCell ---
  const ThCell = ({
    sortingItem,
    label,
    labelAsc,
    labelDesc,
    classNameAddition,
  }: {
    sortingItem: string;
    label: string;
    labelAsc: string;
    labelDesc: string;
    classNameAddition?: string;
  }) => {
    return (
      <CustomTooltip
        content={
          sortBy === sortingItem
            ? sortOrder === "asc"
              ? "Sortera " + labelAsc
              : "Sortera " + labelDesc
            : "Sortera " + labelDesc
        }
      >
        <th
          className={`${thClass} ${classNameAddition ? classNameAddition : ""}`}
          onClick={() => handleSort(sortingItem)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleSort(sortingItem);
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
          <div className="relative flex gap-2">
            <span className="w-full truncate overflow-hidden text-ellipsis">
              {label}
            </span>
            <span className="flex">{getSortIcon(sortingItem)}</span>
          </div>
        </th>
      </CustomTooltip>
    );
  };

  // --- TdCell ---
  const TdCell = ({
    children,
    classNameAddition,
  }: {
    children: ReactNode;
    classNameAddition?: string;
  }) => {
    return (
      <td
        className={`${tdClass} ${classNameAddition ? classNameAddition : ""}`}
      >
        <div className="truncate overflow-hidden text-ellipsis">{children}</div>
      </td>
    );
  };

  return (
    <>
      {/* --- MODALS --- */}
      <CategoryModal
        isOpen={isEditItemModalOpen}
        onClose={closeItemEditModal}
        categoryId={editingItemId}
        onCategoryUpdated={() => {
          fetchItems(currentPage, itemsPerPage, sortBy, sortOrder);
        }}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          toggleDeleteItemModal();
          setDeletingItemIds([]);
        }}
        onConfirm={async () => {
          for (const id of deletingItemIds) {
            await finishDeleteItem(id);
          }

          setIsDeleteItemModalOpen(false);
          setDeletingItemIds([]);
          setSelectedItems([]);
        }}
      />

      {/* --- MAIN --- */}
      <div className="flex flex-col gap-4">
        {/* --- TOP --- */}
        <div className="flex flex-col gap-4">
          {/* --- ITEM EDITING --- */}
          <div className="flex flex-wrap gap-4">
            {/* --- Add item --- */}
            <CustomTooltip content="Lägg till ny kategori" lgHidden={true}>
              <button
                className={`${buttonPrimaryClass} lg:w-auto lg:px-4`}
                onClick={() => {
                  openItemEditModal();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openItemEditModal();
                  }
                }}
                tabIndex={0}
              >
                <div className="flex items-center justify-center gap-2 truncate">
                  <PlusIcon className="h-6" />
                  <span className="hidden lg:block">Lägg till ny kategori</span>
                </div>
              </button>
            </CustomTooltip>

            {/* --- Edit item --- */}
            <CustomTooltip
              content={
                selectedItems.length === 0
                  ? "Välj en kategori"
                  : selectedItems.length === 1
                    ? "Redigera kategori"
                    : "Du kan bara redigera en kategori i taget!"
              }
              lgHidden={selectedItems.length === 1}
              showOnTouch={
                selectedItems.length === 0 || selectedItems.length > 1
              }
            >
              <button
                className={`${buttonSecondaryClass} lg:w-auto lg:px-4`}
                onClick={() => {
                  openItemEditModal(selectedItems[0]);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openItemEditModal(selectedItems[0]);
                  }
                }}
                tabIndex={0}
                disabled={
                  selectedItems.length === 0 || selectedItems.length > 1
                }
              >
                <div className="flex items-center justify-center gap-2 truncate">
                  <PencilSquareIcon className="h-6 min-h-6 w-6 min-w-6" />
                  <span className="hidden lg:block">Redigera kategori</span>
                </div>
              </button>
            </CustomTooltip>

            {/* --- Delete item --- */}
            <CustomTooltip
              content={
                selectedItems.length === 0
                  ? "Välj en eller fler kategorier"
                  : `Ta bort kategori (${selectedItems.length})`
              }
              lgHidden={selectedItems.length > 0}
              showOnTouch={selectedItems.length === 0}
            >
              <button
                className={`${buttonDeleteSecondaryClass} 3xs:ml-auto lg:w-auto lg:px-4`}
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
                  <TrashIcon className="h-6" />
                  <span className="hidden lg:block">
                    Ta bort kategori
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

          {/* --- SEARCH AND FILTER --- */}
          <div className="3xs:flex-nowrap flex flex-wrap justify-between gap-4">
            {/* --- Search --- */}
            <div className="flex w-full items-center gap-4">
              <div className="flex w-full items-center justify-start">
                <Input
                  icon={<MagnifyingGlassIcon />}
                  placeholder="Sök kategori"
                  value={searchTerm}
                  onChange={(val) => setSearchTerm(String(val).toLowerCase())}
                />
              </div>
            </div>

            {/* --- Filters --- */}
            <div className="flex gap-4">
              {/* --- Filter: One --- */}
              <Filter
                filterRef={filterOneRef}
                label="Underkategorier"
                breakpoint="md"
                filterData={[
                  {
                    label: "Har underkategorier",
                    show: hasSubCategories === true,
                    setShow: (val) => setHasSubCategories(val ? true : null),
                    count: totalCounts?.withSubCategories ?? 0,
                  },
                  {
                    label: "Inga underkategorier",
                    show: hasSubCategories === false,
                    setShow: (val) => setHasSubCategories(val ? false : null),
                    count: totalCounts?.withoutSubCategories ?? 0,
                  },
                ]}
              />

              {/* --- Filter: Two --- */}
              <Filter
                filterRef={filterTwoRef}
                label="Enheter med åtkomst"
                breakpoint="lg"
                filterData={units.map((unit) => ({
                  label: unit.name,
                  show: selectedUnitIds.includes(unit.id),
                  setShow: (val) => {
                    setSelectedUnitIds((prev) =>
                      val
                        ? [...prev, unit.id]
                        : prev.filter((u) => u !== unit.id),
                    );
                  },
                  count: totalCounts?.unitCounts?.[unit.name] ?? 0,
                }))}
              />

              {/* --- Filter: All --- */}
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
                  triggerRef={filterAllRef}
                  isOpen={filterAllOpen}
                  onClose={() => setFilterAllOpen(false)}
                  label="Alla filter"
                >
                  <div className="flex h-full flex-col justify-between">
                    <div className="flex flex-col">
                      {/* --- All filter: One --- */}
                      <AllFilter
                        filterRef={allFilterOneRef}
                        label="Underkategorier"
                        filterData={[
                          {
                            label: "Har underkategorier",
                            show: hasSubCategories === true,
                            setShow: (val) =>
                              setHasSubCategories(val ? true : null),
                            count: totalCounts?.withSubCategories ?? 0,
                          },
                          {
                            label: "Inga underkategorier",
                            show: hasSubCategories === false,
                            setShow: (val) =>
                              setHasSubCategories(val ? false : null),
                            count: totalCounts?.withoutSubCategories ?? 0,
                          },
                        ]}
                      />

                      <AllFilter
                        filterRef={allFilterTwoRef}
                        label="Enheter med åtkomst"
                        filterData={units.map((unit) => ({
                          label: unit.name,
                          show: selectedUnitIds.includes(unit.id),
                          setShow: (val) => {
                            setSelectedUnitIds((prev) =>
                              val
                                ? [...prev, unit.id]
                                : prev.filter((u) => u !== unit.id),
                            );
                          },
                          count: totalCounts?.unitCounts?.[unit.name] ?? 0,
                        }))}
                      />
                    </div>

                    <div className="flex flex-col gap-4 py-4 sm:flex-row">
                      <button
                        onClick={() => setFilterAllOpen(false)}
                        className={`${buttonPrimaryClass} w-full`}
                      >
                        Visa{" "}
                        <span className="font-normal">{totalItems ?? 0}</span>
                      </button>
                      <button
                        onClick={() => {
                          setHasSubCategories(null);
                          setSelectedUnitIds([]);
                        }}
                        className={`${buttonSecondaryClass} w-full`}
                        disabled={
                          hasSubCategories === null &&
                          selectedUnitIds.length === 0
                        }
                      >
                        Rensa alla
                      </button>
                    </div>
                  </div>
                </SideMenu>
              </div>
            </div>
          </div>

          {/* --- Filter chips --- */}
          {(hasSubCategories !== null || selectedUnitIds.length > 0) && (
            <div className="flex flex-wrap gap-4">
              <span className="flex items-center font-semibold text-[var(--text-secondary)]">
                Aktiva filter:
              </span>
              <FilterChip
                visible={hasSubCategories === true}
                onClickEvent={setHasSubCategories}
                label="Har underkategorier"
              />

              <FilterChip
                visible={hasSubCategories === false}
                onClickEvent={setHasSubCategories}
                label="Inga underkategorier"
              />

              {selectedUnitIds.map((unitId) => {
                const unit = units.find((u) => u.id === unitId);
                return (
                  <FilterChip
                    key={unitId}
                    visible={true}
                    onClickEvent={() =>
                      setSelectedUnitIds((prev) =>
                        prev.filter((u) => u !== unitId),
                      )
                    }
                    label={unit?.name ?? ""}
                  />
                );
              })}

              <button
                className="group w-auto cursor-pointer rounded-full px-4 transition-colors duration-[var(--fast)] hover:bg-[var(--bg-navbar-link)]"
                onClick={() => {
                  setHasSubCategories(null);
                  setSelectedUnitIds([]);
                }}
              >
                <span className="font-semibold text-[var(--accent-color)]">
                  Rensa alla
                </span>
              </button>
            </div>
          )}
        </div>

        {/* --- TABLE --- */}
        <div className="flex w-full flex-col">
          <div className="flex w-full overflow-x-auto rounded border-1 border-[var(--border-main)]">
            <table className="w-full table-fixed border-collapse">
              {/* --- Table head --- */}
              <thead
                className={`${!props.isConnected || isLoadingContent ? "pointer-events-none" : ""} bg-[var(--bg-grid-header)]`}
              >
                <tr>
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
                        indeterminate={
                          !allSelected &&
                          visibleContentIds.some((id) =>
                            selectedItems.includes(id),
                          )
                        }
                        readOnly
                      />
                    </div>
                  </th>

                  <ThCell
                    sortingItem="name"
                    label="Namn"
                    labelAsc="namn Ö-A"
                    labelDesc="namn A-Ö"
                  />

                  <ThCell
                    sortingItem="units"
                    label="Enheter med åtkomst"
                    labelAsc="enheter med åtkomst Ö-A"
                    labelDesc="enheter med åtkomst A-Ö"
                    classNameAddition="hidden lg:table-cell"
                  />

                  <ThCell
                    sortingItem="subCategories"
                    label="Underkategorier"
                    labelAsc="underkategorier Ö-A"
                    labelDesc="underkategorier A-Ö"
                    classNameAddition="hidden xs:table-cell"
                  />
                </tr>
              </thead>

              {/* --- Table body --- */}
              <tbody>
                {/* --- Error messages --- */}
                {!props.isConnected || items.length === 0 ? (
                  <tr>
                    <td colSpan={colSpan} className="h-57">
                      {!props.isConnected ? (
                        <Message icon="server" content="server" />
                      ) : (
                        <Message
                          icon="search"
                          content={
                            searchTerm ||
                            selectedUnitIds.length > 0 ||
                            hasSubCategories !== null
                              ? "Inga kategorier kunde hittas med det sökkriteriet."
                              : "Det finns inga kategorier."
                          }
                        />
                      )}
                    </td>
                  </tr>
                ) : isLoadingContent ? (
                  <>
                    <tr className="bg-[var(--bg-grid)]">
                      <td
                        colSpan={colSpan}
                        style={{ height: `${rowCount * 40}px` }}
                      >
                        <div className="flex h-[40px]">
                          <Message
                            icon="loading"
                            content="Hämtar innehåll..."
                            sideMessage={(visibleRowCount ?? 0) <= 2}
                          />
                        </div>
                      </td>
                    </tr>
                  </>
                ) : (
                  <>
                    {items.map((item, index) => {
                      const isEven = index % 2 === 0;
                      const isSelected = selectedItems.includes(item.id);
                      const rowClass = `${
                        isEven
                          ? "bg-[var(--bg-grid)]"
                          : "bg-[var(--bg-grid-zebra)]"
                      } ${isSelected ? "bg-[var--bg-grid-header-hover)]" : ""}
                        hover:bg-[var(--bg-grid-header-hover)] cursor-pointer transition-[background] duration-[var(--fast)]`;

                      return (
                        <tr
                          key={item.id}
                          className={rowClass}
                          onClick={() => selectCategory(item.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              selectCategory(item.id);
                            }
                          }}
                        >
                          <td
                            className={`${tdClass} !w-[40px] !min-w-[40px] cursor-pointer !border-l-0`}
                          >
                            <div className="flex items-center justify-center">
                              <div className="flex items-center justify-center">
                                <Input
                                  type="checkbox"
                                  checked={selectedItems.includes(item.id)}
                                  readOnly
                                />
                              </div>
                            </div>
                          </td>

                          <TdCell>{item.name}</TdCell>

                          <TdCell classNameAddition="hidden lg:table-cell">
                            <div className="flex flex-wrap gap-2">
                              {item.units.map((unit, i) => (
                                <span
                                  key={i}
                                  className="flex h-6 items-center justify-center rounded-xl bg-[var(--bg-navbar-link)] px-4 text-sm font-semibold"
                                >
                                  {unit}
                                </span>
                              ))}
                            </div>
                          </TdCell>

                          <TdCell classNameAddition="hidden xs:table-cell">
                            <div className="flex flex-wrap gap-2">
                              {item.subCategories.map((subCategory, i) => (
                                <span
                                  key={i}
                                  className="flex h-6 items-center justify-center rounded-xl bg-[var(--accent-color)] px-4 text-sm font-semibold text-[var(--text-main-reverse)]"
                                >
                                  {subCategory}
                                </span>
                              ))}
                            </div>
                          </TdCell>
                        </tr>
                      );
                    })}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- PAGINATION --- */}
        <div className="flex w-full flex-wrap justify-between gap-x-12 gap-y-4">
          {/* --- Showing info --- */}
          <span className="flex w-[175.23px] text-[var(--text-secondary)]">
            Visar {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, totalItems ?? 0)} av{" "}
            {totalItems ?? 0}
          </span>

          {/* --- Change pages --- */}
          <div className="xs:w-auto flex w-full items-center">
            <button
              type="button"
              onClick={() => {
                setSelectedItems([]);
                setCurrentPage((prev) => Math.max(prev - 1, 1));
              }}
              disabled={currentPage === 1}
              className={`${iconButtonPrimaryClass}`}
            >
              <ChevronLeftIcon className="min-h-full min-w-full" />
            </button>
            <div className="flex flex-wrap items-center justify-center">
              {getPageNumbers().map((page, index) =>
                page === "..." ? (
                  <span key={index} className="flex px-2">
                    ...
                  </span>
                ) : (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedItems([]);
                      setCurrentPage(Number(page));
                    }}
                    className={`${currentPage === page ? "bg-[var(--accent-color)] text-[var(--text-main-reverse)]" : "hover:text-[var(--accent-color)]"} ${currentPage === page && page >= 100 ? "px-5" : ""} flex max-w-7 min-w-7 cursor-pointer justify-center rounded-full px-1 text-lg transition-colors duration-[var(--fast)]`}
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
                setCurrentPage((prev) =>
                  prev <
                  Math.max(1, Math.ceil((totalItems ?? 0) / itemsPerPage))
                    ? prev + 1
                    : prev,
                );
              }}
              disabled={
                currentPage >= Math.ceil((totalItems ?? 0) / itemsPerPage)
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
                  { label: "5", value: "5" },
                  { label: "15", value: "15" },
                  { label: "25", value: "25" },
                ]}
                value={String(itemsPerPage)}
                onChange={(val) => {
                  const newPageSize = Number(val);
                  const newMaxPages = Math.ceil(
                    (totalItems ?? 0) / newPageSize,
                  );
                  setitemsPerPage(newPageSize);

                  if (currentPage > newMaxPages) {
                    setCurrentPage(newMaxPages);
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* --- META DATA ---*/}
        <div className="flex w-full flex-col">
          {/* --- Header --- */}
          <div className="flex items-center rounded-t border-1 border-[var(--border-main)] bg-[var(--bg-grid-header)] px-3 py-2">
            <span className="truncate font-semibold">
              Information om vald kategori
            </span>
          </div>
          {/* --- Items --- */}
          <div
            className={`${selectedItems.length === 0 || selectedItems.length > 1 ? "items-center" : ""} flex max-h-96 min-h-80 overflow-x-auto rounded-b border-1 border-t-0 border-[var(--border-main)] p-4`}
          >
            {selectedItems.length === 0 ? (
              <Message
                icon="category"
                content="Här kan du se information om vald kategori. Välj en i tabellen ovan!"
              />
            ) : selectedItems.length > 1 ? (
              <Message
                icon="beware"
                content="Kan inte visa information om flera kategorier samtidigt."
              />
            ) : (
              <div className="flex">
                {items
                  .filter((u) => u.id === selectedItems[0])
                  .map((item) => (
                    <div key={item.id} className="flex flex-col gap-8">
                      <div className="flex flex-col gap-8">
                        <p>
                          <strong>Namn: </strong>
                          {item.name}
                        </p>

                        <div
                          className={`${item.units.length > 0 ? "gap-2" : ""} flex flex-col`}
                        >
                          <div
                            className={`${item.units.length > 0 ? "flex-col gap-2" : ""} flex`}
                          >
                            <strong>Enheter med åtkomst: </strong>
                            <div className="flex flex-wrap gap-2">
                              {item.units.length > 0
                                ? item.units.map((unit, i) => (
                                    <span
                                      key={i}
                                      className="flex h-6 items-center justify-center rounded-xl bg-[var(--bg-navbar-link)] px-4 text-sm font-semibold"
                                    >
                                      {unit}
                                    </span>
                                  ))
                                : "\u00A0-"}
                            </div>
                          </div>

                          <div
                            className={`${item.subCategories.length > 0 ? "flex-col gap-2" : ""} flex`}
                          >
                            <strong>Underkategorier: </strong>
                            <div className="flex flex-wrap gap-2">
                              {item.subCategories.length > 0
                                ? item.subCategories.map((subCategory, i) => (
                                    <span
                                      key={i}
                                      className="flex h-6 items-center justify-center rounded-xl bg-[var(--accent-color)] px-4 text-sm font-semibold text-[var(--text-main-reverse)]"
                                    >
                                      {subCategory}
                                    </span>
                                  ))
                                : "\u00A0-"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p>
                          <strong>Skapad: </strong>
                          {new Date(item.creationDate).toLocaleString()} av{" "}
                          {item.createdBy}
                        </p>

                        <p>
                          <strong>Uppdaterad: </strong>
                          {new Date(item.updateDate).toLocaleString()} av{" "}
                          {item.updatedBy}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoriesClient;
