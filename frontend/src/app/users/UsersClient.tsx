"use client";

import { useEffect, useState } from "react";
import Input from "../components/input/Input";
import MultiDropdown from "../components/dropdowns/MultiDropdown";
import DeleteModal from "../components/modals/DeleteModal";
import { useNotification } from "../components/notification/NotificationProvider";
import CustomTooltip from "../components/customTooltip/CustomTooltip";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
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
} from "../styles/buttonClasses";
import Message from "../components/message/Message";
import SingleDropdown from "../components/dropdowns/SingleDropdown";
import UserModal from "../components/modals/UserModal";

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
};

type Props = {
  isConnected: boolean | null;
};

const UsersClient = (props: Props) => {
  // Authorization variables.
  const token = localStorage.getItem("token");

  // Backend variables.
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [sortBy, setSortBy] = useState<keyof User>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

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
    sortByField: keyof User,
    sortOrderField: "asc" | "desc",
    showLoading = true,
  ) => {
    try {
      if (showLoading) {
        setIsLoadingUsers(true);
      }

      const response = await fetch(
        `${apiUrl}/user-management?page=${page}&pageSize=${pageSize}&sortBy=${sortByField}&sortOrder=${sortOrderField}`,
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
      setUsers(Array.isArray(result) ? result : []);
      setTotalUsers(result.length);
    } catch (err) {
    } finally {
      if (showLoading) {
        setIsLoadingUsers(false);
      }
    }
  };

  // Fetch users every time page changes.
  useEffect(() => {
    fetchUsers(currentPage, usersPerPage, sortBy, sortOrder, false);
  }, [currentPage, usersPerPage]);

  // Go to page 1 when searching.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Handle sorting.
  const handleSort = (field: keyof User) => {
    const isSameField = field === sortBy;
    const newSortOrder = isSameField && sortOrder === "asc" ? "desc" : "asc";

    setSortBy(field);
    setSortOrder(newSortOrder);
    fetchUsers(currentPage, usersPerPage, field, newSortOrder, false);
  };

  // Change sorting icon.
  const getSortIcon = (field: keyof User) => {
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
  const filteredUsers = users.filter((user) =>
    [user.username, user.name, user.email].some((field) =>
      field.toLowerCase().includes(searchTerm),
    ),
  );

  const visibleUserIds = filteredUsers
    .slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage)
    .map((user) => user.id);

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

  // Pre-defined classes.
  let thClass =
    "pl-4 p-2 min-w-48 h-[38px] cursor-pointer border-2 border-t-0 border-[var(--border-secondary)] border-b-[var(--border-main)] text-left transition-[background] duration-[var(--fast)] hover:bg-[var(--bg-grid-header-hover)]";

  let tdClass =
    "py-2 px-4 min-w-48 h-[38px] border-2 border-b-0 border-[var(--border-secondary)] text-left break-all";

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

      {/* Top container */}
      <div className="flex flex-col gap-4">
        {/* User editing buttons */}
        <div className="flex gap-4">
          <CustomTooltip content="Lägg till ny användare" lgHidden={true}>
            <button
              className={`${buttonPrimaryClass} lg:w-56 lg:min-w-56`}
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
              <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                <PlusIcon className="h-6" />
                <span className="hidden lg:block">Lägg till ny användare</span>
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
              className={`${buttonSecondaryClass} lg:w-56 lg:min-w-56`}
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
              disabled={selectedUsers.length === 0 || selectedUsers.length > 1}
            >
              <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                <PencilSquareIcon className="h-6 min-h-6 w-6 min-w-6" />
                <span className="hidden lg:block">Redigera användare</span>
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
              <div className="flex items-center justify-center gap-2 whitespace-nowrap">
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

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="flex w-full items-center justify-start lg:min-w-128">
            <Input
              icon={<MagnifyingGlassIcon />}
              placeholder="Sök användare"
              value={searchTerm}
              onChange={(val) => setSearchTerm(String(val).toLowerCase())}
            />
          </div>
          {/* Filter:
          <div className="w-64 min-w-64">
            <MultiDropdown
              label="Behörigheter"
              options={[
                { label: "5", value: "5" },
                { label: "25", value: "25" },
                { label: "100", value: "100" },
              ]}
              value={String(usersPerPage)}
              onChange={(val) => setUsersPerPage(Number(val))}
            />
          </div>
          <div className="w-64 min-w-64">
            <MultiDropdown
              label="Behörigheter"
              options={[
                { label: "5", value: "5" },
                { label: "25", value: "25" },
                { label: "100", value: "100" },
              ]}
              value={String(usersPerPage)}
              onChange={(val) => setUsersPerPage(Number(val))}
            />
          </div> */}
        </div>

        {/* Pagination */}
        <div className="flex">
          <div className="flex w-full flex-col items-end gap-4 whitespace-nowrap sm:flex-row sm:items-center sm:justify-end">
            <div className="flex items-center gap-4">
              Antal användare per sida:
              <div className="w-20">
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
                      filteredUsers.length / newPageSize,
                    );
                    setUsersPerPage(newPageSize);

                    if (currentPage > newMaxPages) {
                      setCurrentPage(newMaxPages);
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`${buttonSecondaryClass}`}
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
              <span className="opacity-50">
                Sida {currentPage} av{" "}
                {Math.max(1, Math.ceil(filteredUsers.length / usersPerPage))}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((prev) =>
                    prev <
                    Math.max(1, Math.ceil(filteredUsers.length / usersPerPage))
                      ? prev + 1
                      : prev,
                  )
                }
                disabled={
                  currentPage >= Math.ceil(filteredUsers.length / usersPerPage)
                }
                className={`${buttonSecondaryClass}`}
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-end opacity-50">
          Visar {(currentPage - 1) * usersPerPage + 1}-
          {Math.min(currentPage * usersPerPage, filteredUsers.length)} av{" "}
          {filteredUsers.length}
        </div>
      </div>

      {/* Users list */}
      <div className="mt-2 mb-4 flex w-full flex-col">
        <div className="flex w-full overflow-x-auto rounded border-2 border-[var(--border-main)]">
          <table className="w-full table-fixed border-collapse">
            <thead
              className={`${!props.isConnected || isLoadingUsers ? "pointer-events-none" : ""} bg-[var(--bg-grid-header)]`}
            >
              <tr>
                <th className="w-10 min-w-10 border-2 border-t-0 border-l-0 border-[var(--border-secondary)] border-b-[var(--border-main)] p-2">
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
                    <div className="relative flex">
                      <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
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
                      <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
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
                      <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
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
                      <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
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
                      <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
                        Status
                      </span>
                      <span className="flex justify-end">
                        {getSortIcon("name")}
                      </span>
                    </div>
                  </th>
                </CustomTooltip>
              </tr>
            </thead>
            <tbody>
              {!props.isConnected ? (
                <tr>
                  <td colSpan={8} className="p-12">
                    <Message icon="server" content="server" />
                  </td>
                </tr>
              ) : isLoadingUsers ? (
                <tr>
                  <td colSpan={8} className="p-12">
                    <Message icon="loading" content="Hämtar användare..." />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12">
                    <Message content="Det finns inga användare." />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12">
                    <Message
                      icon="search"
                      content="Inga användare kunde hittas med det sökkriteriet."
                    />
                  </td>
                </tr>
              ) : (
                <>
                  {filteredUsers
                    .slice(
                      (currentPage - 1) * usersPerPage,
                      currentPage * usersPerPage,
                    )
                    .map((item, index) => {
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
                            <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                              {item.username}
                            </div>
                          </td>
                          <td className={`${tdClass} hidden sm:table-cell`}>
                            <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                              {item.name}
                            </div>
                          </td>
                          <td className={`${tdClass} hidden lg:table-cell`}>
                            <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                              {item.email}
                            </div>
                          </td>
                          <td className={`${tdClass} hidden xl:table-cell`}>
                            <div className="overflow-hidden text-ellipsis whitespace-nowrap">
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

      {/* Meta data section */}
      <div className="flex w-full flex-col">
        {/* --- Meta data header --- */}
        <div className="flex rounded-t border-2 border-[var(--border-main)] bg-[var(--bg-grid-header)] p-2">
          <span className="font-semibold">Användarinformation</span>
        </div>
        {/* --- Meta data content --- */}
        <div
          className={`${selectedUsers.length === 0 || selectedUsers.length > 1 ? "items-center" : ""} flex max-h-96 min-h-80 rounded-b border-2 border-t-0 border-[var(--border-main)] p-4`}
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
            <div className="flex flex-col gap-2">
              {users
                .filter((u) => u.id === selectedUsers[0])
                .map((user) => (
                  <div key={user.id}>
                    <p>
                      <strong>Användarnamn: </strong>
                      {user.username}
                    </p>
                    <p>
                      <strong>Status: </strong>
                      {user.isOnline ? (
                        <span className="text-[var(--unlocked)]">Online</span>
                      ) : (
                        <span className="text-[var(--locked)]">Offline</span>
                      )}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UsersClient;
