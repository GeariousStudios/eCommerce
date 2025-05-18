"use client";

import { useEffect, useRef, useState } from "react";
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

type User = {
  id: number;
  username: string;
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

type Props = {
  isConnected: boolean | null;
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
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [totalCounts, setTotalCounts] = useState<{
    admins: number;
    developers: number;
    locked: number;
    unlocked: number;
  } | null>(null);

  // Add/edit variables.
  const [users, setUsers] = useState<User[]>([]);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Delete variables.
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUserIds, setDeletingUserIds] = useState<number[]>([]);

  // Pagination and search variables.
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(5);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Other.
  const { notify } = useNotification();

  // Filter states and refs.
  const filterRolesRef = useRef<HTMLButtonElement>(null);
  const filterStatusRef = useRef<HTMLButtonElement>(null);

  const [filterRolesOpen, setFilterRolesOpen] = useState(false);
  const [filterStatusOpen, setFilterStatusOpen] = useState(false);

  const [showAdmins, setShowAdmins] = useState(false);
  const [showDevelopers, setShowDevelopers] = useState(false);
  const [showLocked, setShowLocked] = useState(false);
  const [showUnlocked, setShowUnlocked] = useState(false);

  // Modal before deletion.
  const toggleDeleteModal = (userIds: number[] = []) => {
    setDeletingUserIds(userIds);
    setIsDeleteModalOpen((prev) => !prev);
  };

  // Modal for user editing/adding.
  const openUserModal = (userId: number | null = null) => {
    setEditingUserId(userId);
    setIsUserModalOpen(true);
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setEditingUserId(null);
  };

  // Fetch all users.
  const fetchUsers = async (
    page: number,
    pageSize: number,
    sortByField: string,
    sortOrderField: "asc" | "desc",
    showLoading = true,
  ) => {
    try {
      if (showLoading) {
        setIsLoadingUsers(true);
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
      setUsers(Array.isArray(result.items) ? result.items : []);
      setTotalUsers(result.totalCount ?? 0);
      setTotalCounts(result.counts ?? null);
    } catch (err) {
    } finally {
      if (showLoading) {
        setIsLoadingUsers(false);
      }
    }
  };

  // Fetch users every time page changes.
  useEffect(() => {
    fetchUsers(currentPage, usersPerPage, sortBy, sortOrder);
  }, [
    currentPage,
    usersPerPage,
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
    fetchUsers(currentPage, usersPerPage, field, newSortOrder, false);
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

  // Delete user.
  const finishDeleteUser = async (id: number) => {
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

      await fetchUsers(currentPage, usersPerPage, sortBy, sortOrder);
      notify("success", "Användare borttagen!", 4000);
    } catch (err) {
      notify("error", String(err));
    }
  };

  // Select users.
  const visibleUserIds = users.map((user) => user.id);

  const allSelected =
    visibleUserIds.length > 0 &&
    visibleUserIds.every((id) => selectedUsers.includes(id));

  const selectUser = (userId: number) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const selectAllUsers = () => {
    if (allSelected) {
      setSelectedUsers(
        selectedUsers.filter((id) => !visibleUserIds.includes(id)),
      );
    } else {
      setSelectedUsers([...new Set([...selectedUsers, ...visibleUserIds])]);
    }
  };

  // Close all menu dropdowns.
  const closeAllMenus = () => {
    setFilterRolesOpen(false);
    setFilterStatusOpen(false);
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

  // Pre-defined classes.
  let thClass =
    "pl-4 p-2 min-w-48 h-[40px] cursor-pointer border-1 border-t-0 border-[var(--border-secondary)] border-b-[var(--border-main)] text-left transition-[background] duration-[var(--fast)] hover:bg-[var(--bg-grid-header-hover)]";

  let tdClass =
    "py-2 px-4 min-w-48 h-[40px] border-1 border-b-0 border-[var(--border-secondary)] text-left break-all";

  let filterClass =
    "truncate font-semibold transition-colors duration-[var(--fast)] group-hover:text-[var(--accent-color)]";

  let filterIconClass =
    "h-6 w-6 transition-[color,rotate] duration-[var(--fast)] group-hover:text-[var(--accent-color)]";

  return (
    <>
      <UserModal
        isOpen={isUserModalOpen}
        onClose={closeUserModal}
        userId={editingUserId}
        onUserUpdated={() => {
          fetchUsers(currentPage, usersPerPage, sortBy, sortOrder);
        }}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          toggleDeleteModal();
          setDeletingUserIds([]);
        }}
        onConfirm={async () => {
          for (const id of deletingUserIds) {
            await finishDeleteUser(id);
          }

          setIsDeleteModalOpen(false);
          setDeletingUserIds([]);
          setSelectedUsers([]);
        }}
      />

      <div className="flex flex-col gap-4">
        {/* Top container */}
        <div className="flex flex-col gap-4">
          {/* User editing buttons */}
          <div className="flex gap-4">
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

            {/* Edit */}
            <CustomTooltip
              content={
                selectedUsers.length === 0
                  ? "Välj en användare"
                  : selectedUsers.length === 1
                    ? "Redigera användare"
                    : "Du kan bara redigera en användare i taget!"
              }
              lgHidden={selectedUsers.length === 1}
            >
              <button
                className={`${buttonSecondaryClass} sm:w-56 sm:min-w-56`}
                onClick={() => {
                  openUserModal(selectedUsers[0]);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openUserModal(selectedUsers[0]);
                  }
                }}
                tabIndex={0}
                disabled={
                  selectedUsers.length === 0 || selectedUsers.length > 1
                }
              >
                <div className="flex items-center justify-center gap-2 truncate">
                  <PencilSquareIcon className="h-6 min-h-6 w-6 min-w-6" />
                  <span className="hidden sm:block">Redigera användare</span>
                </div>
              </button>
            </CustomTooltip>

            <CustomTooltip
              content={
                selectedUsers.length === 0
                  ? "Välj en eller fler användare"
                  : `Ta bort användare (${selectedUsers.length})`
              }
              lgHidden={selectedUsers.length > 0}
            >
              <button
                className={`${buttonDeleteSecondaryClass} ml-auto lg:w-56 lg:min-w-56`}
                onClick={() => toggleDeleteModal(selectedUsers)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleDeleteModal(selectedUsers);
                  }
                }}
                tabIndex={0}
                disabled={selectedUsers.length === 0}
              >
                <div className="flex items-center justify-center gap-2 truncate">
                  <TrashIcon className="h-6" />
                  <span className="hidden lg:block">
                    Ta bort användare
                    <span>
                      {selectedUsers.length > 0
                        ? ` (${selectedUsers.length})`
                        : ""}
                    </span>
                  </span>
                </div>
              </button>
            </CustomTooltip>
          </div>

          {/* Search and filter section */}
          <div className="flex justify-between gap-4">
            {/* Search */}
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

            {/* Filters */}
            <div className="flex gap-4">
              {/* Roles filter */}
              <div className="relative hidden sm:flex">
                <button
                  ref={filterRolesRef}
                  className={`${roundedButtonClass} group w-auto gap-2 px-4`}
                  onClick={() => {
                    closeAllMenus();
                    setFilterRolesOpen(!filterRolesOpen);
                  }}
                >
                  <span
                    className={`${filterClass} ${filterRolesOpen ? "text-[var(--accent-color)]" : ""}`}
                  >
                    Behörigheter
                  </span>
                  <ChevronDownIcon
                    className={`${filterIconClass} ${filterRolesOpen ? "rotate-180 text-[var(--accent-color)]" : ""}`}
                  />
                </button>
                <MenuDropdown
                  triggerRef={filterRolesRef}
                  isOpen={filterRolesOpen}
                  onClose={() => setFilterRolesOpen(false)}
                  content={
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between">
                        <Input
                          type="checkbox"
                          checked={showAdmins}
                          onChange={() => {
                            setShowAdmins((prev) => !prev);
                          }}
                          label="Admin"
                        />
                        <span>{totalCounts?.admins ?? 0}</span>
                      </div>

                      <div className="flex justify-between">
                        <Input
                          type="checkbox"
                          checked={showDevelopers}
                          onChange={() => {
                            setShowDevelopers((prev) => !prev);
                          }}
                          label="Developer"
                        />
                        <span>
                          {<span>{totalCounts?.developers ?? 0}</span>}
                        </span>
                      </div>
                    </div>
                  }
                />
              </div>

              {/* Status filter */}
              <div className="relative hidden md:flex">
                <button
                  ref={filterStatusRef}
                  className={`${roundedButtonClass} group w-auto gap-2 px-4`}
                  onClick={() => {
                    closeAllMenus();
                    setFilterStatusOpen(!filterStatusOpen);
                  }}
                >
                  <span
                    className={`${filterClass} ${filterStatusOpen ? "text-[var(--accent-color)]" : ""}`}
                  >
                    Status
                  </span>
                  <ChevronDownIcon
                    className={`${filterIconClass} ${filterStatusOpen ? "rotate-180 text-[var(--accent-color)]" : ""}`}
                  />
                </button>
                <MenuDropdown
                  triggerRef={filterStatusRef}
                  isOpen={filterStatusOpen}
                  onClose={() => setFilterStatusOpen(false)}
                  content={
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between">
                        <Input
                          type="checkbox"
                          checked={showLocked}
                          onChange={() => {
                            setShowLocked((prev) => !prev);
                          }}
                          label="Låst"
                        />
                        <span>
                          <span>{totalCounts?.locked ?? 0}</span>
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <Input
                          type="checkbox"
                          checked={showUnlocked}
                          onChange={() => {
                            setShowUnlocked((prev) => !prev);
                          }}
                          label="Upplåst"
                        />
                        <span>
                          <span>{totalCounts?.unlocked ?? 0}</span>
                        </span>
                      </div>
                    </div>
                  }
                />
              </div>

              {/* All filters */}
              <div className="relative flex md:hidden">
                <button
                  className={`${roundedButtonClass} group xs:w-auto xs:px-4 gap-2`}
                  onClick={() => {
                    closeAllMenus();
                  }}
                >
                  <span className={`${filterClass} xs:flex hidden`}>
                    Alla filter
                  </span>
                  <AdjustmentsHorizontalIcon className={`${filterIconClass}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Active filters */}
          <div className="flex flex-wrap gap-4">
            {showAdmins && (
              <button
                className={`${roundedButtonClass} group w-auto gap-2 px-4`}
                onClick={() => {
                  setShowAdmins(false);
                }}
              >
                <span className={`${filterClass}`}>Admin</span>
                <XMarkIcon className={`${filterIconClass}`} />
              </button>
            )}

            {showDevelopers && (
              <button
                className={`${roundedButtonClass} group w-auto gap-2 px-4`}
                onClick={() => {
                  setShowDevelopers(false);
                }}
              >
                <span className={`${filterClass}`}>Developer</span>
                <XMarkIcon className={`${filterIconClass}`} />
              </button>
            )}

            {showLocked && (
              <button
                className={`${roundedButtonClass} group w-auto gap-2 px-4`}
                onClick={() => {
                  setShowLocked(false);
                }}
              >
                <span className={`${filterClass}`}>Låst</span>
                <XMarkIcon className={`${filterIconClass}`} />
              </button>
            )}

            {showUnlocked && (
              <button
                className={`${roundedButtonClass} group w-auto gap-2 px-4`}
                onClick={() => {
                  setShowUnlocked(false);
                }}
              >
                <span className={`${filterClass}`}>Upplåst</span>
                <XMarkIcon className={`${filterIconClass}`} />
              </button>
            )}

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

          {/* Showing info */}
          <span className="-mb-2 flex items-end text-[var(--text-secondary)]">
            Visar {(currentPage - 1) * usersPerPage + 1}-
            {Math.min(currentPage * usersPerPage, totalUsers ?? 0)} av{" "}
            {totalUsers ?? 0}
          </span>
        </div>

        {/* Users list */}
        <div className="flex w-full flex-col">
          <div className="flex w-full overflow-x-auto rounded border-1 border-[var(--border-main)]">
            <table className="w-full table-fixed border-collapse">
              <thead
                className={`${!props.isConnected || isLoadingUsers ? "pointer-events-none" : ""} bg-[var(--bg-grid-header)]`}
              >
                <tr>
                  <th className="w-10 min-w-10 border-1 border-t-0 border-l-0 border-[var(--border-secondary)] border-b-[var(--border-main)] p-2">
                    <div className="flex items-center justify-center">
                      <Input
                        type="checkbox"
                        checked={allSelected}
                        onChange={selectAllUsers}
                      />
                    </div>
                  </th>
                  <CustomTooltip
                    content={
                      sortBy === "username"
                        ? sortOrder === "asc"
                          ? "Sortera användarnamn Ö-A"
                          : "Sortera användarnamn A-Ö"
                        : "Sortera användarnamn A-Ö"
                    }
                  >
                    <th
                      className={`${thClass}`}
                      onClick={() => handleSort("username")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSort("username");
                        }
                      }}
                      tabIndex={0}
                      aria-sort={
                        sortBy === "username"
                          ? sortOrder === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <div className="relative flex gap-2">
                        <span className="w-full truncate overflow-hidden text-ellipsis">
                          Användarnamn
                        </span>
                        <span className="flex">{getSortIcon("username")}</span>
                      </div>
                    </th>
                  </CustomTooltip>
                  <CustomTooltip
                    content={
                      sortBy === "name"
                        ? sortOrder === "asc"
                          ? "Sortera namn Ö-A"
                          : "Sortera namn A-Ö"
                        : "Sortera namn A-Ö"
                    }
                  >
                    <th
                      className={`${thClass} hidden sm:table-cell`}
                      onClick={() => handleSort("name")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSort("name");
                        }
                      }}
                      tabIndex={0}
                      aria-sort={
                        sortBy === "name"
                          ? sortOrder === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <div className="relative flex">
                        <span className="w-full truncate overflow-hidden text-ellipsis">
                          Namn
                        </span>
                        <span className="flex justify-end">
                          {getSortIcon("name")}
                        </span>
                      </div>
                    </th>
                  </CustomTooltip>
                  <CustomTooltip
                    content={
                      sortBy === "email"
                        ? sortOrder === "asc"
                          ? "Sortera mejladress Ö-A"
                          : "Sortera mejladress A-Ö"
                        : "Sortera mejladress A-Ö"
                    }
                  >
                    <th
                      className={`${thClass} hidden lg:table-cell`}
                      onClick={() => handleSort("email")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSort("email");
                        }
                      }}
                      tabIndex={0}
                      aria-sort={
                        sortBy === "email"
                          ? sortOrder === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <div className="relative flex">
                        <span className="w-full truncate overflow-hidden text-ellipsis">
                          Mejladress
                        </span>
                        <span className="flex justify-end">
                          {getSortIcon("email")}
                        </span>
                      </div>
                    </th>
                  </CustomTooltip>
                  <CustomTooltip
                    content={
                      sortBy === "roles"
                        ? sortOrder === "asc"
                          ? "Sortera behörigheter Ö-A"
                          : "Sortera behörigheter A-Ö"
                        : "Sortera behörigheter A-Ö"
                    }
                  >
                    <th
                      className={`${thClass} hidden xl:table-cell`}
                      onClick={() => handleSort("roles")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSort("roles");
                        }
                      }}
                      tabIndex={0}
                      aria-sort={
                        sortBy === "roles"
                          ? sortOrder === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <div className="relative flex">
                        <span className="w-full truncate overflow-hidden text-ellipsis">
                          Behörigheter
                        </span>
                        <span className="flex justify-end">
                          {getSortIcon("roles")}
                        </span>
                      </div>
                    </th>
                  </CustomTooltip>
                  <CustomTooltip
                    content={
                      sortBy === "isLocked"
                        ? sortOrder === "asc"
                          ? "Sortera låsta konton"
                          : "Sortera upplåsta konton"
                        : "Sortera upplåsta konton"
                    }
                  >
                    <th
                      className={`${thClass} w-28 min-w-28 border-r-0`}
                      onClick={() => handleSort("isLocked")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSort("isLocked");
                        }
                      }}
                      tabIndex={0}
                      aria-sort={
                        sortBy === "isLocked"
                          ? sortOrder === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <div className="relative flex">
                        <span className="w-full truncate overflow-hidden text-ellipsis">
                          Status
                        </span>
                        <span className="flex justify-end">
                          {getSortIcon("isLocked")}
                        </span>
                      </div>
                    </th>
                  </CustomTooltip>
                </tr>
              </thead>
              <tbody>
                {!props.isConnected ? (
                  <tr>
                    <td colSpan={colSpan} className="h-57">
                      <Message icon="server" content="server" />
                    </td>
                  </tr>
                ) : isLoadingUsers ? (
                  <>
                    {Array.from({
                      length: Math.min(
                        usersPerPage,
                        totalUsers ?? usersPerPage,
                      ),
                    }).map((_, i) => (
                      <tr key={`loading-${i}`} className="bg-[var(--bg-grid)]">
                        <td colSpan={colSpan} className="h-[40px]">
                          {i ===
                            Math.floor(
                              Math.min(
                                usersPerPage,
                                totalUsers ?? usersPerPage,
                              ) / 2,
                            ) && (
                            <div className="flex h-[40px]">
                              <Message
                                icon="loading"
                                content="Hämtar användare..."
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </>
                ) : users.length === 0 ? (
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
                    {users.map((item, index) => {
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
                                  checked={selectedUsers.includes(item.id)}
                                  onChange={() => selectUser(item.id)}
                                />
                              </div>
                            </div>
                          </td>
                          <td className={`${tdClass}`}>
                            <div className="truncate overflow-hidden text-ellipsis">
                              {item.username}
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
                value={String(usersPerPage)}
                onChange={(val) => {
                  const newPageSize = Number(val);
                  const newMaxPages = Math.ceil(
                    (totalUsers ?? 0) / newPageSize,
                  );
                  setUsersPerPage(newPageSize);

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
                {Math.max(1, Math.ceil((totalUsers ?? 0) / usersPerPage))}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((prev) =>
                    prev <
                    Math.max(1, Math.ceil((totalUsers ?? 0) / usersPerPage))
                      ? prev + 1
                      : prev,
                  )
                }
                disabled={
                  currentPage >= Math.ceil((totalUsers ?? 0) / usersPerPage)
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
          {/* --- Meta data content --- */}
          <div
            className={`${selectedUsers.length === 0 || selectedUsers.length > 1 ? "items-center" : ""} flex max-h-96 min-h-80 rounded-b border-1 border-t-0 border-[var(--border-main)] p-4`}
          >
            {selectedUsers.length === 0 ? (
              <Message
                icon="user"
                content="Här kan du se information om vald användare. Välj en i tabellen ovan!"
              />
            ) : selectedUsers.length > 1 ? (
              <Message
                icon="beware"
                content="Kan inte visa information om flera användare samtidigt."
              />
            ) : (
              <div className="flex">
                {users
                  .filter((u) => u.id === selectedUsers[0])
                  .map((user) => (
                    <div key={user.id} className="flex flex-col gap-8">
                      <div>
                        {user.isOnline ? (
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
                          {user.username}
                        </p>

                        <p>
                          <strong>Namn: </strong>
                          {user.name}
                        </p>

                        <p>
                          <strong>Mejladress: </strong>
                          {user.email}
                        </p>

                        <p className="flex">
                          <strong>Behörigheter:&nbsp;</strong>
                          {user.roles.map((role, i) => (
                            <span key={i}>
                              {role}
                              {i < user.roles.length - 1 ? ",\u00A0" : ""}
                            </span>
                          ))}
                        </p>

                        <div className="mt-2">
                          {!user.isLocked ? (
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
                          {user.lastLogin
                            ? new Date(user.lastLogin).toLocaleString()
                            : "Aldrig"}
                        </p>

                        <p>
                          <strong>Konto skapat: </strong>
                          {new Date(user.creationDate).toLocaleString()}
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
