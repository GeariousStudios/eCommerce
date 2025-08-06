"use client";

import { useToast } from "../../../components/toast/ToastProvider";
import useManage from "@/app/hooks/useManage";
import { UnitGroupFilters, UnitGroupItem } from "@/app/types/manageTypes"; // <-- Unique.
import {
  deleteContent,
  fetchContent,
  fetchUnits,
  UnitOption,
} from "@/app/apis/manage/unitGroupsApi"; // <-- Unique.
import ManageBase from "@/app/components/manage/ManageBase";
import UnitGroupModal from "@/app/components/modals/report/UnitGroupModal"; // <-- Unique.
import DeleteModal from "@/app/components/modals/DeleteModal";
import { badgeClass } from "@/app/components/manage/ManageClasses";
import { useEffect, useState } from "react";
import { utcIsoToLocalDateTime } from "@/app/helpers/timeUtils";

type Props = {
  isConnected: boolean | null;
};

const UnitGroupsClient = (props: Props) => {
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
  } = useManage<UnitGroupItem, UnitGroupFilters>(
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
        notify("error", err.message || "Kunde inte hämta grupper"); // <-- Unique.
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
      notify("success", "Grupp borttagen!", 4000); // <-- Unique.
    } catch (err: any) {
      notify("error", err?.message || String(err));
    }
  };

  // --- Grid Items (Unique) ---
  const gridItems = () => [
    {
      key: "name",
      getValue: (item: UnitGroupItem) => (
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
              (item.units ?? []).map((unit, i) => {
                const label = unit.name;

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
      getValue: (item: UnitGroupItem) => (
        <p className="flex flex-col">
          <span className="font-semibold">Skapad: </span>
          {utcIsoToLocalDateTime(item.creationDate)} av {item.createdBy}
        </p>
      ),
    },
    {
      key: "updateDate, updatedBy",
      getValue: (item: UnitGroupItem) => (
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
      getValue: (item: UnitGroupItem) => item.name,
      responsivePriority: 0,
    },
    {
      key: "units",
      label: "Används av enheter",
      sortingItem: "unitcount",
      labelAsc: "antal enheter (stigande)",
      labelDesc: "antal enheter (fallande)",
      getValue: (item: UnitGroupItem) => (
        <div className="flex flex-wrap gap-2">
          {(item.units ?? []).map((unit, i) => {
            const label = unit.name;

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
      responsivePriority: 1,
    },
  ];

  // --- Filter Controls (Unique) ---
  const filterControls = {
    selectedUnits: filters.unitIds ?? [],
    setUnitSelected: (unitId: number, val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        unitIds: val
          ? [...(prev.unitIds ?? []), unitId]
          : (prev.unitIds ?? []).filter((id) => id !== unitId),
      }));
    },
  };

  // --- Filter List (Unique)
  const filterList = () => [
    {
      label: "Används av enheter",
      breakpoint: "ml",
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
  //     (item) => deletingItemIds.includes(item.id) && item.hasUnits,
  //   );
  // };

  return (
    <>
      <ManageBase<UnitGroupItem> // <-- Unique.
        itemName="grupp" // <-- Unique.
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
      <UnitGroupModal // <-- Unique.
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

export default UnitGroupsClient; // <-- Unique.
