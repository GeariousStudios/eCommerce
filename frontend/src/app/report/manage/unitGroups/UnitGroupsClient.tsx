"use client";

import { useToast } from "../../../components/toast/ToastProvider";
import useManage from "@/app/hooks/useManage";
import { UnitGroupFilters, UnitGroupItem } from "@/app/types/manageTypes"; // <-- Unique.
import { deleteContent, fetchContent } from "@/app/apis/manage/unitGroupsApi"; // <-- Unique.
import ManageBase from "@/app/components/manage/ManageBase";
import UnitGroupModal from "@/app/components/modals/manage/UnitGroupModal"; // <-- Unique.
import DeleteModal from "@/app/components/modals/DeleteModal";
import { badgeClass } from "@/app/components/manage/ManageClasses";
import { useEffect, useState } from "react";

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
  } = useManage<UnitGroupItem, UnitGroupFilters>(async (params) => {
    // <-- Unique.
    try {
      const result = await fetchContent(params);
      return {
        items: result.items,
        total: result.total,
        counts: result.counts,
      };
    } catch (err: any) {
      notify("error", err.message || "Kunde inte hämta enhetsgrupper"); // <-- Unique.
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
      notify("success", "Enhetsgrupp borttagen!", 4000); // <-- Unique.
    } catch (err) {
      notify("error", String(err));
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
            <span className="w-full font-semibold">Status: </span>
            <span
              className={`${badgeClass} ${item.hasUnits ? "bg-[var(--locked)]" : "bg-[var(--unlocked)]"} w-max-[104px] w-[104px] text-[var(--text-main-reverse)]`}
            >
              {item.hasUnits ? "Används" : "Används inte"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "creationDate, createdBy",
      getValue: (item: UnitGroupItem) => (
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
      getValue: (item: UnitGroupItem) => (
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
      getValue: (item: UnitGroupItem) => item.name,
      responsivePriority: 0,
    },
    {
      key: "hasUnits",
      label: "Status",
      sortingItem: "hasUnits",
      labelAsc: "används",
      labelDesc: "används inte",
      classNameAddition: "w-[132px] min-w-[132px]",
      childClassNameAddition: "w-[104px] min-w-[104px]",
      getValue: (item: UnitGroupItem) => (
        <span
          className={`${badgeClass} ${item.hasUnits ? "bg-[var(--locked)]" : "bg-[var(--unlocked)]"} w-full text-[var(--text-main-reverse)]`}
        >
          {item.hasUnits ? "Används" : "Används inte"}
        </span>
      ),
      responsivePriority: 1,
    },
  ];

  // --- Filter Controls (Unique) ---
  const filterControls = {
    showHasUnits: filters.hasUnits === true,
    setShowHasUnits: (val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        hasUnits: val ? true : undefined,
      }));
    },

    showNoUnits: filters.hasUnits === false,
    setShowNoUnits: (val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        hasUnits: val ? false : undefined,
      }));
    },
  };

  // --- Filter List (Unique)
  const filterList = () => [
    {
      label: "Status",
      breakpoint: "ml",
      options: [
        {
          label: "Används",
          isSelected: filterControls.showHasUnits,
          setSelected: filterControls.setShowHasUnits,
          count: counts?.hasUnits,
        },
        {
          label: "Används inte",
          isSelected: filterControls.showNoUnits,
          setSelected: filterControls.setShowNoUnits,
          count: counts?.noUnits,
        },
      ],
    },
  ];

  return (
    <>
      <ManageBase<UnitGroupItem> // <-- Unique.
        itemName="enhetsgrupp" // <-- Unique.
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
      />
    </>
  );
};

export default UnitGroupsClient; // <-- Unique.
