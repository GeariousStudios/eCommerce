"use client";

import { useToast } from "../../../../components/toast/ToastProvider";
import useManage from "@/app/hooks/useManage";
import {
  getDataTypeOptions,
  UnitColumnDataType,
  UnitColumnFilters,
  UnitColumnItem,
} from "@/app/types/manageTypes"; // <-- Unique.
import {
  deleteContent,
  fetchContent,
  fetchUnits,
  UnitOption,
} from "@/app/apis/manage/unitColumnsApi"; // <-- Unique.
import ManageBase from "@/app/components/manage/ManageBase";
import UnitColumnModal from "@/app/components/modals/admin/units/UnitColumnModal"; // <-- Unique.
import DeleteModal from "@/app/components/modals/DeleteModal";
import { badgeClass } from "@/app/components/manage/ManageClasses";
import { useEffect, useState } from "react";
import { utcIsoToLocalDateTime } from "@/app/helpers/timeUtils";
import { useTranslations } from "next-intl";

type Props = {
  isConnected: boolean | null;
};

const UnitColumnsClient = (props: Props) => {
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
  } = useManage<UnitColumnItem, UnitColumnFilters>(
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
          err.message || t("Manage/Failed to fetch") + t("Common/columns"),
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
      .catch((err) => notify("error", String(err)));
  }, []);

  const nameCounts = units.reduce<Record<string, number>>((acc, unit) => {
    acc[unit.name] = (acc[unit.name] ?? 0) + 1;
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
      notify("success", t("Common/Column") + t("Manage/deleted"), 4000); // <-- Unique.
    } catch (err: any) {
      notify("error", err?.message || String(err));
    }
  };

  // --- Grid Items (Unique) ---
  const gridItems = () => [
    {
      key: "name, units",
      getValue: (item: UnitColumnItem) => (
        <div className="flex flex-col gap-4 rounded-2xl bg-[var(--bg-grid-header)] p-4">
          <div className="flex flex-col">
            <span className="flex items-center justify-between text-2xl font-bold">
              <span className="flex items-center">{item.name}</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">
              {t("Manage/Used by units")}:
            </span>
            {item.units.length === 0 ? (
              <span className="-mt-2">-</span>
            ) : (
              item.units.map((unit, i) => {
                const isDuplicate = nameCounts[unit] > 1;
                const matchingUnit = units.find((u) => u.name === unit);
                const label =
                  isDuplicate && matchingUnit?.unitGroupName
                    ? `${unit} (${matchingUnit.unitGroupName})`
                    : unit;

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
        </div>
      ),
    },
    {
      key: "creationDate, createdBy",
      getValue: (item: UnitColumnItem) => (
        <p className="flex flex-col">
          <span className="font-semibold">{t("Common/Created")}</span>
          {utcIsoToLocalDateTime(item.creationDate)} {t("Common/by")}{" "}
          {item.createdBy}
        </p>
      ),
    },
    {
      key: "updateDate, updatedBy",
      getValue: (item: UnitColumnItem) => (
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
      getValue: (item: UnitColumnItem) => item.name,
      responsivePriority: 0,
    },
    {
      key: "datatyp",
      label: t("Columns/Data type"),
      getValue: (item: UnitColumnItem) => item.dataType,
      responsivePriority: 1,
    },
    {
      key: "units",
      label: t("Manage/Used by units"),
      sortingItem: "unitcount",
      labelAsc: t("Manage/unit amount") + t("Manage/ascending"),
      labelDesc: t("Manage/unit amount") + t("Manage/descending"),
      getValue: (item: UnitColumnItem) => (
        <div className="flex flex-wrap gap-2">
          {item.units.map((unit, i) => {
            const isDuplicate = nameCounts[unit] > 1;
            const matchingUnit = units.find((u) => u.name === unit);
            const label =
              isDuplicate && matchingUnit?.unitGroupName
                ? `${unit} (${matchingUnit.unitGroupName})`
                : unit;

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
      key: "hasData",
      label: t("Columns/Has data"),
      sortingItem: "hasData",
      labelAsc: t("Columns/Data1"),
      labelDesc: t("Columns/Data2"),
      classNameAddition: "w-[120px] min-w-[120px]",
      childClassNameAddition: "w-[92px] min-w-[92px]",
      getValue: (item: UnitColumnItem) => (
        <span
          className={`${badgeClass} ${item.hasData ? "bg-[var(--locked)]" : "bg-[var(--unlocked)]"} w-full text-[var(--text-main-reverse)]`}
        >
          {item.hasData ? t("Common/Yes") : t("Common/No")}
        </span>
      ),
      responsivePriority: 3,
    },
  ];

  // --- Filter Controls (Unique) ---
  const filterControls = {
    selectedDataTypes: filters.dataTypes ?? [],
    toggleDataType: (type: UnitColumnDataType) => {
      setFilters((prev) => {
        const types = new Set(prev.dataTypes ?? []);
        if (types.has(type)) {
          types.delete(type);
        } else {
          types.add(type);
        }
        return { ...prev, dataTypes: Array.from(types) };
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

    showHasData: filters.hasData === true,
    setShowHasData: (val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        hasData: val ? true : undefined,
      }));
    },

    showNoData: filters.hasData === false,
    setShowNoData: (val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        hasData: val ? false : undefined,
      }));
    },
  };

  // --- Filter List (Unique)
  const filterList = () => [
    {
      label: t("Columns/Data type"),
      breakpoint: "ml",
      options: getDataTypeOptions(t).map(({ label, value }) => ({
        label,
        isSelected: filterControls.selectedDataTypes.includes(value),
        setSelected: (val: boolean) => {
          const selected = filterControls.selectedDataTypes.includes(value);

          if (val !== selected) {
            filterControls.toggleDataType(value);
          }
        },
        count: counts?.dataTypeCount?.[value] ?? 0,
      })),
    },
    {
      label: t("Manage/Used by units"),
      breakpoint: "lg",
      options: units.map((unit) => {
        const isDuplicate = nameCounts[unit.name] > 1;
        const label =
          isDuplicate && unit.unitGroupName
            ? `${unit.name} (${unit.unitGroupName})`
            : unit.name;

        return {
          label,
          isSelected: filterControls.selectedUnits.includes(unit.id),
          setSelected: (val: boolean) =>
            filterControls.setUnitSelected(unit.id, val),
          count: counts?.unitCount?.[unit.id],
        };
      }),
    },
    {
      label: t("Columns/Has data"),
      breakpoint: "xl",
      options: [
        {
          label: t("Common/Yes"),
          isSelected: filterControls.showHasData,
          setSelected: filterControls.setShowHasData,
          count: counts?.hasData?.["True"] ?? 0,
        },
        {
          label: t("Common/No"),
          isSelected: filterControls.showNoData,
          setSelected: filterControls.setShowNoData,
          count: counts?.hasData?.["False"] ?? 0,
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

  const anySelectedHasData = () => {
    // <-- Unique.
    return items.some(
      (item) => deletingItemIds.includes(item.id) && item.hasData,
    );
  };

  return (
    <>
      <ManageBase<UnitColumnItem> // <-- Unique.
        itemName={t("Common/column")} // <-- Unique.
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
      <UnitColumnModal // <-- Unique.
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
        confirmOnDelete={anySelectedHasData()}
        confirmDeleteMessage={t("Columns/Confirm")}
      />
    </>
  );
};

export default UnitColumnsClient; // <-- Unique.
