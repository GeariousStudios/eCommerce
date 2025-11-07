"use client";

import { useToast } from "../../../components/toast/ToastProvider";
import useManage from "@/app/hooks/useManage";
import { ShiftFilters, ShiftItem } from "@/app/types/manageTypes"; // <-- Unique.
import {
  deleteContent,
  fetchContent,
  fetchShiftTeams,
  fetchUnits,
  ShiftTeamOption,
  UnitOption,
} from "@/app/apis/manage/shiftsApi"; // <-- Unique.
import ManageBase from "@/app/components/manage/ManageBase";
import ShiftModal from "@/app/components/modals/admin/shifts/ShiftModal"; // <-- Unique.
import DeleteModal from "@/app/components/modals/DeleteModal";
import { badgeClass } from "@/app/components/manage/ManageClasses";
import { useEffect, useState } from "react";
import { utcIsoToLocalDateTime } from "@/app/helpers/timeUtils";
import { useTranslations } from "next-intl";
import useTheme from "@/app/hooks/useTheme";

type Props = {
  isConnected: boolean | null;
};

const ShiftsClient = (props: Props) => {
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
  } = useManage<ShiftItem, ShiftFilters>(
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
          err.message || t("Manage/Failed to fetch") + t("Common/shifts"),
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

  // --- FETCH UNITS INITIALIZATION (Unique) ---
  const [units, setUnits] = useState<UnitOption[]>([]);
  useEffect(() => {
    fetchUnits()
      .then(setUnits)
      .catch((err) => notify("error", t("Modal/Unknown error")));
  }, []);

  // --- FETCH SHIFT TEAMS INITIALIZATION (Unique) ---
  const [shiftTeams, setShiftTeams] = useState<ShiftTeamOption[]>([]);
  useEffect(() => {
    fetchShiftTeams()
      .then(setShiftTeams)
      .catch((err) => notify("error", t("Modal/Unknown error")));
  }, []);

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
      notify("success", t("Common/Shift") + t("Manage/deleted2"), 4000); // <-- Unique.
    } catch (err: any) {
      notify("error", err?.message || t("Modal/Unknown error"));
    }
  };

  // --- Theme ---
  const { currentTheme } = useTheme();

  // --- Grid Items (Unique) ---
  const gridItems = () => [
    {
      key: "name, units, shiftTeams, isHidden",
      getValue: (item: ShiftItem) => (
        <div className="flex flex-col gap-4 rounded-2xl bg-[var(--bg-grid-header)] p-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-4 text-2xl font-bold">
              <span
                className="h-8 min-h-8 w-8 min-w-8 rounded-full"
                style={{
                  backgroundColor:
                    currentTheme === "dark"
                      ? item.darkColorHex
                      : item.lightColorHex,
                  color:
                    currentTheme === "dark"
                      ? item.darkTextColorHex
                      : item.lightTextColorHex,
                }}
              />
              <span className="flex items-center">{item.name}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">
              {t("Common/Shift teams")}:
            </span>
            {item.shiftTeams.length === 0 ? (
              <span className="-mt-2">-</span>
            ) : (
              (item.shiftTeams ?? []).map((team, i) => {
                const label = team.name;
                const matchingShiftTeam = shiftTeams.find(
                  (st) => st.name === label,
                );

                return (
                  <span
                    key={i}
                    className={badgeClass}
                    style={{
                      backgroundColor:
                        currentTheme === "dark"
                          ? matchingShiftTeam?.darkColorHex
                          : matchingShiftTeam?.lightColorHex,
                      color:
                        currentTheme === "dark"
                          ? matchingShiftTeam?.darkTextColorHex
                          : matchingShiftTeam?.lightTextColorHex,
                    }}
                  >
                    {label}
                  </span>
                );
              })
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">
              {t("Manage/Used by units")}:
            </span>
            {item.units.length === 0 ? (
              <span className="-mt-2">-</span>
            ) : (
              (item.units ?? []).map((unit, i) => {
                const label = unit.name;
                const matchingUnit = units.find((u) => u.name === label);

                return (
                  <span
                    key={i}
                    className={badgeClass}
                    style={{
                      backgroundColor:
                        currentTheme === "dark"
                          ? matchingUnit?.darkColorHex
                          : matchingUnit?.lightColorHex,
                      color:
                        currentTheme === "dark"
                          ? matchingUnit?.darkTextColorHex
                          : matchingUnit?.lightTextColorHex,
                    }}
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
      getValue: (item: ShiftItem) => (
        <p className="flex flex-col">
          <span className="font-semibold">{t("Common/Created")}</span>
          {utcIsoToLocalDateTime(item.creationDate)} {t("Common/by")}{" "}
          {item.createdBy}
        </p>
      ),
    },
    {
      key: "updateDate, updatedBy",
      getValue: (item: ShiftItem) => (
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
      getValue: (item: ShiftItem) => (
        <div className="flex items-center gap-4">
          <span
            className="h-4 min-h-4 w-4 min-w-4 rounded-full"
            style={{
              backgroundColor:
                currentTheme === "dark"
                  ? item.darkColorHex
                  : item.lightColorHex,
              color:
                currentTheme === "dark"
                  ? item.darkTextColorHex
                  : item.lightTextColorHex,
            }}
          />
          {item.name}
        </div>
      ),
      responsivePriority: 0,
    },
    {
      key: "shiftTeams",
      label: t("Common/Shift teams"),
      sortingItem: "shiftteamcount",
      labelAsc: t("Shifts/shift team amount") + t("Manage/ascending"),
      labelDesc: t("Shifts/shift team amount") + t("Manage/descending"),
      getValue: (item: ShiftItem) => (
        <div className="flex flex-wrap gap-2">
          {(item.shiftTeams ?? []).map((shift, i) => {
            const label = shift.name;
            const matchingShiftTeam = shiftTeams.find(
              (st) => st.name === label,
            );

            return (
              <span
                key={i}
                className={badgeClass}
                style={{
                  backgroundColor:
                    currentTheme === "dark"
                      ? matchingShiftTeam?.darkColorHex
                      : matchingShiftTeam?.lightColorHex,
                  color:
                    currentTheme === "dark"
                      ? matchingShiftTeam?.darkTextColorHex
                      : matchingShiftTeam?.lightTextColorHex,
                }}
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
      key: "units",
      label: t("Manage/Used by units"),
      sortingItem: "unitcount",
      labelAsc: t("Manage/unit amount") + t("Manage/ascending"),
      labelDesc: t("Manage/unit amount") + t("Manage/descending"),
      getValue: (item: ShiftItem) => (
        <div className="flex flex-wrap gap-2">
          {(item.units ?? []).map((unit, i) => {
            const label = unit.name;
            const matchingUnit = units.find((u) => u.name === label);

            return (
              <span
                key={i}
                className={badgeClass}
                style={{
                  backgroundColor:
                    currentTheme === "dark"
                      ? matchingUnit?.darkColorHex
                      : matchingUnit?.lightColorHex,
                  color:
                    currentTheme === "dark"
                      ? matchingUnit?.darkTextColorHex
                      : matchingUnit?.lightTextColorHex,
                }}
              >
                {label}
              </span>
            );
          })}
        </div>
      ),
      responsivePriority: 3,
    },
    {
      key: "isHidden",
      label: t("Common/Status"),
      sortingItem: "visibilitycount",
      labelAsc: t("Shifts/hidden shifts"),
      labelDesc: t("Shifts/visible shifts"),
      classNameAddition: "w-[100px] min-w-[100px]",
      childClassNameAddition: "w-[72px] min-w-[72px]",
      getValue: (item: ShiftItem) => (
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

    selectedUnits: filters.unitIds ?? [],
    setUnitSelected: (unitId: number, val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        unitIds: val
          ? [...(prev.unitIds ?? []), unitId]
          : (prev.unitIds ?? []).filter((id) => id !== unitId),
      }));
    },

    selectedShiftTeams: filters.shiftTeamIds ?? [],
    setShiftTeamSelected: (teamId: number, val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        shiftTeamIds: val
          ? [...(prev.shiftTeamIds ?? []), teamId]
          : (prev.shiftTeamIds ?? []).filter((id) => id !== teamId),
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
          label: t("Shifts/Visible shifts"),
          isSelected: filterControls.showVisible,
          setSelected: filterControls.setShowVisible,
          count: counts?.visibilityCount?.["Visible"] ?? 0,
        },
        {
          label: t("Shifts/Hidden shifts"),
          isSelected: filterControls.showHidden,
          setSelected: filterControls.setShowHidden,
          count: counts?.visibilityCount?.["Hidden"] ?? 0,
        },
      ],
    },
    {
      label: t("Common/Shift teams"),
      breakpoint: "lg",
      options: shiftTeams.map((shift) => {
        const label = shift.name;

        return {
          label,
          isSelected: filterControls.selectedShiftTeams.includes(shift.id),
          setSelected: (val: boolean) =>
            filterControls.setShiftTeamSelected(shift.id, val),
          count: counts?.shiftTeamCount?.[shift.id],
        };
      }),
    },
    {
      label: t("Manage/Used by units"),
      breakpoint: "xl",
      options: units.map((unit) => {
        const label = unit.name;

        return {
          label,
          isSelected: filterControls.selectedUnits.includes(unit.id),
          setSelected: (val: boolean) =>
            filterControls.setUnitSelected(unit.id, val),
          count: counts?.unitCount?.[unit.id],
        };
      }),
    },
  ];

  // const anySelectedInUse = () => {
  //   // <-- Unique.
  //   return items.some(
  //     (item) => deletingItemIds.includes(item.id) && item.units.length > 0,
  //   );
  // };

  return (
    <>
      <ManageBase<ShiftItem> // <-- Unique.
        itemName={t("Common/shift")} // <-- Unique.
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
      <ShiftModal // <-- Unique.
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
        confirmOnDelete // <-- Unique.
        confirmDeleteMessage={
          <>
            {t("Shifts/Confirm1")}
            <br />
            <br />
            {t("Shifts/Confirm2")}
            <br />
            <br />
            {t("Shifts/Confirm3")}
          </>
        }
      />
    </>
  );
};

export default ShiftsClient; // <-- Unique.
