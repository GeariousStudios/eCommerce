"use client";

import { useToast } from "../../../components/toast/ToastProvider";
import useManage from "@/app/hooks/useManage";
import { UnitFilters, UnitItem } from "@/app/types/manageTypes"; // <-- Unique.
import {
  deleteContent,
  fetchContent,
  fetchUnitGroups,
  UnitGroupOption,
} from "@/app/apis/manage/unitsApi"; // <-- Unique.
import ManageBase from "@/app/components/manage/ManageBase";
import UnitModal from "@/app/components/modals/manage/UnitModal"; // <-- Unique.
import DeleteModal from "@/app/components/modals/DeleteModal";
import { useEffect, useState } from "react";
import { badgeClass } from "@/app/components/manage/ManageClasses";

type Props = {
  isConnected: boolean | null;
};

const UnitsClient = (props: Props) => {
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
  } = useManage<UnitItem, UnitFilters>(async (params) => {
    // <-- Unique.
    try {
      const result = await fetchContent(params);
      return {
        items: result.items,
        total: result.total,
        counts: result.counts,
      };
    } catch (err: any) {
      notify("error", err.message || "Kunde inte hämta enheter"); // <-- Unique.
      return {
        items: [],
        total: 0,
        counts: {},
      };
    } finally {
      setIsLoading(false);
    }
  });

  const { notify } = useToast();

  // --- FETCH UNITS INITIALIZATION (Unique) ---
  const [unitGroups, setUnitGroups] = useState<UnitGroupOption[]>([]);
  useEffect(() => {
    fetchUnitGroups()
      .then(setUnitGroups)
      .catch((err) => notify("error", String(err)));
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
      window.dispatchEvent(new Event("unit-list-updated"));
      notify("success", "Enhet borttagen!", 4000); // <-- Unique.
    } catch (err: any) {
      notify("error", err?.message || String(err));
    }
  };

  // --- Grid Items (Unique) ---
  const gridItems = () => [
    {
      key: "name, isHidden",
      getValue: (item: UnitItem) => (
        <div className="flex flex-col gap-4 rounded-2xl bg-[var(--bg-grid-header)] p-4">
          <div className="flex flex-col">
            <span className="flex items-center justify-between text-2xl font-bold">
              <span className="flex items-center">{item.name}</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">Tillhör enhetsgrupp:</span>
            <span className="-mt-2">{item.unitGroupName}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">Status:</span>
            <span
              className={`${badgeClass} ${item.isHidden ? "bg-[var(--locked)]" : "bg-[var(--unlocked)]"} w-min-[72px] w-[72px] text-[var(--text-main-reverse)]`}
            >
              {item.isHidden ? "Gömd" : "Synlig"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "creationDate, createdBy",
      getValue: (item: UnitItem) => (
        <p className="flex flex-col">
          <span className="font-semibold">Skapad: </span>
          {new Date(item.creationDate).toLocaleString("sv-SE", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          av {item.createdBy}
        </p>
      ),
    },
    {
      key: "updateDate, updatedBy",
      getValue: (item: UnitItem) => (
        <p className="flex flex-col">
          <span className="font-semibold">Senast uppdaterad: </span>
          {new Date(item.updateDate).toLocaleString("sv-SE", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          av {item.updatedBy}
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
      getValue: (item: UnitItem) => item.name,
      responsivePriority: 0,
    },
    {
      key: "unitGroupName",
      label: "Tillhör enhetsgrupp",
      sortingItem: "unitGroupName",
      labelAsc: "enhetsgrupp A-Ö",
      labelDesc: "enhetsgrupp Ö-A",
      getValue: (item: UnitItem) => item.unitGroupName,
      responsivePriority: 2,
    },
    {
      key: "isHidden",
      label: "Status",
      sortingItem: "isHidden",
      labelAsc: "gömda enheter",
      labelDesc: "synliga enheter",
      classNameAddition: "w-[100px] min-w-[100px]",
      childClassNameAddition: "w-[72px] min-w-[72px]",
      getValue: (item: UnitItem) => (
        <span
          className={`${badgeClass} ${item.isHidden ? "bg-[var(--locked)]" : "bg-[var(--unlocked)]"} w-full text-[var(--text-main-reverse)]`}
        >
          {item.isHidden ? "Gömd" : "Synlig"}
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
  };

  // --- Filter List (Unique)
  const filterList = () => [
    {
      label: "Status",
      breakpoint: "ml",
      options: [
        {
          label: "Synliga enheter",
          isSelected: filterControls.showVisible,
          setSelected: filterControls.setShowVisible,
          count: counts?.visible,
        },
        {
          label: "Gömda enheter",
          isSelected: filterControls.showHidden,
          setSelected: filterControls.setShowHidden,
          count: counts?.hidden,
        },
      ],
    },
    {
      label: "Tillhör enhetsgrupp",
      breakpoint: "lg",
      options: unitGroups.map((group) => ({
        label: group.name,
        isSelected: filterControls.selectedUnitGroups.includes(group.id),
        setSelected: () => filterControls.toggleUnitGroup(group.id),
        count: counts?.unitGroupCount?.[group.name],
      })),
    },
  ];

  return (
    <>
      <ManageBase<UnitItem> // <-- Unique.
        itemName="enhet" // <-- Unique.
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
      <UnitModal // <-- Unique.
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

export default UnitsClient; // <-- Unique.
