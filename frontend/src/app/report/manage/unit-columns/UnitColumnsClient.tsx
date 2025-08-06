"use client";

import { useToast } from "../../../components/toast/ToastProvider";
import useManage from "@/app/hooks/useManage";
import {
  dataTypeOptions,
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
import UnitColumnModal from "@/app/components/modals/report/UnitColumnModal"; // <-- Unique.
import DeleteModal from "@/app/components/modals/DeleteModal";
import { badgeClass } from "@/app/components/manage/ManageClasses";
import { useEffect, useState } from "react";
import { utcIsoToLocalDateTime } from "@/app/helpers/timeUtils";

type Props = {
  isConnected: boolean | null;
};

const UnitColumnsClient = (props: Props) => {
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
        notify("error", err.message || "Kunde inte hämta kolumner"); // <-- Unique.
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
      notify("success", "Kolumn borttagen!", 4000); // <-- Unique.
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
            <span className="w-full font-semibold">Används av enheter:</span>
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
          <span className="font-semibold">Skapad: </span>
          {utcIsoToLocalDateTime(item.creationDate)} av {item.createdBy}
        </p>
      ),
    },
    {
      key: "updateDate, updatedBy",
      getValue: (item: UnitColumnItem) => (
        <p className="flex flex-col">
          <span className="font-semibold">Uppdaterad: </span>
          {utcIsoToLocalDateTime(item.updateDate)} av {item.updatedBy}
        </p>
      ),
    },
  ];

  // --- Table Items (Unique) ---
  const tableItems = () => [
    {
      key: "name",
      label: "Namn",
      sortingItem: "name",
      labelAsc: "namn Ö-A",
      labelDesc: "namn A-Ö",
      getValue: (item: UnitColumnItem) => item.name,
      responsivePriority: 0,
    },
    {
      key: "datatyp",
      label: "Datatyp",
      getValue: (item: UnitColumnItem) => item.dataType,
      responsivePriority: 1,
    },
    {
      key: "units",
      label: "Används av enheter",
      sortingItem: "unitcount",
      labelAsc: "antal enheter (stigande)",
      labelDesc: "antal enheter (fallande)",
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
      label: "Har data",
      sortingItem: "hasData",
      labelAsc: "på kolumner som har data",
      labelDesc: "på kolumner som inte har någon data",
      classNameAddition: "w-[120px] min-w-[120px]",
      childClassNameAddition: "w-[92px] min-w-[92px]",
      getValue: (item: UnitColumnItem) => (
        <span
          className={`${badgeClass} ${item.hasData ? "bg-[var(--locked)]" : "bg-[var(--unlocked)]"} w-full text-[var(--text-main-reverse)]`}
        >
          {item.hasData ? "Ja" : "Nej"}
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
      label: "Datatyp",
      breakpoint: "ml",
      options: dataTypeOptions.map(({ label, value }) => ({
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
      label: "Används av enheter",
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
      label: "Har data",
      breakpoint: "xl",
      options: [
        {
          label: "Ja",
          isSelected: filterControls.showHasData,
          setSelected: filterControls.setShowHasData,
          count: counts?.hasData?.["True"] ?? 0,
        },
        {
          label: "Nej",
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
        itemName="kolumn" // <-- Unique.
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
        confirmDeleteMessage="Om du tar bort valda objekt så förlorar du även den data som finns kopplad. Vill du ta bort ändå?"
      />
    </>
  );
};

export default UnitColumnsClient; // <-- Unique.
