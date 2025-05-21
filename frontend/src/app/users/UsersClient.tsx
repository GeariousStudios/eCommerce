"use client";

import { ReactNode, RefObject, useEffect, useRef, useState } from "react";
import Input from "../components/input/Input";
import DeleteModal from "../components/modals/DeleteModal";
import { useToast } from "../components/toast/ToastProvider";
import CustomTooltip from "../components/customTooltip/CustomTooltip";
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
} from "../styles/buttonClasses";
import Message from "../components/message/Message";
import SingleDropdown from "../components/dropdowns/SingleDropdown";
import UserModal from "../components/modals/UserModal";
import MenuDropdown from "../components/dropdowns/MenuDropdown";
import SideMenu from "../components/sideMenu/SideMenu";

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
// --- Outside UserClient ---
type FilterData = {
  label: string;
  show: boolean;
  setShow: (value: boolean) => void;
  count?: number;
};

// --- Inside UserClient ---
type Item = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles: string[];
  isLocked: boolean;

  isOnline: boolean;
  creationDate: string;
  lastLogin: string | null;
};

type Props = {
  isConnected: boolean | null;
};

const UsersClient = (props: Props) => {
  // --- VARIABLES ---
  const [colSpan, setColSpan] = useState(8);

  // --- States: Backend ---
  const [isLoadingContent, setIsLoadingItems] = useState(false);
  const [totalCounts, setTotalCounts] = useState<{
    admins: number;
    developers: number;
    locked: number;
    unlocked: number;

    filteredAdmins: number;
    filteredDevelopers: number;
    filteredLocked: number;
    filteredUnlocked: number;
  } | null>(null);

  // --- States: Edit/Delete ---
  const [items, setItems] = useState<Item[]>([]);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isUserModalOpen, setIsEditItemModalOpen] = useState(false);

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

  const [showAdmins, setShowAdmins] = useState(false);
  const [showDevelopers, setShowDevelopers] = useState(false);
  const [showLocked, setShowLocked] = useState(false);
  const [showUnlocked, setShowUnlocked] = useState(false);

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

      if (showLocked && !showUnlocked) {
        params.append("isLocked", "true");
      } else if (!showLocked && showUnlocked) {
        params.append("isLocked", "false");
      }

      if (showAdmins) {
        params.append("roles", "Admin");
      }

      if (showDevelopers) {
        params.append("roles", "Developer");
      }

      // --- Data ---
      const response = await fetch(
        `${apiUrl}/user-management?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

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
      const response = await fetch(`${apiUrl}/user-management/delete/${id}`, {
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
      notify("success", "Användare borttagen!", 4000);
    } catch (err) {
      notify("error", String(err));
    }
  };

  // --- FETCH FREQUENCY ---
  useEffect(() => {
    fetchItems(currentPage, itemsPerPage, sortBy, sortOrder);
  }, [
    currentPage,
    itemsPerPage,
    sortBy,
    sortOrder,
    searchTerm,
    showAdmins,
    showDevelopers,
    showLocked,
    showUnlocked,
  ]);

  // --- When filter, go to page 1 ---
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showAdmins, showDevelopers, showLocked, showUnlocked]);

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

  const allSelected =
    visibleContentIds.length > 0 &&
    visibleContentIds.every((id) => selectedItems.includes(id));

  const selectUser = (itemId: number) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter((id) => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const selectAll = () => {
    if (allSelected) {
      setSelectedItems(
        selectedItems.filter((id) => !visibleContentIds.includes(id)),
      );
    } else {
      setSelectedItems([...new Set([...selectedItems, ...visibleContentIds])]);
    }
  };

  // --- SET COLSPAN ---
  useEffect(() => {
    const updateColSpan = () => {
      const width = window.innerWidth;

      let span = 3;
      if (width >= 640) {
        span += 1;
      }
      if (width >= 1024) {
        span += 1;
      }
      if (width >= 1280) {
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
      <UserModal
        isOpen={isUserModalOpen}
        onClose={closeItemEditModal}
        userId={editingItemId}
        onUserUpdated={() => {
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
            <CustomTooltip content="Lägg till ny användare" lgHidden={true}>
              <button
                className={`${buttonPrimaryClass} sm:w-56 sm:min-w-56`}
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
                  <span className="hidden sm:block">
                    Lägg till ny användare
                  </span>
                </div>
              </button>
            </CustomTooltip>

            {/* --- Edit item --- */}
            <CustomTooltip
              content={
                selectedItems.length === 0
                  ? "Välj en användare"
                  : selectedItems.length === 1
                    ? "Redigera användare"
                    : "Du kan bara redigera en användare i taget!"
              }
              lgHidden={selectedItems.length === 1}
            >
              <button
                className={`${buttonSecondaryClass} sm:w-56 sm:min-w-56`}
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
                  <span className="hidden sm:block">Redigera användare</span>
                </div>
              </button>
            </CustomTooltip>

            {/* --- Delete item --- */}
            <CustomTooltip
              content={
                selectedItems.length === 0
                  ? "Välj en eller fler användare"
                  : `Ta bort användare (${selectedItems.length})`
              }
              lgHidden={selectedItems.length > 0}
            >
              <button
                className={`${buttonDeleteSecondaryClass} 3xs:ml-auto lg:w-56 lg:min-w-56`}
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
                    Ta bort användare
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
                  placeholder="Sök användare"
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
                label="Behörigheter"
                breakpoint="sm"
                filterData={[
                  {
                    label: "Admin",
                    show: showAdmins,
                    setShow: setShowAdmins,
                    count: totalCounts?.filteredAdmins,
                  },
                  {
                    label: "Developer",
                    show: showDevelopers,
                    setShow: setShowDevelopers,
                    count: totalCounts?.filteredDevelopers,
                  },
                ]}
              />

              {/* --- Filter: Two --- */}
              <Filter
                filterRef={filterTwoRef}
                label="Status"
                breakpoint="ml"
                filterData={[
                  {
                    label: "Låst",
                    show: showLocked,
                    setShow: setShowLocked,
                    count: totalCounts?.filteredLocked,
                  },
                  {
                    label: "Upplåst",
                    show: showUnlocked,
                    setShow: setShowUnlocked,
                    count: totalCounts?.filteredUnlocked,
                  },
                ]}
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
                        label="Behörigheter"
                        filterData={[
                          {
                            label: "Admin",
                            show: showAdmins,
                            setShow: setShowAdmins,
                            count: totalCounts?.filteredAdmins,
                          },
                          {
                            label: "Developer",
                            show: showDevelopers,
                            setShow: setShowDevelopers,
                            count: totalCounts?.filteredDevelopers,
                          },
                        ]}
                      />

                      <AllFilter
                        filterRef={allFilterTwoRef}
                        label="Status"
                        filterData={[
                          {
                            label: "Låst",
                            show: showLocked,
                            setShow: setShowLocked,
                            count: totalCounts?.filteredLocked,
                          },
                          {
                            label: "Upplåst",
                            show: showUnlocked,
                            setShow: setShowUnlocked,
                            count: totalCounts?.filteredUnlocked,
                          },
                        ]}
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
                          setShowDevelopers(false);
                          setShowAdmins(false);
                          setShowLocked(false);
                          setShowUnlocked(false);
                        }}
                        className={`${buttonSecondaryClass} w-full`}
                        disabled={
                          !showDevelopers &&
                          !showAdmins &&
                          !showLocked &&
                          !showUnlocked
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
          {(showAdmins || showDevelopers || showLocked || showUnlocked) && (
            <div className="flex flex-wrap gap-4">
              <span className="flex items-center font-semibold text-[var(--text-secondary)]">
                Aktiva filter:
              </span>
              <FilterChip
                visible={showAdmins}
                onClickEvent={setShowAdmins}
                label="Admin"
              />

              <FilterChip
                visible={showDevelopers}
                onClickEvent={setShowDevelopers}
                label="Developer"
              />

              <FilterChip
                visible={showLocked}
                onClickEvent={setShowLocked}
                label="Låst"
              />

              <FilterChip
                visible={showUnlocked}
                onClickEvent={setShowUnlocked}
                label="Upplåst"
              />

              <button
                className="group w-auto cursor-pointer rounded-full px-4 transition-colors duration-[var(--fast)] hover:bg-[var(--bg-navbar-link)]"
                onClick={() => {
                  setShowAdmins(false);
                  setShowDevelopers(false);
                  setShowLocked(false);
                  setShowUnlocked(false);
                }}
              >
                <span className="font-semibold text-[var(--accent-color)]">
                  Rensa alla
                </span>
              </button>
            </div>
          )}

          {/* --- Showing info --- */}
          <span className="-mb-2 flex items-end text-[var(--text-secondary)]">
            Visar {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, totalItems ?? 0)} av{" "}
            {totalItems ?? 0}
          </span>
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
                    sortingItem="itemname"
                    label="Användarnamn"
                    labelAsc="användarnamn Ö-A"
                    labelDesc="användarnamn A-Ö"
                  />

                  <ThCell
                    sortingItem="firstName"
                    label="Förnamn"
                    labelAsc="förnamn Ö-A"
                    labelDesc="förnamn A-Ö"
                    classNameAddition="hidden xs:table-cell"
                  />

                  <ThCell
                    sortingItem="lastName"
                    label="Efternamn"
                    labelAsc="efternamn Ö-A"
                    labelDesc="efternamn A-Ö"
                    classNameAddition="hidden sm:table-cell"
                  />

                  <ThCell
                    sortingItem="email"
                    label="Mejladress"
                    labelAsc="mejladress Ö-A"
                    labelDesc="mejladress A-Ö"
                    classNameAddition="hidden lg:table-cell"
                  />

                  <ThCell
                    sortingItem="roles"
                    label="Behörigheter"
                    labelAsc="behörigheter Ö-A"
                    labelDesc="behörigheter A-Ö"
                    classNameAddition="hidden xl:table-cell"
                  />

                  <ThCell
                    sortingItem="isLocked"
                    label="Status"
                    labelAsc="låsta konton"
                    labelDesc="upplåsta konton"
                    classNameAddition="w-28 min-w-28 border-r-0 hidden 2xs:table-cell"
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
                            showAdmins ||
                            showDevelopers ||
                            showLocked ||
                            showUnlocked
                              ? "Inga användare kunde hittas med det sökkriteriet."
                              : "Det finns inga användare."
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
                      const rowClass = isEven
                        ? "bg-[var(--bg-grid)]"
                        : "bg-[var(--bg-grid-zebra)]";

                      return (
                        <tr key={item.id} className={rowClass}>
                          <td
                            className={`${tdClass} !w-[40px] !min-w-[40px] cursor-pointer !border-l-0 transition-[background] duration-[var(--fast)] hover:bg-[var(--bg-grid-header-hover)]`}
                            onClick={() => selectUser(item.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                selectUser(item.id);
                              }
                            }}
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

                          <TdCell>{item.username}</TdCell>

                          <TdCell classNameAddition="hidden xs:table-cell">
                            {item.firstName}
                          </TdCell>

                          <TdCell classNameAddition="hidden sm:table-cell">
                            {item.lastName}
                          </TdCell>

                          <TdCell classNameAddition="hidden lg:table-cell">
                            {item.email}
                          </TdCell>

                          <TdCell classNameAddition="hidden xl:table-cell">
                            {(Array.isArray(item.roles)
                              ? item.roles
                              : [item.roles || ""]
                            ).join(", ")}
                          </TdCell>

                          <TdCell classNameAddition=" w-28 min-w-28 border-r-0 2xs:table-cell hidden">
                            <div className="flex items-center justify-center">
                              <span
                                className={`${item.isLocked ? "bg-[var(--locked)]" : "bg-[var(--unlocked)]"} flex h-6 w-64 items-center justify-center rounded-xl text-sm font-semibold text-[var(--text-main-reverse)]`}
                              >
                                {item.isLocked ? "Låst" : "Upplåst"}
                              </span>
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

        {/* --- Pagination --- */}
        <div className="flex w-full flex-wrap justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="">Antal per sida:</span>
            <div className="3xs:min-w-20">
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

          <div className="gap-4">
            <div className="-mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`${iconButtonPrimaryClass}`}
              >
                <ChevronLeftIcon className="min-h-full min-w-full" />
              </button>
              <span className="truncate text-[var(--text-secondary)]">
                Sida {currentPage} av{" "}
                {Math.max(1, Math.ceil((totalItems ?? 0) / itemsPerPage))}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((prev) =>
                    prev <
                    Math.max(1, Math.ceil((totalItems ?? 0) / itemsPerPage))
                      ? prev + 1
                      : prev,
                  )
                }
                disabled={
                  currentPage >= Math.ceil((totalItems ?? 0) / itemsPerPage)
                }
                className={`${iconButtonPrimaryClass}`}
              >
                <ChevronRightIcon className="min-h-full min-w-full" />
              </button>
            </div>
          </div>
        </div>

        {/* --- META DATA ---*/}
        <div className="flex w-full flex-col">
          {/* --- Header --- */}
          <div className="flex items-center rounded-t border-1 border-[var(--border-main)] bg-[var(--bg-grid-header)] px-3 py-2">
            <span className="truncate font-semibold">Användarinformation</span>
          </div>
          {/* --- Items --- */}
          <div
            className={`${selectedItems.length === 0 || selectedItems.length > 1 ? "items-center" : ""} flex max-h-96 min-h-80 overflow-x-auto rounded-b border-1 border-t-0 border-[var(--border-main)] p-4`}
          >
            {selectedItems.length === 0 ? (
              <Message
                icon="user"
                content="Här kan du se information om vald användare. Välj en i tabellen ovan!"
              />
            ) : selectedItems.length > 1 ? (
              <Message
                icon="beware"
                content="Kan inte visa information om flera användare samtidigt."
              />
            ) : (
              <div className="flex">
                {items
                  .filter((u) => u.id === selectedItems[0])
                  .map((item) => (
                    <div key={item.id} className="flex flex-col gap-8">
                      <div>
                        {item.isOnline ? (
                          <span className="font-semibold text-[var(--unlocked)]">
                            Online
                          </span>
                        ) : (
                          <span className="font-semibold text-[var(--locked)]">
                            Offline
                          </span>
                        )}

                        <p>
                          <strong>Användarnamn: </strong>
                          {item.username}
                        </p>

                        <p>
                          <strong>Förnamn: </strong>
                          {item.firstName}
                        </p>

                        <p>
                          <strong>Efternamn: </strong>
                          {item.lastName}
                        </p>

                        <p>
                          <strong>Mejladress: </strong>
                          {item.email}
                        </p>

                        <p className="flex">
                          <strong>Behörigheter:&nbsp;</strong>
                          {item.roles.map((role, i) => (
                            <span key={i}>
                              {role}
                              {i < item.roles.length - 1 ? ",\u00A0" : ""}
                            </span>
                          ))}
                        </p>

                        <div className="mt-2">
                          <span
                            className={`${item.isLocked ? "bg-[var(--locked)]" : "bg-[var(--unlocked)]"} flex h-6 w-20 items-center justify-center rounded-xl text-sm font-semibold text-[var(--text-main-reverse)]`}
                          >
                            {item.isLocked ? "Låst" : "Upplåst"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p>
                          <strong>Senast inloggad: </strong>
                          {item.lastLogin
                            ? new Date(item.lastLogin).toLocaleString()
                            : "Aldrig"}
                        </p>

                        <p>
                          <strong>Konto skapat: </strong>
                          {new Date(item.creationDate).toLocaleString()}
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

export default UsersClient;
