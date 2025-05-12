"use client";

import { useEffect, useState } from "react";
import Input from "../components/input/Input";
import MultiDropdown from "../components/dropdowns/MultiDropdown";
import DeleteModal from "../components/modals/DeleteModal";
import { useNotification } from "../components/notification/NotificationProvider";
import CustomTooltip from "../components/customTooltip/CustomTooltip";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/20/solid";

import {
  LockClosedIcon,
  LockOpenIcon,
  TrashIcon,
  XMarkIcon,
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

type UserEditData = {
  username: string;
  name: string;
  email: string;
  password: string;
  roles: string[];
  isLocked: boolean;
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
  const [userEdits, setUserEdits] = useState<Record<number, UserEditData>>({});
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUserIds, setEditingUserIds] = useState<number[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [newUserRoles, setNewUserRoles] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(false);

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

  // Edit user.
  const editUser = (ids: number[]) => {
    if (editingUserIds.length > 0) {
      abortEditUser();
    }

    if (isAddingUser) {
      abortAddUser();
    }

    const selected = users.filter((u) => ids.includes(u.id));
    setEditingUserIds(ids);

    const initialEdits: Record<number, UserEditData> = {};
    selected.forEach((u) => {
      initialEdits[u.id] = {
        username: u.username,
        name: u.name,
        email: u.email,
        password: u.password,
        roles: u.roles,
        isLocked: u.isLocked,
      };
    });

    setUserEdits(initialEdits);
  };

  const updateUserEdit = (id: number, changes: Partial<UserEditData>) => {
    setUserEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...changes },
    }));
  };

  const finishEditUser = async () => {
    for (const id of editingUserIds) {
      const data = userEdits[id];

      try {
        const response = await fetch(`${apiUrl}/user-management/update/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
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
      } catch (err) {}
    }

    await fetchUsers(currentPage, usersPerPage, sortBy, sortOrder);
    abortEditUser();
    notify("success", "Användare uppdaterad!", 4000);
  };

  // Abort edit user.
  const abortEditUser = () => {
    setEditingUserIds([]);
    setSelectedUsers([]);
  };

  // Add new user.
  const addUser = () => {
    if (editingUserIds.length > 0) {
      abortEditUser();
    }

    setSelectedUsers([]);
    setIsAddingUser(true);
  };

  const finishAddUser = async () => {
    try {
      const response = await fetch(`${apiUrl}/user-management/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          name,
          password,
          email,
          roles: newUserRoles,
          isLocked,
        }),
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
      abortAddUser();
      notify("success", "Användare skapad!", 4000);
    } catch (err) {}
  };

  // Abort add user.
  const abortAddUser = () => {
    setIsAddingUser(false);
    setUsername("");
    setName("");
    setPassword("");
    setEmail("");
    setNewUserRoles([]);
    setIsLocked(false);
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
    } catch (err) {}
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
    "cursor-pointer border-2 border-t-0 border-[var(--border-main)] p-4 text-left transition-[background] duration-[var(--fast)] hover:bg-[var(--bg-grid-header-hover)]";

  let tdClass =
    "border-2 border-b-0 border-[var(--border-main)] p-4 text-left break-all";

  return (
    <>
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
          abortEditUser();
        }}
      />

      {/* Top container */}
      <div className="flex flex-col gap-3">
        {/* User editing buttons */}
        {!isAddingUser && editingUserIds.length === 0 ? (
          <div className="flex gap-3">
            {/* Add */}
            <CustomTooltip content="Lägg till användare" lgHidden={true}>
              <button
                className={`${buttonPrimaryClass} w-12 min-w-12 lg:w-56 lg:min-w-56`}
                onClick={addUser}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    addUser();
                  }
                }}
                tabIndex={0}
              >
                <div className="flex items-center justify-center gap-3 whitespace-nowrap">
                  <PlusIcon className="h-6" />
                  <span className="hidden lg:block">Lägg till användare</span>
                </div>
              </button>
            </CustomTooltip>

            {/* Edit */}
            <CustomTooltip
              content={
                selectedUsers.length === 0
                  ? "Välj en eller fler användare"
                  : `Redigera användare (${selectedUsers.length})`
              }
              lgHidden={selectedUsers.length > 0}
            >
              <button
                className={`${buttonSecondaryClass} w-12 min-w-12 lg:w-56 lg:min-w-56`}
                onClick={() => {
                  editUser(selectedUsers);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    addUser();
                  }
                }}
                tabIndex={0}
                disabled={selectedUsers.length === 0}
              >
                <div
                  className={`${selectedUsers.length > 0 ? "gap-1" : "gap-3"} flex items-center justify-center whitespace-nowrap`}
                >
                  <PencilSquareIcon className="h-6 min-h-6 w-6 min-w-6" />
                  <span className="hidden lg:block">
                    Redigera användare
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
        ) : isAddingUser ? (
          <div className="flex gap-3">
            {/* Add save */}
            <CustomTooltip content="Skapa ny användare" lgHidden={true}>
              <button
                className={`${buttonPrimaryClass} w-12 min-w-12 lg:w-56 lg:min-w-56`}
                onClick={finishAddUser}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    addUser();
                  }
                }}
                tabIndex={0}
              >
                <div className="flex items-center justify-center gap-3 whitespace-nowrap">
                  <CheckIcon className="h-6" />
                  <span className="hidden lg:block">Skapa ny användare</span>
                </div>
              </button>
            </CustomTooltip>

            {/* Add abort */}
            <CustomTooltip content="Ångra" lgHidden={true}>
              <button
                className={`${buttonSecondaryClass} w-12 min-w-12 lg:w-56 lg:min-w-56`}
                onClick={abortAddUser}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    addUser();
                  }
                }}
                tabIndex={0}
              >
                <div className="flex items-center justify-center gap-3 whitespace-nowrap">
                  <XMarkIcon className="h-6" />
                  <span className="hidden lg:block">Ångra</span>
                </div>
              </button>
            </CustomTooltip>
          </div>
        ) : (
          <div className="flex gap-3">
            {/* Edit save */}
            <CustomTooltip content="Spara användare" lgHidden={true}>
              <button
                className={`${buttonPrimaryClass} w-12 min-w-12 lg:w-56 lg:min-w-56`}
                onClick={finishEditUser}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    finishEditUser();
                  }
                }}
                tabIndex={0}
              >
                <div className="flex items-center justify-center gap-3 whitespace-nowrap">
                  <CheckIcon className="h-6" />
                  <span className="hidden lg:block">Spara användare</span>
                </div>
              </button>
            </CustomTooltip>

            {/* Edit abort */}
            <CustomTooltip content="Ångra" lgHidden={true}>
              <button
                className={`${buttonSecondaryClass} w-12 min-w-12 lg:w-56 lg:min-w-56`}
                onClick={abortEditUser}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    abortEditUser();
                  }
                }}
                tabIndex={0}
              >
                <div className="flex items-center justify-center gap-3 whitespace-nowrap">
                  <XMarkIcon className="h-6" />
                  <span className="hidden lg:block">Ångra</span>
                </div>
              </button>
            </CustomTooltip>

            {/* Edit delete */}
            <CustomTooltip content="Ta bort användare" lgHidden={true}>
              <button
                className={`${buttonDeleteSecondaryClass} ml-auto w-12 min-w-12 lg:w-56 lg:min-w-56`}
                onClick={() => toggleDeleteModal(selectedUsers)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    abortEditUser();
                  }
                }}
                tabIndex={0}
              >
                <div className="flex items-center justify-center gap-3 whitespace-nowrap">
                  <TrashIcon className="h-6" />
                  <span className="hidden lg:block">Ta bort användare</span>
                </div>
              </button>
            </CustomTooltip>
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="flex w-full items-center justify-start lg:min-w-128">
            <Input
              placeholder="Sök användare..."
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
          <div className="flex w-full flex-col items-end gap-3 whitespace-nowrap sm:flex-row sm:items-center sm:justify-end">
            <div className="flex items-center gap-3">
              Antal användare per sida:
              <div className="w-24">
                <SingleDropdown
                  options={[
                    { label: "5", value: "5" },
                    { label: "25", value: "25" },
                    { label: "100", value: "100" },
                  ]}
                  value={String(usersPerPage)}
                  onChange={(val) => setUsersPerPage(Number(val))}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`${buttonSecondaryClass} h-12 min-h-12 w-12 min-w-12`}
              >
                <ChevronLeftIcon />
              </button>
              {currentPage} av{" "}
              {Math.max(1, Math.ceil(filteredUsers.length / usersPerPage))}
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
                className={`${buttonSecondaryClass} h-12 min-h-12 w-12 min-w-12`}
              >
                <ChevronRightIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Users list */}
      <div className="mt-3 mb-3 flex w-full flex-col">
        <div className="flex w-full overflow-x-auto rounded border-2 border-[var(--border-main)]">
          <table className="w-full border-collapse">
            <thead
              className={`${!props.isConnected || isLoadingUsers ? "pointer-events-none" : ""} bg-[var(--bg-grid-header)]`}
            >
              <tr>
                <th className="w-12 min-w-12 border-2 border-t-0 border-l-0 border-[var(--border-main)] pt-3 pr-4 pb-3 pl-4">
                  <div className="flex items-center justify-center">
                    {isAddingUser || editingUserIds.length > 0 ? (
                      <Input
                        id="disabled"
                        type="checkbox"
                        checked={allSelected}
                      />
                    ) : (
                      <Input
                        type="checkbox"
                        checked={allSelected}
                        onChange={selectAllUsers}
                      />
                    )}
                  </div>
                </th>

                <CustomTooltip
                  content={
                    sortBy === "id"
                      ? sortOrder === "asc"
                        ? "Sortera ID fallande"
                        : "Sortera ID stigande"
                      : "Sortera ID stigande"
                  }
                >
                  <th
                    className={`${thClass} w-24 min-w-24`}
                    onClick={() => handleSort("id")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSort("id");
                      }
                    }}
                    tabIndex={0}
                    aria-sort={
                      sortBy === "id"
                        ? sortOrder === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <div className="flex items-center justify-between">
                      ID {getSortIcon("id")}
                    </div>
                  </th>
                </CustomTooltip>
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
                    className={`${thClass} sticky left-0 z-[1] max-w-48 min-w-48 bg-[var(--bg-grid-header)] after:absolute after:top-0 after:-right-0.5 after:h-full after:w-[2px] after:bg-[var(--border-main)] after:content-['']`}
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
                    <div className="flex items-center justify-between">
                      Användarnamn {getSortIcon("username")}
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
                    className={`${thClass} max-w-48 min-w-48`}
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
                    <div className="flex items-center justify-between">
                      Namn {getSortIcon("name")}
                    </div>
                  </th>
                </CustomTooltip>
                <th className="max-w-48 min-w-48 border-2 border-t-0 border-[var(--border-main)] pt-3 pr-4 pb-3 pl-4 text-left">
                  <div className="flex items-center justify-between">
                    Lösenord
                  </div>
                </th>
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
                    className={`${thClass} max-w-48 min-w-48`}
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
                    <div className="flex items-center justify-between">
                      Mejladress {getSortIcon("email")}
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
                    className={`${thClass} max-w-48 min-w-48`}
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
                    <div className="flex items-center justify-between">
                      Behörigheter {getSortIcon("roles")}
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
                    className={`${thClass} w-24 min-w-24 border-r-0`}
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
                    <div className="flex items-center justify-between">
                      <LockClosedIcon className="h-6 w-6" />
                      {getSortIcon("isLocked")}
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
                  {isAddingUser && (
                    <tr>
                      <td className={`${tdClass} w-12 min-w-12 border-l-0`}>
                        <Input id="disabled" type="checkbox" checked={true} />
                      </td>
                      <td className={`${tdClass} w-24 min-w-24`} />
                      <td
                        className={`${tdClass} sticky left-0 z-[1] max-w-48 min-w-48 bg-[var(--bg-main)] after:absolute after:top-0 after:-right-0.5 after:h-full after:w-[2px] after:bg-[var(--border-main)] after:content-['']`}
                      >
                        <div className="flex items-start">
                          <Input
                            value={username}
                            onChange={(val) => {
                              setUsername(String(val));
                            }}
                          />
                        </div>
                      </td>
                      <td className={`${tdClass} max-w-48 min-w-48`}>
                        <div className="flex items-start">
                          <Input
                            value={name}
                            onChange={(val) => {
                              setName(String(val));
                            }}
                          />
                        </div>
                      </td>
                      <td className={`${tdClass} max-w-48 min-w-48`}>
                        <div className="flex items-start">
                          <Input
                            value={password}
                            onChange={(val) => {
                              setPassword(String(val));
                            }}
                          />
                        </div>
                      </td>
                      <td className={`${tdClass} max-w-48 min-w-48`}>
                        <div className="flex w-full items-start">
                          <Input
                            value={email}
                            onChange={(val) => {
                              setEmail(String(val));
                            }}
                          />
                        </div>
                      </td>
                      <td className={`${tdClass} max-w-48 min-w-48`}>
                        <div className="flex items-start">
                          <MultiDropdown
                            options={[
                              { label: "Admin", value: "Admin" },
                              { label: "Developer", value: "Developer" },
                            ]}
                            value={newUserRoles}
                            onChange={setNewUserRoles}
                          />
                        </div>
                      </td>

                      <td className={`${tdClass} w-24 min-w-24 border-r-0`}>
                        <CustomTooltip
                          content={isLocked ? "Lås upp konto" : "Lås konto"}
                        >
                          <div className="flex items-center justify-center">
                            <Input
                              type="checkbox"
                              checked={isLocked}
                              onChange={(val) => {
                                setIsLocked(Boolean(val));
                              }}
                            />
                          </div>
                        </CustomTooltip>
                      </td>
                    </tr>
                  )}
                  {filteredUsers
                    .slice(
                      (currentPage - 1) * usersPerPage,
                      currentPage * usersPerPage,
                    )
                    .map((item) =>
                      editingUserIds.includes(item.id) ? (
                        <tr key={item.id}>
                          <td className={`${tdClass} w-12 min-w-12 border-l-0`}>
                            <div className="flex items-center justify-center">
                              <Input
                                id="disabled"
                                type="checkbox"
                                checked={selectedUsers.includes(item.id)}
                              />
                            </div>
                          </td>
                          <td className={`${tdClass} w-24 min-w-24`}>
                            <div className="flex items-start">{item.id}</div>
                          </td>
                          <td
                            className={`${tdClass} sticky left-0 z-[1] max-w-48 min-w-48 bg-[var(--bg-main)] after:absolute after:top-0 after:-right-0.5 after:h-full after:w-[2px] after:bg-[var(--border-main)] after:content-['']`}
                          >
                            <div className="flex items-start">
                              <Input
                                value={userEdits[item.id]?.username || ""}
                                onChange={(val) => {
                                  updateUserEdit(item.id, {
                                    username: String(val),
                                  });
                                }}
                              />
                            </div>
                          </td>
                          <td className={`${tdClass} max-w-48 min-w-48`}>
                            <div className="flex items-start">
                              <Input
                                value={userEdits[item.id]?.name || ""}
                                onChange={(val) => {
                                  updateUserEdit(item.id, {
                                    name: String(val),
                                  });
                                }}
                              />
                            </div>
                          </td>
                          <td className={`${tdClass} max-w-48 min-w-48`}>
                            <div className="flex items-start">
                              <Input
                                placeholder="************"
                                value={userEdits[item.id]?.password || ""}
                                onChange={(val) => {
                                  updateUserEdit(item.id, {
                                    password: String(val),
                                  });
                                }}
                              />
                            </div>
                          </td>
                          <td className={`${tdClass} max-w-48 min-w-48`}>
                            <div className="flex items-start">
                              <Input
                                value={userEdits[item.id]?.email || ""}
                                onChange={(val) => {
                                  updateUserEdit(item.id, {
                                    email: String(val),
                                  });
                                }}
                              />
                            </div>
                          </td>
                          <td className={`${tdClass} max-w-48 min-w-48`}>
                            <div className="flex items-start">
                              <MultiDropdown
                                options={[
                                  { label: "Admin", value: "Admin" },
                                  { label: "Developer", value: "Developer" },
                                ]}
                                value={userEdits[item.id]?.roles || []}
                                onChange={(val) => {
                                  updateUserEdit(item.id, { roles: val });
                                }}
                              />
                            </div>
                          </td>
                          <td className={`${tdClass} w-24 min-w-24 border-r-0`}>
                            <CustomTooltip
                              content={
                                userEdits[item.id]?.isLocked
                                  ? "Lås upp konto"
                                  : "Lås konto"
                              }
                            >
                              <div className="flex items-center justify-center">
                                <Input
                                  type="checkbox"
                                  checked={
                                    userEdits[item.id]?.isLocked || false
                                  }
                                  onChange={(val) => {
                                    updateUserEdit(item.id, {
                                      isLocked: Boolean(val),
                                    });
                                  }}
                                />
                              </div>
                            </CustomTooltip>
                          </td>
                        </tr>
                      ) : (
                        <tr key={item.id}>
                          <td className={`${tdClass} w-12 min-w-12 border-l-0`}>
                            <div className="flex items-center justify-center">
                              <div className="flex items-center justify-center">
                                {isAddingUser || editingUserIds.length > 0 ? (
                                  <Input
                                    id="disabled"
                                    type="checkbox"
                                    checked={selectedUsers.includes(item.id)}
                                  />
                                ) : (
                                  <Input
                                    type="checkbox"
                                    checked={selectedUsers.includes(item.id)}
                                    onChange={() => selectUser(item.id)}
                                  />
                                )}
                              </div>
                            </div>
                          </td>
                          <td className={`${tdClass} w-24 min-w-24`}>
                            <div className="flex items-start">{item.id}</div>
                          </td>
                          <td
                            className={`${tdClass} sticky left-0 z-[1] max-w-48 min-w-48 bg-[var(--bg-main)] after:absolute after:top-0 after:-right-0.5 after:h-full after:w-[2px] after:bg-[var(--border-main)] after:content-['']`}
                          >
                            <div className="flex items-start">
                              {item.username}
                            </div>
                          </td>
                          <td className={`${tdClass} max-w-48 min-w-48`}>
                            <div className="flex items-start">{item.name}</div>
                          </td>
                          <td className={`${tdClass} max-w-48 min-w-48`}>
                            <div className="flex items-start">************</div>
                          </td>
                          <td className={`${tdClass} max-w-48 min-w-48`}>
                            <div className="flex items-start">{item.email}</div>
                          </td>
                          <td className={`${tdClass} max-w-48 min-w-48`}>
                            <div className="flex items-start">
                              {(Array.isArray(item.roles)
                                ? item.roles
                                : [item.roles || ""]
                              ).join(", ")}
                            </div>
                          </td>
                          <td className={`${tdClass} w-24 min-w-24 border-r-0`}>
                            <div className="flex h-full w-full items-center justify-center">
                              {!item.isLocked ? (
                                <LockOpenIcon className="h-6 w-6 text-[var(--unlocked)]" />
                              ) : (
                                <LockClosedIcon className="h-6 w-6 text-[var(--locked)]" />
                              )}
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
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
          <span className="ml-1 font-semibold">Användarinformation</span>
        </div>
        {/* --- Meta data content --- */}
        <div
          className={`${selectedUsers.length === 0 || selectedUsers.length > 1 ? "items-center" : ""} flex max-h-96 min-h-96 rounded-b border-2 border-t-0 border-[var(--border-main)] p-6`}
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
