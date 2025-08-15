"use client";

import { useToast } from "../../../../components/toast/ToastProvider";
import useManage from "@/app/hooks/useManage";
import { ShiftTeamFilters, ShiftTeamItem } from "@/app/types/manageTypes"; // <-- Unique.
import {
  deleteContent,
  fetchContent,
  fetchShifts,
  ShiftOption,
} from "@/app/apis/manage/shiftTeamsApi"; // <-- Unique.
import ManageBase from "@/app/components/manage/ManageBase";
import ShiftTeamModal from "@/app/components/modals/admin/shifts/ShiftTeamModal"; // <-- Unique.
import DeleteModal from "@/app/components/modals/DeleteModal";
import { badgeClass } from "@/app/components/manage/ManageClasses";
import { useEffect, useState } from "react";
import { utcIsoToLocalDateTime } from "@/app/helpers/timeUtils";
import { useTranslations } from "next-intl";

type Props = {
  isConnected: boolean | null;
};

const ShiftTeamsClient = (props: Props) => {
  const t = useTranslations();

  // <-- Unique.
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
  } = useManage<ShiftTeamItem, ShiftTeamFilters>(
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
          err.message || t("Manage/Failed to fetch") + t("Common/shift teams"),
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
    { initialSortBy: "name", initialSortOrder: "asc" },
  );

  const { notify } = useToast();

  // --- FETCH SHIFTS INITIALIZATION (Unique) ---
  const [shifts, setShifts] = useState<ShiftOption[]>([]);
  useEffect(() => {
    fetchShifts()
      .then(setShifts)
      .catch((err) => notify("error", t("Modal/Unknown error")));
  }, []);

  const nameCounts = shifts.reduce<Record<string, number>>((acc, shift) => {
    acc[shift.name] = (acc[shift.name] ?? 0) + 1;
    return acc;
  }, {});

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
      notify("success", t("Common/Shift team") + t("Manage/deleted2"), 4000); // <-- Unique.
    } catch (err: any) {
      notify("error", err?.message || t("Modal/Unknown error"));
    }
  };

  // --- Grid Items (Unique) ---
  const gridItems = () => [
    {
      key: "name, shifts, isHidden",
      getValue: (item: ShiftTeamItem) => (
        <div className="flex flex-col gap-4 rounded-2xl bg-[var(--bg-grid-header)] p-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-4 text-2xl font-bold">
              <span
                className="h-8 min-h-8 w-8 min-w-8 rounded-full"
                style={{
                  backgroundColor: item.colorHex,
                }}
              />
              <span className="flex items-center">{item.name}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">
              {t("Manage/Used by units")}:
            </span>
            {item.shifts.length === 0 ? (
              <span className="-mt-2">-</span>
            ) : (
              (item.shifts ?? []).map((shift, i) => {
                const label = shift.name;

                return (
                  <span
                    key={i}
                    className={`${badgeClass} bg-[var(--badge-main)] text-[var(--text-main-reverse)]`}
                  >
                    {label}
                  </span>
                );
              })
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">{t("Common/Status")}:</span>
            <span
              className={`${badgeClass} ${item.isHidden ? "bg-[var(--locked)]" : "bg-[var(--unlocked)]"} text-[var(--text-main-reverse)]`}
            >
              {item.isHidden ? t("Manage/Hidden") : t("Manage/Visible")}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "creationDate, createdBy",
      getValue: (item: ShiftTeamItem) => (
        <p className="flex flex-col">
          <span className="font-semibold">{t("Common/Created")}</span>
          {utcIsoToLocalDateTime(item.creationDate)} {t("Common/by")}{" "}
          {item.createdBy}
        </p>
      ),
    },
    {
      key: "updateDate, updatedBy",
      getValue: (item: ShiftTeamItem) => (
        <p className="flex flex-col">
          <span className="font-semibold">{t("Common/Updated")}</span>
          {utcIsoToLocalDateTime(item.updateDate)} {t("Common/by")}{" "}
          {item.updatedBy}
        </p>
      ),
    },
  ];

  // --- Table Items (Unique) ---
  const tableItems = () => [
    {
      key: "name",
      label: t("Common/Name"),
      sortingItem: "name",
      labelAsc: t("Common/name") + " Ö-A",
      labelDesc: t("Common/name") + " A-Ö",
      getValue: (item: ShiftTeamItem) => (
        <div className="flex gap-4 items-center">
          <span
            className="h-4 min-h-4 w-4 min-w-4 rounded-full"
            style={{
              backgroundColor: item.colorHex,
            }}
          />
          {item.name}
        </div>
      ),
      responsivePriority: 0,
    },
    {
      key: "shifts",
      label: t("ShiftTeams/Used by shifts"),
      sortingItem: "shiftcount",
      labelAsc: t("ShiftTeams/shift amount") + t("Manage/ascending"),
      labelDesc: t("ShiftTeams/shift amount") + t("Manage/descending"),
      getValue: (item: ShiftTeamItem) => (
        <div className="flex flex-wrap gap-2">
          {(item.shifts ?? []).map((shift, i) => {
            const label = shift.name;

            return (
              <span
                key={i}
                className={`${badgeClass} bg-[var(--badge-main)] text-[var(--text-main-reverse)]`}
              >
                {label}
              </span>
            );
          })}
        </div>
      ),
      responsivePriority: 2,
    },
    {
      key: "isHidden",
      label: t("Common/Status"),
      sortingItem: "visibilitycount",
      labelAsc: t("ShiftTeams/hidden shift teams"),
      labelDesc: t("ShiftTeams/visible shift teams"),
      classNameAddition: "w-[100px] min-w-[100px]",
      childClassNameAddition: "w-[72px] min-w-[72px]",
      getValue: (item: ShiftTeamItem) => (
        <span
          className={`${badgeClass} ${item.isHidden ? "bg-[var(--locked)]" : "bg-[var(--unlocked)]"} w-full text-[var(--text-main-reverse)]`}
        >
          {item.isHidden ? t("Manage/Hidden") : t("Manage/Visible")}
        </span>
      ),
      responsivePriority: 1,
    },
  ];

  // --- Filter Controls (Unique) ---
  const filterControls = {
    showVisible: filters.isHidden === false,
    setShowVisible: (val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        isHidden: val ? false : undefined,
      }));
    },

    showHidden: filters.isHidden === true,
    setShowHidden: (val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        isHidden: val ? true : undefined,
      }));
    },

    selectedShifts: filters.shiftIds ?? [],
    setShiftSelected: (shiftId: number, val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        shiftIds: val
          ? [...(prev.shiftIds ?? []), shiftId]
          : (prev.shiftIds ?? []).filter((id) => id !== shiftId),
      }));
    },
  };

  // --- Filter List (Unique)
  const filterList = () => [
    {
      label: t("Common/Status"),
      breakpoint: "ml",
      options: [
        {
          label: t("ShiftTeams/Visible shift teams"),
          isSelected: filterControls.showVisible,
          setSelected: filterControls.setShowVisible,
          count: counts?.visibilityCount?.["Visible"] ?? 0,
        },
        {
          label: t("ShiftTeams/Hidden shift teams"),
          isSelected: filterControls.showHidden,
          setSelected: filterControls.setShowHidden,
          count: counts?.visibilityCount?.["Hidden"] ?? 0,
        },
      ],
    },
    {
      label: t("ShiftTeams/Used by shifts"),
      breakpoint: "lg",
      options: shifts.map((shift) => {
        const label = shift.name;

        return {
          label,
          isSelected: filterControls.selectedShifts.includes(shift.id),
          setSelected: (val: boolean) =>
            filterControls.setShiftSelected(shift.id, val),
          count: counts?.shiftCount?.[shift.id],
        };
      }),
    },
  ];

  // const anySelectedInUse = () => {
  //   // <-- Unique.
  //   return items.some(
  //     (item) => deletingItemIds.includes(item.id) && item.hasUnits,
  //   );
  // };

  return (
    <>
      <ManageBase<ShiftTeamItem> // <-- Unique.
        itemName={t("Common/shift team")} // <-- Unique.
        items={items}
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        toggleEditItemModal={toggleEditItemModal}
        toggleDeleteItemModal={toggleDeleteItemModal}
        isLoading={isLoading}
        isConnected={props.isConnected === true}
        selectMessage="Manage/Select2" // <-- Unique.
        editLimitMessage="Manage/Edit limit2" // <-- Unique.
        isGrid={isGrid}
        setIsGrid={setIsGrid}
        gridItems={gridItems()}
        tableItems={tableItems()}
        showCheckbox
        showInfoButton={false}
        getIsDisabled={() => false} // <-- Unique.
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
      <ShiftTeamModal // <-- Unique.
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
        // confirmOnDelete={anySelectedInUse()} // <-- Unique.
      />
    </>
  );
};

export default ShiftTeamsClient; // <-- Unique.
