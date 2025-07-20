"use client";

import { useToast } from "../../../components/toast/ToastProvider";
import useManage from "@/app/hooks/useManage";
import { UserFilters, UserItem } from "@/app/types/manageTypes"; // <-- Unique.
import { deleteContent, fetchContent } from "@/app/apis/manage/usersApi"; // <-- Unique.
import ManageBase from "@/app/components/manage/ManageBase";
import UserModal from "@/app/components/modals/developer/UserModal"; // <-- Unique.
import DeleteModal from "@/app/components/modals/DeleteModal";
import { badgeClass } from "@/app/components/manage/ManageClasses";
import { LockClosedIcon, WifiIcon } from "@heroicons/react/20/solid";
import CustomTooltip from "@/app/components/common/CustomTooltip";

type Props = {
  isConnected: boolean | null;
};

const UsersClient = (props: Props) => {
  // <--- Unique.
  // --- VARIABLES ---
  const {
    // --- Items ---
    items,
    setItems,
    selectedItems,
    setSelectedItems,

    editingItemId,
    setEditingItemId,
    isEditModalOpen,
    setIsEditModalOpen,

    deletingItemIds,
    setDeletingItemIds,
    isDeleteModalOpen,
    setIsDeleteModalOpen,

    // --- Loading ---
    isLoading,
    setIsLoading,

    // --- Pagination ---
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
    setTotalItems,

    // --- Sorting ---
    sortBy,
    sortOrder,
    handleSort,

    // --- Search & Filtering ---
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    counts,
    setCounts,
    isGrid,
    setIsGrid,

    // --- Other ---
    fetchItems,
  } = useManage<UserItem, UserFilters>(
    async (params) => {
      // <-- Unique.
      try {
        const result = await fetchContent(params);
        return {
          items: result.items,
          total: result.total,
          counts: result.counts,
        };
      } catch (err: any) {
        notify("error", err.message || "Kunde inte hämta användare"); // <-- Unique
        return {
          items: [],
          total: 0,
          counts: {},
        };
      } finally {
        setIsLoading(false);
      }
    },
    { initialSortBy: "roles", initialSortOrder: "asc" },
  );

  const { notify } = useToast();

  // --- TOGGLE MODAL(S) ---
  // --- Delete ---
  const toggleDeleteItemModal = (itemIds: number[] = []) => {
    setDeletingItemIds(itemIds);
    setIsDeleteModalOpen((prev) => !prev);
  };

  // --- Edit ---
  const toggleEditItemModal = (itemId: number | null = null) => {
    setEditingItemId(itemId);
    setIsEditModalOpen((prev) => !prev);
  };

  // --- Delete item(s)
  const finishDeleteContent = async (id: number) => {
    try {
      await deleteContent(id);
      await fetchItems();
      notify("success", "Användare borttagen!", 4000); // <-- Unique.
    } catch (err: any) {
      notify("error", err?.message || String(err));
    }
  };

  // --- Grid Items (Unique) ---
  const gridItems = () => [
    {
      key: "username, firstName, lastName, roles, isOnline",
      getValue: (item: UserItem) => (
        <div className="flex flex-col gap-4 rounded-2xl bg-[var(--bg-grid-header)] p-4">
          <div className="flex flex-col">
            <span className="flex items-center justify-between text-2xl font-bold">
              <span className="flex items-center gap-2">
                {item.username}{" "}
                {item.isLocked && (
                  <CustomTooltip content="Detta konto är låst!" showOnTouch>
                    <LockClosedIcon className="h-5 w-5 cursor-help text-[var(--locked)]" />
                  </CustomTooltip>
                )}
              </span>
              <CustomTooltip
                content={
                  <span>
                    <span className="font-extrabold">{item.username}</span>{" "}
                    {item.isOnline ? "är online" : "är offline"}
                  </span>
                }
                showOnTouch
              >
                <WifiIcon
                  className={`${!item.isOnline && "opacity-20"} h-5 w-5 cursor-help`}
                />
              </CustomTooltip>
            </span>
            <span>
              {item.firstName} {item.lastName}
            </span>
            <span>{item.email?.trim() ? item.email : null}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">Behörigheter:</span>
            {item.roles.map((role, i) => (
              <span
                key={i}
                className={`${badgeClass} ${role === "Admin" ? "bg-[var(--badge-one)]" : role === "Developer" ? "bg-[var(--badge-two)]" : role === "Reporter" ? "bg-[var(--badge-three)]" : role === "Master" ? "bg-[var(--badge-four)]" : "bg-[var(--accent-color)] text-[var(--text-main-reverse)]"} `}
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: "creationDate",
      getValue: (item: UserItem) => (
        <p className="flex flex-col">
          <span className="font-semibold">Konto skapat: </span>
          {new Date(item.creationDate).toLocaleString("sv-SE", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      ),
    },
    {
      key: "lastLogin",
      getValue: (item: UserItem) => (
        <p className="flex flex-col">
          <span className="font-semibold">Senast inloggad: </span>
          {item.lastLogin
            ? new Date(item.lastLogin).toLocaleString("sv-SE", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-"}
        </p>
      ),
    },
  ];

  // --- Table Items (Unique) ---
  const tableItems = () => [
    {
      key: "username",
      label: "Användarnamn",
      sortingItem: "username",
      labelAsc: "användarnamn Ö-A",
      labelDesc: "användarnamn A-Ö",
      getValue: (item: UserItem) => item.username,
      responsivePriority: 0,
    },
    {
      key: "firstName",
      label: "Förnamn",
      sortingItem: "firstName",
      labelAsc: "förnamn Ö-A",
      labelDesc: "förnamn A-Ö",
      getValue: (item: UserItem) => item.firstName,
      responsivePriority: 2,
    },
    {
      key: "lastName",
      label: "Efternamn",
      sortingItem: "lastName",
      labelAsc: "efternamn Ö-A",
      labelDesc: "efternamn A-Ö",
      getValue: (item: UserItem) => item.lastName,
      responsivePriority: 3,
    },
    {
      key: "email",
      label: "Mejladress",
      sortingItem: "email",
      labelAsc: "mejladress Ö-A",
      labelDesc: "mejladress A-Ö",
      getValue: (item: UserItem) => item.email,
      responsivePriority: 4,
    },
    {
      key: "roles",
      label: "Behörigheter",
      sortingItem: "roles",
      labelAsc: "behörigheter Ö-A",
      labelDesc: "behörigheter A-Ö",
      getValue: (item: UserItem) => (
        <div className="flex flex-wrap gap-2">
          {item.roles.map((role, i) => (
            <span
              key={i}
              className={`${badgeClass} ${role === "Admin" ? "bg-[var(--badge-one)]" : role === "Developer" ? "bg-[var(--badge-two)]" : role === "Reporter" ? "bg-[var(--badge-three)]" : role === "Master" ? "bg-[var(--badge-four)]" : "bg-[var(--accent-color)] text-[var(--text-main-reverse)]"} `}
            >
              {role}
            </span>
          ))}
        </div>
      ),
      responsivePriority: 1,
    },
    {
      key: "isLocked",
      label: "Status",
      sortingItem: "status",
      labelAsc: "låsta konton",
      labelDesc: "upplåsta konton",
      classNameAddition: "w-[100px] min-w-[100px]",
      childClassNameAddition: "w-[72px] min-w-[72px]",
      getValue: (item: UserItem) => (
        <span
          className={`${badgeClass} ${item.isLocked ? "bg-[var(--locked)]" : "bg-[var(--unlocked)]"} w-full text-[var(--text-main-reverse)]`}
        >
          {item.isLocked ? "Låst" : "Upplåst"}
        </span>
      ),
      responsivePriority: 5,
    },
  ];

  // --- Filter Controls (Unique) ---
  const filterControls = {
    showAdmins: filters.roles?.includes("Admin") ?? false,
    setShowAdmins: (val: boolean) => {
      setFilters((prev) => {
        const prevRoles = prev.roles ?? [];
        const roles = val
          ? Array.from(new Set([...prevRoles, "Admin"]))
          : prevRoles.filter((r) => r !== "Admin");
        return { ...prev, roles };
      });
    },

    showDevelopers: filters.roles?.includes("Developer") ?? false,
    setShowDevelopers: (val: boolean) => {
      setFilters((prev) => {
        const prevRoles = prev.roles ?? [];
        const roles = val
          ? Array.from(new Set([...prevRoles, "Developer"]))
          : prevRoles.filter((r) => r !== "Developer");
        return { ...prev, roles };
      });
    },

    showReporters: filters.roles?.includes("Reporter") ?? false,
    setShowReporters: (val: boolean) => {
      setFilters((prev) => {
        const prevRoles = prev.roles ?? [];
        const roles = val
          ? Array.from(new Set([...prevRoles, "Reporter"]))
          : prevRoles.filter((r) => r !== "Reporter");
        return { ...prev, roles };
      });
    },

    showLocked: filters.isLocked === true,
    setShowLocked: (val: boolean) => {
      setFilters((prev) => ({ ...prev, isLocked: val ? true : undefined }));
    },

    showUnlocked: filters.isLocked === false,
    setShowUnlocked: (val: boolean) => {
      setFilters((prev) => ({ ...prev, isLocked: val ? false : undefined }));
    },
  };

  // --- Filter List (Unique)
  const filterList = () => [
    {
      label: "Behörigheter",
      breakpoint: "ml",
      options: [
        {
          label: "Admin",
          isSelected: filterControls.showAdmins,
          setSelected: filterControls.setShowAdmins,
          count: counts?.adminCount,
        },
        {
          label: "Developer",
          isSelected: filterControls.showDevelopers,
          setSelected: filterControls.setShowDevelopers,
          count: counts?.developerCount,
        },
        {
          label: "Reporter",
          isSelected: filterControls.showReporters,
          setSelected: filterControls.setShowReporters,
          count: counts?.reporterCount,
        },
      ],
    },
    {
      label: "Status",
      breakpoint: "lg",
      options: [
        {
          label: "Låsta konton",
          isSelected: filterControls.showLocked,
          setSelected: filterControls.setShowLocked,
          count: counts?.status?.["Locked"] ?? 0,
        },
        {
          label: "Upplåsta konton",
          isSelected: filterControls.showUnlocked,
          setSelected: filterControls.setShowUnlocked,
          count: counts?.status?.["Unlocked"] ?? 0,
        },
      ],
    },
  ];

  return (
    <>
      <ManageBase<UserItem> // <-- Unique.
        itemName="användare" // <-- Unique.
        items={items}
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        toggleEditItemModal={toggleEditItemModal}
        toggleDeleteItemModal={toggleDeleteItemModal}
        isLoading={isLoading}
        isConnected={props.isConnected === true}
        isGrid={isGrid}
        setIsGrid={setIsGrid}
        gridItems={gridItems()}
        tableItems={tableItems()}
        showCheckbox={true}
        showInfoButton={false}
        getIsDisabled={(item) => item.roles?.includes("Master") ?? false} // <-- Unique.
        pagination={{
          currentPage,
          setCurrentPage,
          itemsPerPage,
          setItemsPerPage,
          totalItems: totalItems ?? 0,
        }}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        searchTerm={searchTerm}
        onSearchChange={(val) => setSearchTerm(val)}
        filters={filterList()}
      />

      {/* --- MODALS --- */}
      <UserModal // <-- Unique.
        isOpen={isEditModalOpen}
        onClose={toggleEditItemModal}
        itemId={editingItemId}
        onItemUpdated={() => {
          fetchItems();
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
            await finishDeleteContent(id);
          }

          setIsDeleteModalOpen(false);
          setDeletingItemIds([]);
          setSelectedItems([]);
        }}
      />
    </>
  );
};

export default UsersClient; // <-- Unique.
