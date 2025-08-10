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
import { utcIsoToLocalDateTime } from "@/app/helpers/timeUtils";
import { useTranslations } from "next-intl";

type Props = {
  isConnected: boolean | null;
};

const UsersClient = (props: Props) => {
  const t = useTranslations();
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
        notify(
          "error",
          err.message || t("Manage/Failed to fetch") + t("Common/users"),
        ); // <-- Unique.
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
      notify("success", t("Common/User") + t("Manage/deleted"), 4000); // <-- Unique.
    } catch (err: any) {
      notify("error", err?.message || t("Modal/Unknown error"));
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
                  <CustomTooltip content={t("Users/Locked user")} showOnTouch>
                    <LockClosedIcon className="h-5 w-5 cursor-help text-[var(--locked)]" />
                  </CustomTooltip>
                )}
              </span>
              <CustomTooltip
                content={
                  <span>
                    <span className="font-extrabold">{item.username}</span>{" "}
                    {item.isOnline
                      ? t("Common/is") + " online"
                      : t("Common/is") + " offline"}
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
            <span className="w-full font-semibold">
              {" "}
              {t("Users/Permissions")}:
            </span>
            {item.roles.map((role, i) => (
              <span
                key={i}
                className={`${badgeClass} ${role === "Admin" ? "bg-[var(--badge-one)] text-[var(--text-one)]" : role === "Developer" ? "bg-[var(--badge-two)] text-[var(--text-two)]" : role === "Reporter" ? "bg-[var(--badge-three)] text-[var(--text-three)]" : role === "Master" ? "bg-[var(--badge-four)] text-[var(--text-four)]" : "bg-[var(--accent-color)] text-[var(--text-main-reverse)]"} `}
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
          <span className="font-semibold">{t("Common/Created")} </span>
          {utcIsoToLocalDateTime(item.creationDate)}
        </p>
      ),
    },
    {
      key: "lastLogin",
      getValue: (item: UserItem) => (
        <p className="flex flex-col">
          <span className="font-semibold">{t("Users/Last login")} </span>
          {item.lastLogin ? utcIsoToLocalDateTime(item.lastLogin) : "-"}
        </p>
      ),
    },
  ];

  // --- Table Items (Unique) ---
  const tableItems = () => [
    {
      key: "username",
      label: t("Common/Username"),
      sortingItem: "username",
      labelAsc: t("Common/username") + " Ö-A",
      labelDesc: t("Common/username") + " A-Ö",
      getValue: (item: UserItem) => item.username,
      responsivePriority: 0,
    },
    {
      key: "firstName",
      label: t("Users/First name"),
      sortingItem: "firstName",
      labelAsc: t("Users/first name") + " Ö-A",
      labelDesc: t("Users/first name") + " A-Ö",
      getValue: (item: UserItem) => item.firstName,
      responsivePriority: 2,
    },
    {
      key: "lastName",
      label: t("Users/Last name"),
      sortingItem: "lastName",
      labelAsc: t("Users/last name") + " Ö-A",
      labelDesc: t("Users/last name") + " A-Ö",
      getValue: (item: UserItem) => item.lastName,
      responsivePriority: 3,
    },
    {
      key: "email",
      label: t("Users/Email"),
      sortingItem: "email",
      labelAsc: t("Users/email") + " Ö-A",
      labelDesc: t("Users/email") + " A-Ö",
      getValue: (item: UserItem) => item.email,
      responsivePriority: 4,
    },
    {
      key: "roles",
      label: t("Users/Permissions"),
      sortingItem: "roles",
      labelAsc: t("Users/permissions") + " Ö-A",
      labelDesc: t("Users/permissions") + " A-Ö",
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
      label: t("Common/Status"),
      sortingItem: "status",
      labelAsc: t("Users/locked users"),
      labelDesc: t("Users/locked users"),
      classNameAddition: "w-[100px] min-w-[100px]",
      childClassNameAddition: "w-[72px] min-w-[72px]",
      getValue: (item: UserItem) => (
        <span
          className={`${badgeClass} ${item.isLocked ? "bg-[var(--locked)]" : "bg-[var(--unlocked)]"} w-full text-[var(--text-main-reverse)]`}
        >
          {item.isLocked ? t("Users/Locked") : t("Users/Unlocked")}
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
      label: t("Users/Permissions"),
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
      label: t("Common/Status"),
      breakpoint: "lg",
      options: [
        {
          label: t("Users/Locked users"),
          isSelected: filterControls.showLocked,
          setSelected: filterControls.setShowLocked,
          count: counts?.status?.["Locked"] ?? 0,
        },
        {
          label: t("Users/Unlocked users"),
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
        itemName={t("Common/user")} // <-- Unique.
        items={items}
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        toggleEditItemModal={toggleEditItemModal}
        toggleDeleteItemModal={toggleDeleteItemModal}
        isLoading={isLoading}
        isConnected={props.isConnected === true}
        selectMessage="Manage/Select1" // <-- Unique.
        editLimitMessage="Manage/Edit limit1" // <-- Unique.
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
