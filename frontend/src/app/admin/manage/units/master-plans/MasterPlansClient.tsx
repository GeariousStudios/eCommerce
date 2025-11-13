"use client";

import { useToast } from "../../../../components/toast/ToastProvider";
import useManage from "@/app/hooks/useManage";
import { MasterPlanFilters, MasterPlanItem } from "@/app/types/manageTypes"; // <-- Unique.
import {
  deleteContent,
  fetchContent,
  fetchUnits,
  fetchUnitGroups,
  fetchMasterPlanFields,
  UnitOption,
  UnitGroupOption,
  MasterPlanFieldOption,
} from "@/app/apis/manage/masterPlansApi"; // <-- Unique.
import ManageBase from "@/app/components/manage/ManageBase";
import MasterPlanModal from "@/app/components/modals/admin/units/MasterPlanModal"; // <-- Unique.
import DeleteModal from "@/app/components/modals/DeleteModal";
import { badgeClass } from "@/app/components/manage/ManageClasses";
import { useEffect, useState } from "react";
import { utcIsoToLocalDateTime } from "@/app/helpers/timeUtils";
import { useTranslations } from "next-intl";
import useTheme from "@/app/hooks/useTheme";

type Props = {
  isConnected: boolean | null;
};

const MasterPlansClient = (props: Props) => {
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
  } = useManage<MasterPlanItem, MasterPlanFilters>(
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
          err.message || t("Manage/Failed to fetch") + t("Common/master plans"),
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

  // --- FETCH UNITS & FIELDS INITIALIZATION (Unique) ---
  const [unitGroups, setUnitGroups] = useState<UnitGroupOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [masterPlanFields, setMasterPlanFields] = useState<
    MasterPlanFieldOption[]
  >([]);
  useEffect(() => {
    fetchUnitGroups()
      .then(setUnitGroups)
      .catch((err) => notify("error", t("Modal/Unknown error")));

    fetchUnits()
      .then(setUnits)
      .catch(() => notify("error", t("Modal/Unknown error")));

    fetchMasterPlanFields()
      .then(setMasterPlanFields)
      .catch(() => notify("error", t("Modal/Unknown error")));
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
      window.dispatchEvent(new Event("master-plan-list-updated"));
      notify("success", t("Common/Master plan") + t("Manage/deleted1"), 4000); // <-- Unique.
    } catch (err: any) {
      notify("error", err?.message || t("Modal/Unknown error"));
    }
  };

  // --- Theme ---
  const { currentTheme } = useTheme();

  // --- Grid Items (Unique) ---
  const gridItems = () => [
    {
      key: "name, units, isHidden, fields, unitGroupName, allowRemovingElements",
      getValue: (item: MasterPlanItem) => (
        <div className="bg-(--bg-grid-header) flex flex-col gap-4 rounded-2xl p-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-4 text-2xl font-bold">
              <span className="flex items-center">{item.name}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">
              {t("Units/Belongs to group")}:
            </span>
            <span className="-mt-2">{item.unitGroupName}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">
              {t("Common/Master plan fields")}:
            </span>
            <>
              {item.fields.length === 0 ? (
                <span className="-mt-2">-</span>
              ) : (
                item.fields.map((field, i) => (
                  <span
                    key={i}
                    className={`${badgeClass} bg-(--badge-main) text-(--text-main-reverse)`}
                  >
                    {field.name}
                  </span>
                ))
              )}
            </>
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
              className={`${badgeClass} ${item.isHidden ? "bg-(--locked)" : "bg-(--unlocked)"} text-(--text-main-reverse)`}
            >
              {item.isHidden ? t("Manage/Hidden") : t("Manage/Visible")}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "creationDate, createdBy",
      getValue: (item: MasterPlanItem) => (
        <p className="flex flex-col">
          <span className="font-semibold">{t("Common/Created")}</span>
          {utcIsoToLocalDateTime(item.creationDate)} {t("Common/by")}{" "}
          {item.createdBy}
        </p>
      ),
    },
    {
      key: "updateDate, updatedBy",
      getValue: (item: MasterPlanItem) => (
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
      getValue: (item: MasterPlanItem) => (
        <div className="flex items-center gap-4">{item.name}</div>
      ),
      responsivePriority: 0,
    },
    {
      key: "unitGroupName",
      label: t("Units/Belongs to group"),
      sortingItem: "unitgroupname",
      labelAsc: t("Common/group") + " Ö-A",
      labelDesc: t("Common/group") + " A-Ö",
      getValue: (item: MasterPlanItem) => item.unitGroupName,
      responsivePriority: 2,
    },
    {
      key: "fields",
      label: t("Common/Master plan fields"),
      sortingItem: "fieldcount",
      labelAsc:
        t("MasterPlans/master plan field amount") + t("Manage/ascending"),
      labelDesc:
        t("MasterPlans/master plan field amount") + t("Manage/descending"),
      getValue: (item: MasterPlanItem) => (
        <div className="flex flex-wrap gap-2">
          {item.fields.map((field, i) => (
            <span
              key={i}
              className={`${badgeClass} bg-(--badge-main) text-(--text-main-reverse)`}
            >
              {field.name}
            </span>
          ))}
        </div>
      ),
      responsivePriority: 3,
    },
    {
      key: "units",
      label: t("Manage/Used by units"),
      sortingItem: "unitcount",
      labelAsc: t("Manage/unit amount") + t("Manage/ascending"),
      labelDesc: t("Manage/unit amount") + t("Manage/descending"),
      getValue: (item: MasterPlanItem) => (
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
      responsivePriority: 4,
    },
    {
      key: "allowRemovingElements",
      label: t("MasterPlans/Allow removing elements"),
      sortingItem: "allowremovingelementscount",
      labelAsc: t("MasterPlans/allowed master plans"),
      labelDesc: t("MasterPlans/disallowed master plans"),
      classNameAddition: "w-[248px] min-w-[248px]",
      childClassNameAddition: "w-[88px] min-w-[88px]",
      getValue: (item: MasterPlanItem) => (
        <span
          className={`${badgeClass} ${item.allowRemovingElements ? "bg-(--unlocked)" : "bg-(--locked)"} text-(--text-main-reverse) w-full`}
        >
          {item.allowRemovingElements
            ? t("Manage/Allowed")
            : t("Manage/Disallowed")}
        </span>
      ),
      responsivePriority: 5,
    },
    {
      key: "isHidden",
      label: t("Common/Status"),
      sortingItem: "visibilitycount",
      labelAsc: t("MasterPlans/hidden master plans"),
      labelDesc: t("MasterPlans/visible master plans"),
      classNameAddition: "w-[100px] min-w-[100px]",
      childClassNameAddition: "w-[72px] min-w-[72px]",
      getValue: (item: MasterPlanItem) => (
        <span
          className={`${badgeClass} ${item.isHidden ? "bg-(--locked)" : "bg-(--unlocked)"} text-(--text-main-reverse) w-full`}
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

    showAllowed: filters.allowRemovingElements === true,
    setShowAllowed: (val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        allowRemovingElements: val ? true : undefined,
      }));
    },

    showDisallowed: filters.allowRemovingElements === false,
    setShowDisallowed: (val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        allowRemovingElements: val ? false : undefined,
      }));
    },

    selectedUnitGroups: filters.unitGroupIds ?? [],
    toggleUnitGroup: (groupId: number) => {
      setFilters((prev) => {
        const groups = new Set(prev.unitGroupIds ?? []);
        if (groups.has(groupId)) {
          groups.delete(groupId);
        } else {
          groups.add(groupId);
        }
        return { ...prev, unitGroupIds: Array.from(groups) };
      });
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

    selectedFields: filters.masterPlanFieldIds ?? [],
    setFieldSelected: (fieldId: number, val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        masterPlanFieldIds: val
          ? [...(prev.masterPlanFieldIds ?? []), fieldId]
          : (prev.masterPlanFieldIds ?? []).filter((id) => id !== fieldId),
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
          label: t("MasterPlans/Visible master plans"),
          isSelected: filterControls.showVisible,
          setSelected: filterControls.setShowVisible,
          count: counts?.visibilityCount?.["Visible"] ?? 0,
        },
        {
          label: t("MasterPlans/Hidden master plans"),
          isSelected: filterControls.showHidden,
          setSelected: filterControls.setShowHidden,
          count: counts?.visibilityCount?.["Hidden"] ?? 0,
        },
      ],
    },
    {
      label: t("Units/Belongs to group"),
      breakpoint: "lg",
      options: unitGroups.map((group) => ({
        label: group.name,
        isSelected: filterControls.selectedUnitGroups.includes(group.id),
        setSelected: (val: boolean) => {
          setFilters((prev) => ({
            ...prev,
            unitGroupIds: val
              ? [...(prev.unitGroupIds ?? []), group.id]
              : (prev.unitGroupIds ?? []).filter((id) => id !== group.id),
          }));
        },
        count: counts?.unitGroupCount?.[group.name],
      })),
    },
    {
      label: t("Common/Master plan fields"),
      breakpoint: "lg",
      options: masterPlanFields.map((field) => ({
        label: field.name,
        isSelected: filterControls.selectedFields.includes(field.id),
        setSelected: (val: boolean) =>
          filterControls.setFieldSelected(field.id, val),
        count: counts?.fieldCount?.[field.id],
      })),
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
          // count: counts?.unitCount?.[unit.id],
          count: counts?.unitCount?.[(unit.masterPlanId ?? unit.id) as number],
        };
      }),
    },
    {
      label: t("MasterPlans/Allow removing elements"),
      breakpoint: "2xl",
      options: [
        {
          label: t("MasterPlans/Allowed master plans"),
          isSelected: filterControls.showAllowed,
          setSelected: filterControls.setShowAllowed,
          count: counts?.allowRemovingElementsCount?.["Allowed"] ?? 0,
        },
        {
          label: t("MasterPlans/Disallowed master plans"),
          isSelected: filterControls.showDisallowed,
          setSelected: filterControls.setShowDisallowed,
          count: counts?.allowRemovingElementsCount?.["Disallowed"] ?? 0,
        },
      ],
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
      <ManageBase<MasterPlanItem> // <-- Unique.
        itemName={t("Common/master plan")} // <-- Unique.
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
      <MasterPlanModal // <-- Unique.
        isOpen={isEditModalOpen}
        onClose={toggleEditItemModal}
        itemId={editingItemId}
        onItemUpdated={() => {
          fetchItems();
          fetchMasterPlanFields().then(setMasterPlanFields);
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

          fetchMasterPlanFields().then(setMasterPlanFields);
          setIsDeleteModalOpen(false);
          setDeletingItemIds([]);
          setSelectedItems([]);
        }}
        confirmOnDelete // <-- Unique.
        confirmDeleteMessage={
          <>
            {t("MasterPlans/Confirm1")}
            <br />
            <br />
            {t("MasterPlans/Confirm2")}
            <br />
            <br />
            {t("MasterPlans/Confirm3")}
          </>
        }
      />
    </>
  );
};

export default MasterPlansClient; // <-- Unique.
