"use client";

import { ReactNode, RefObject, useEffect, useRef, useState } from "react";
import Input from "../components/input/Input";
import DeleteModal from "../components/modals/DeleteModal";
import { useNotification } from "../components/notification/NotificationProvider";
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

  let filterClass =
    "truncate font-semibold transition-colors duration-[var(--fast)] group-hover:text-[var(--accent-color)]";

  let filterIconClass =
    "h-6 w-6 transition-[color,rotate] duration-[var(--fast)] group-hover:text-[var(--accent-color)]";

type Item = {
  id: number;
  itemname: string;
  name: string;
  email: string;
  password: string;
  roles: string[];
  isLocked: boolean;

  // Meta data.
  isOnline: boolean;
  creationDate: string;
  lastLogin: string | null;
};

type FilterItemData = {
  label: string;
  show: boolean;
  setShow: (value: boolean) => void;
  count?: number;
};

type Props = {
  isConnected: boolean | null;
};

// --- Filter ---
const Filter = ({
  filterRef,
  label,
  filterData,
}: {
  filterRef: RefObject<HTMLButtonElement | null>;
  label: string;
  filterData: FilterItemData[];
}) => {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className="relative hidden sm:flex">
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
              <span>
                <span>({item.count ?? 0})</span>
              </span>
            </div>
          ))}
        </div>
      </MenuDropdown>
    </div>
  );
};

const UsersClient = (props: Props) => {
  // States.
  const [colSpan, setColSpan] = useState(8);

  // Authorization variables.
  const token = localStorage.getItem("token");

  // Backend variables.
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isLoadingContent, setIsLoadingItems] = useState(false);
  const [totalCounts, setTotalCounts] = useState<{
    admins: number;
    developers: number;
    locked: number;
    unlocked: number;

    // Filtered.
    filteredAdmins: number;
    filteredDevelopers: number;
    filteredLocked: number;
    filteredUnlocked: number;
  } | null>(null);

  // Add/edit variables.
  const [items, setItems] = useState<Item[]>([]);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Delete variables.
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItemIds, setDeletingItemIds] = useState<number[]>([]);

  // Pagination and search variables.
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setitemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Other.
  const { notify } = useNotification();

  // Filter states and refs.
  const filterOneRef = useRef<HTMLButtonElement>(null);
  const filterTwoRef = useRef<HTMLButtonElement>(null);
  const filterAllRef = useRef<HTMLButtonElement>(null);

  const [filterOneOpen, setFilterOneOpen] = useState(false);
  const [filterTwoOpen, setFilterTwoOpen] = useState(false);
  const [filterAllOpen, setFilterAllOpen] = useState(false);

  const [showAdmins, setShowAdmins] = useState(false);
  const [showDevelopers, setShowDevelopers] = useState(false);
  const [showLocked, setShowLocked] = useState(false);
  const [showUnlocked, setShowUnlocked] = useState(false);

  // Big filter.
  const filterAllRolesRef = useRef<HTMLDivElement>(null);
  const filterAllStatusRef = useRef<HTMLDivElement>(null);

  const [bigFilterOneOpen, setBigFilterOneOpen] = useState(false);
  const [bigFilterTwoOpen, setBigFilterTwoOpen] = useState(false);

  const [bigFilterOneHeight, setBigFilterOneHeight] = useState("0px");
  const [bigFilterTwoHeight, setBigFilterTwoHeight] = useState("0px");

  useEffect(() => {
    if (filterAllRolesRef.current) {
      setBigFilterOneHeight(
        bigFilterOneOpen
          ? `${filterAllRolesRef.current.scrollHeight}px`
          : "0px",
      );
    }
  }, [bigFilterOneOpen, totalCounts]);

  useEffect(() => {
    if (filterAllStatusRef.current) {
      setBigFilterTwoHeight(
        bigFilterTwoOpen
          ? `${filterAllStatusRef.current.scrollHeight}px`
          : "0px",
      );
    }
  }, [bigFilterTwoOpen, totalCounts]);

  // Modal before deletion.
  const toggleDeleteModal = (itemIds: number[] = []) => {
    setDeletingItemIds(itemIds);
    setIsDeleteModalOpen((prev) => !prev);
  };

  // Modal for item editing/adding.
  const openUserModal = (itemId: number | null = null) => {
    setEditingItemId(itemId);
    setIsUserModalOpen(true);
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setEditingItemId(null);
  };

  // Fetch all items.
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

      const response = await fetch(
        `${apiUrl}/user-management?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      const result = await response.json();
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

  // Fetch items every time page changes.
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

  // Go to page 1 when searching.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showAdmins, showDevelopers, showLocked, showUnlocked]);

  // Handle sorting.
  const handleSort = (field: string) => {
    const isSameField = field === sortBy;
    const newSortOrder = isSameField && sortOrder === "asc" ? "desc" : "asc";

    setSortBy(field);
    setSortOrder(newSortOrder);
    fetchItems(currentPage, itemsPerPage, field, newSortOrder, false);
  };

  // Change sorting icon.
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

  // Delete item.
  const finishDeleteItem = async (id: number) => {
    try {
      const response = await fetch(`${apiUrl}/user-management/delete/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        notify("error", result.message);
        return;
      }

      await fetchItems(currentPage, itemsPerPage, sortBy, sortOrder);
      notify("success", "Användare borttagen!", 4000);
    } catch (err) {
      notify("error", String(err));
    }
  };

  // Select items.
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

  // Go to page 1 upon filtering.
  useEffect(() => {
    setCurrentPage(1);
  }, [showLocked, showUnlocked, searchTerm, showAdmins, showDevelopers]);

  // Set colSpan.
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

  // --- Pre-defined classes ---
  let thClass =
    "pl-4 p-2 min-w-48 h-[40px] cursor-pointer border-1 border-t-0 border-[var(--border-secondary)] border-b-[var(--border-main)] text-left transition-[background] duration-[var(--fast)] hover:bg-[var(--bg-grid-header-hover)]";

  let tdClass =
    "py-2 px-4 min-w-48 h-[40px] border-1 border-b-0 border-[var(--border-secondary)] text-left break-all";

  let filterClass =
    "truncate font-semibold transition-colors duration-[var(--fast)] group-hover:text-[var(--accent-color)]";

  let filterIconClass =
    "h-6 w-6 transition-[color,rotate] duration-[var(--fast)] group-hover:text-[var(--accent-color)]";

  // --- Pre-defined components ---
  // --- FilterItem ---
  const FilterItem = ({
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

  return (
    <>
      <UserModal
        isOpen={isUserModalOpen}
        onClose={closeUserModal}
        userId={editingItemId}
        onUserUpdated={() => {
          fetchItems(currentPage, itemsPerPage, sortBy, sortOrder);
        }}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          toggleDeleteModal();
          setDeletingItemIds([]);
        }}
        onConfirm={async () => {
          for (const id of deletingItemIds) {
            await finishDeleteItem(id);
          }

          setIsDeleteModalOpen(false);
          setDeletingItemIds([]);
          setSelectedItems([]);
        }}
      />

      {/* --- All content --- */}
      <div className="flex flex-col gap-4">
        {/* --- Top --- */}
        <div className="flex flex-col gap-4">
          {/* --- Item editing buttons --- */}
          <div className="flex gap-4">
            {/* --- Add item --- */}
            <CustomTooltip content="Lägg till ny användare" lgHidden={true}>
              <button
                className={`${buttonPrimaryClass} sm:w-56 sm:min-w-56`}
                onClick={() => {
                  openUserModal();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openUserModal();
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
                  openUserModal(selectedItems[0]);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openUserModal(selectedItems[0]);
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
                className={`${buttonDeleteSecondaryClass} ml-auto lg:w-56 lg:min-w-56`}
                onClick={() => toggleDeleteModal(selectedItems)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleDeleteModal(selectedItems);
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

          {/* --- Search and filters --- */}
          <div className="flex justify-between gap-4">
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
              {/* --- Filter one --- */}
              <Filter
                filterRef={filterOneRef}
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
              {/* <div className="relative hidden sm:flex">
                <button
                  ref={filterOneRef}
                  className={`${roundedButtonClass} group w-auto gap-2 px-4`}
                  onClick={() => {
                    setFilterOneOpen(!filterOneOpen);
                  }}
                >
                  <span
                    className={`${filterClass} ${filterOneOpen ? "text-[var(--accent-color)]" : ""}`}
                  >
                    Behörigheter
                  </span>
                  <ChevronDownIcon
                    className={`${filterIconClass} ${filterOneOpen ? "rotate-180 text-[var(--accent-color)]" : ""}`}
                  />
                </button>
                <MenuDropdown
                  triggerRef={filterOneRef}
                  isOpen={filterOneOpen}
                  onClose={() => setFilterOneOpen(false)}
                >
                  <div className="flex w-full flex-col gap-4">
                    <div
                      onClick={() => {
                        setShowAdmins((prev) => !prev);
                      }}
                      className="group flex cursor-pointer justify-between"
                    >
                      <Input
                        type="checkbox"
                        checked={showAdmins}
                        label="Admin"
                        readOnly
                      />
                      <span>
                        <span>({totalCounts?.filteredAdmins ?? 0})</span>
                      </span>
                    </div>

                    <div
                      onClick={() => {
                        setShowDevelopers((prev) => !prev);
                      }}
                      className="group flex cursor-pointer justify-between"
                    >
                      <Input
                        type="checkbox"
                        checked={showDevelopers}
                        label="Developer"
                        readOnly
                      />
                      <span>
                        <span>({totalCounts?.filteredDevelopers ?? 0})</span>
                      </span>
                    </div>
                  </div>
                </MenuDropdown>
              </div> */}

              {/* Status filter */}
              <div className="relative hidden md:flex">
                <button
                  ref={filterTwoRef}
                  className={`${roundedButtonClass} group w-auto gap-2 px-4`}
                  onClick={() => {
                    setFilterTwoOpen(!filterTwoOpen);
                  }}
                >
                  <span
                    className={`${filterClass} ${filterTwoOpen ? "text-[var(--accent-color)]" : ""}`}
                  >
                    Status
                  </span>
                  <ChevronDownIcon
                    className={`${filterIconClass} ${filterTwoOpen ? "rotate-180 text-[var(--accent-color)]" : ""}`}
                  />
                </button>

                <MenuDropdown
                  triggerRef={filterTwoRef}
                  isOpen={filterTwoOpen}
                  onClose={() => setFilterTwoOpen(false)}
                >
                  <div className="flex flex-col gap-4">
                    <div
                      onClick={() => {
                        setShowLocked((prev) => !prev);
                      }}
                      className="group flex cursor-pointer justify-between"
                    >
                      <Input
                        id={totalCounts?.filteredLocked === 0 ? "disabled" : ""}
                        type="checkbox"
                        checked={showLocked}
                        label="Låst"
                        readOnly
                      />
                      <span>
                        <span>({totalCounts?.filteredLocked ?? 0})</span>
                      </span>
                    </div>

                    <div
                      onClick={() => {
                        setShowLocked((prev) => !prev);
                      }}
                      className="group flex cursor-pointer justify-between"
                    >
                      <Input
                        type="checkbox"
                        checked={showUnlocked}
                        label="Upplåst"
                        readOnly
                      />
                      <span>
                        <span>({totalCounts?.filteredUnlocked ?? 0})</span>
                      </span>
                    </div>
                  </div>
                </MenuDropdown>
              </div>

              {/* All filters */}
              <div className="relative">
                {/* flex md:hidden */}
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
                      {/* --- Roles filter --- */}
                      <button
                        onClick={() => setBigFilterOneOpen((prev) => !prev)}
                        className={`${bigFilterOneOpen ? "text-[var(--accent-color)]" : ""} flex w-full cursor-pointer items-center justify-between pb-4 duration-[var(--fast)] hover:text-[var(--accent-color)]`}
                      >
                        <span className="text-lg font-semibold">
                          Behörigheter
                        </span>
                        <ChevronDownIcon
                          className={`${bigFilterOneOpen ? "rotate-180" : ""} transition-rotate h-6 w-6 duration-[var(--fast)]`}
                        />
                      </button>

                      <div className="relative">
                        <div
                          style={{ height: bigFilterOneHeight }}
                          className="overflow-hidden transition-[height] duration-[var(--slow)]"
                        >
                          <div ref={filterAllRolesRef}>
                            <div className="flex w-full flex-col gap-4">
                              <div
                                onClick={() => {
                                  setShowAdmins((prev) => !prev);
                                }}
                                className="group flex cursor-pointer justify-between py-4"
                              >
                                <Input
                                  type="checkbox"
                                  checked={showAdmins}
                                  label="Admin"
                                  readOnly
                                />
                                <span>
                                  ({totalCounts?.filteredAdmins ?? 0})
                                </span>
                              </div>
                            </div>

                            <div className="flex w-full flex-col gap-4">
                              <div
                                onClick={() => {
                                  setShowDevelopers((prev) => !prev);
                                }}
                                className="group flex cursor-pointer justify-between py-4"
                              >
                                <Input
                                  type="checkbox"
                                  checked={showDevelopers}
                                  label="Developer"
                                  readOnly
                                />
                                <span>
                                  ({totalCounts?.filteredDevelopers ?? 0})
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <hr className="absolute -ml-4 flex w-[calc(100%+2rem)] text-[var(--border-main)]" />
                      </div>

                      {/* --- Status filter --- */}
                      <button
                        onClick={() => setBigFilterTwoOpen((prev) => !prev)}
                        className={`${bigFilterTwoOpen ? "text-[var(--accent-color)]" : ""} flex w-full cursor-pointer items-center justify-between py-4 duration-[var(--fast)] hover:text-[var(--accent-color)]`}
                      >
                        <span className="text-lg font-semibold">Status</span>
                        <ChevronDownIcon
                          className={`${bigFilterTwoOpen ? "rotate-180" : ""} transition-rotate h-6 w-6 duration-[var(--fast)]`}
                        />
                      </button>

                      <div className="relative">
                        <div
                          style={{ height: bigFilterTwoHeight }}
                          className="overflow-hidden transition-[height] duration-[var(--slow)]"
                        >
                          <div ref={filterAllStatusRef}>
                            <div className="flex w-full flex-col gap-4">
                              <div
                                onClick={() => {
                                  setShowLocked((prev) => !prev);
                                }}
                                className="group flex cursor-pointer justify-between py-4"
                              >
                                <Input
                                  type="checkbox"
                                  checked={showLocked}
                                  label="Låst"
                                  readOnly
                                />
                                <span>
                                  ({totalCounts?.filteredLocked ?? 0})
                                </span>
                              </div>
                            </div>

                            <div className="flex w-full flex-col gap-4">
                              <div
                                onClick={() => {
                                  setShowUnlocked((prev) => !prev);
                                }}
                                className="group flex cursor-pointer justify-between py-4"
                              >
                                <Input
                                  type="checkbox"
                                  checked={showUnlocked}
                                  label="Upplåst"
                                  readOnly
                                />
                                <span>
                                  ({totalCounts?.filteredUnlocked ?? 0})
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <hr className="absolute -ml-4 flex w-[calc(100%+2rem)] text-[var(--border-main)]" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row">
                      <button className={`${buttonPrimaryClass} w-full`}>
                        Visa{" "}
                        <span className="font-normal">{totalItems ?? 0}</span>
                      </button>
                      <button
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

          {/* --- Active filters --- */}
          <div className="flex flex-wrap gap-4">
            <FilterItem
              visible={showAdmins}
              onClickEvent={setShowAdmins}
              label="Admin"
            />

            <FilterItem
              visible={showDevelopers}
              onClickEvent={setShowDevelopers}
              label="Developer"
            />

            <FilterItem
              visible={showLocked}
              onClickEvent={setShowLocked}
              label="Låst"
            />

            <FilterItem
              visible={showUnlocked}
              onClickEvent={setShowUnlocked}
              label="Upplåst"
            />

            {(showAdmins || showDevelopers || showLocked || showUnlocked) && (
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
            )}
          </div>

          {/* --- Showing info --- */}
          <span className="-mb-2 flex items-end text-[var(--text-secondary)]">
            Visar {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, totalItems ?? 0)} av{" "}
            {totalItems ?? 0}
          </span>
        </div>

        {/* --- Table --- */}
        <div className="flex w-full flex-col">
          <div className="flex w-full overflow-x-auto rounded border-1 border-[var(--border-main)]">
            <table className="w-full table-fixed border-collapse">
              {/* --- Table Headers --- */}
              <thead
                className={`${!props.isConnected || isLoadingContent ? "pointer-events-none" : ""} bg-[var(--bg-grid-header)]`}
              >
                <tr>
                  <th
                    className={`${thClass} !w-[40px] !min-w-[40px] !cursor-default !border-l-0 !pl-2 hover:!bg-[var(--bg-grid-header)]`}
                  >
                    <div className="flex items-center justify-center">
                      <Input
                        type="checkbox"
                        checked={allSelected}
                        onChange={selectAll}
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
                    sortingItem="name"
                    label="Namn"
                    labelAsc="namn Ö-A"
                    labelDesc="namn A-Ö"
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
                    classNameAddition="w-28 min-w-28 border-r-0"
                  />
                </tr>
              </thead>

              {/* --- Table body --- */}
              <tbody>
                {!props.isConnected ? (
                  <tr>
                    <td colSpan={colSpan} className="h-57">
                      <Message icon="server" content="server" />
                    </td>
                  </tr>
                ) : isLoadingContent ? (
                  <>
                    {Array.from({
                      length: Math.min(
                        itemsPerPage,
                        totalItems ?? itemsPerPage,
                      ),
                    }).map((_, i) => (
                      <tr key={`loading-${i}`} className="bg-[var(--bg-grid)]">
                        <td colSpan={colSpan} className="h-[40px]">
                          {i ===
                            Math.floor(
                              Math.min(
                                itemsPerPage,
                                totalItems ?? itemsPerPage,
                              ) / 2,
                            ) && (
                            <div className="flex h-[40px]">
                              <Message
                                icon="loading"
                                content="Hämtar innehåll..."
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={colSpan} className="h-57">
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
                    </td>
                  </tr>
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
                            className={`${tdClass} w-12 max-w-12 min-w-12 border-l-0`}
                          >
                            <div className="flex items-center justify-center">
                              <div className="flex items-center justify-center">
                                <Input
                                  type="checkbox"
                                  checked={selectedItems.includes(item.id)}
                                  onChange={() => selectUser(item.id)}
                                />
                              </div>
                            </div>
                          </td>
                          <td className={`${tdClass}`}>
                            <div className="truncate overflow-hidden text-ellipsis">
                              {item.itemname}
                            </div>
                          </td>
                          <td className={`${tdClass} hidden sm:table-cell`}>
                            <div className="truncate overflow-hidden text-ellipsis">
                              {item.name}
                            </div>
                          </td>
                          <td className={`${tdClass} hidden lg:table-cell`}>
                            <div className="truncate overflow-hidden text-ellipsis">
                              {item.email}
                            </div>
                          </td>
                          <td className={`${tdClass} hidden xl:table-cell`}>
                            <div className="truncate overflow-hidden text-ellipsis">
                              {(Array.isArray(item.roles)
                                ? item.roles
                                : [item.roles || ""]
                              ).join(", ")}
                            </div>
                          </td>
                          <td className={`${tdClass} w-24 min-w-24 border-r-0`}>
                            <div className="flex items-center justify-center">
                              {!item.isLocked ? (
                                <span className="flex h-6 w-64 items-center justify-center rounded-xl bg-[var(--unlocked)] text-sm font-semibold text-[var(--text-main-reverse)]">
                                  Upplåst
                                </span>
                              ) : (
                                <span className="flex h-6 w-64 items-center justify-center rounded-xl bg-[var(--locked)] text-sm font-semibold text-[var(--text-main-reverse)]">
                                  Låst
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex w-full justify-between">
          <div className="flex items-center gap-2">
            <span className="">Antal per sida:</span>
            <div className="min-w-20">
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

          <div className="gap-4 truncate">
            <div className="-mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`${iconButtonPrimaryClass}`}
              >
                <ChevronLeftIcon className="h-full w-full" />
              </button>
              <span className="text-[var(--text-secondary)]">
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
                <ChevronRightIcon className="h-full w-full" />
              </button>
            </div>
          </div>
        </div>

        {/* Meta data section */}
        <div className="flex w-full flex-col">
          {/* --- Meta data header --- */}
          <div className="flex items-center rounded-t border-1 border-[var(--border-main)] bg-[var(--bg-grid-header)] px-3 py-2">
            <span className="font-semibold">Användarinformation</span>
          </div>
          {/* --- Meta data items --- */}
          <div
            className={`${selectedItems.length === 0 || selectedItems.length > 1 ? "items-center" : ""} flex max-h-96 min-h-80 rounded-b border-1 border-t-0 border-[var(--border-main)] p-4`}
          >
            {selectedItems.length === 0 ? (
              <Message
                icon="item"
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
                          {item.itemname}
                        </p>

                        <p>
                          <strong>Namn: </strong>
                          {item.name}
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
                          {!item.isLocked ? (
                            <span className="flex h-6 w-20 items-center justify-center rounded-xl bg-[var(--unlocked)] text-sm font-semibold text-[var(--text-main-reverse)]">
                              Upplåst
                            </span>
                          ) : (
                            <span className="flex h-6 w-20 items-center justify-center rounded-xl bg-[var(--locked)] text-sm font-semibold text-[var(--text-main-reverse)]">
                              Låst
                            </span>
                          )}
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
