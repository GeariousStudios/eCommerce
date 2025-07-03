"use client";

import { useToast } from "../../../components/toast/ToastProvider";
import useManage from "@/app/hooks/useManage";
import { CategoryFilters, CategoryItem } from "@/app/types/manageTypes"; // <-- Unique.
import {
  deleteContent,
  fetchContent,
  fetchUnits,
  UnitOption,
} from "@/app/apis/manage/categoriesApi"; // <-- Unique.
import ManageBase from "@/app/components/manage/ManageBase";
import CategoryModal from "@/app/components/modals/manage/CategoryModal"; // <-- Unique.
import DeleteModal from "@/app/components/modals/DeleteModal";
import { badgeClass } from "@/app/components/manage/ManageClasses";
import { useEffect, useState } from "react";

type Props = {
  isConnected: boolean | null;
};

const CategoriesClient = (props: Props) => {
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
  } = useManage<CategoryItem, CategoryFilters>(async (params) => {
    // <-- Unique.
    try {
      const result = await fetchContent(params);
      return {
        items: result.items,
        total: result.total,
        counts: result.counts,
      };
    } catch (err: any) {
      notify("error", err.message || "Kunde inte hämta kategorier"); // <-- Unique.
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
  const [units, setUnits] = useState<UnitOption[]>([]);
  useEffect(() => {
    fetchUnits()
      .then(setUnits)
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
      notify("success", "Kategori borttagen!", 4000); // <-- Unique.
    } catch (err: any) {
      notify("error", err?.message || String(err));
    }
  };

  // --- Grid Items (Unique) ---
  const gridItems = () => [
    {
      key: "name, subCategories, units",
      getValue: (item: CategoryItem) => (
        <div className="flex flex-col gap-4 rounded-2xl bg-[var(--bg-grid-header)] p-4">
          <div className="flex flex-col">
            <span className="flex items-center justify-between text-2xl font-bold">
              <span className="flex items-center">{item.name}</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">Underkategorier:</span>
            <>
              {item.subCategories.length === 0 ? (
                <span className="-mt-2">-</span>
              ) : (
                item.subCategories.map((category, i) => (
                  <span
                    key={i}
                    className={`${badgeClass} bg-[var(--accent-color)] text-[var(--text-main-reverse)]`}
                  >
                    {category}
                  </span>
                ))
              )}
            </>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">Enheter med åtkomst:</span>
            {item.units.length === 0 ? (
              <span className="-mt-2">-</span>
            ) : (
              item.units.map((unit, i) => (
                <span
                  key={i}
                  className={`${badgeClass} bg-[var(--badge-main)] text-[var(--text-main-reverse)]`}
                >
                  {unit}
                </span>
              ))
            )}
          </div>
        </div>
      ),
    },
    {
      key: "creationDate, createdBy",
      getValue: (item: CategoryItem) => (
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
      getValue: (item: CategoryItem) => (
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
      getValue: (item: CategoryItem) => item.name,
      responsivePriority: 0,
    },
    {
      key: "subCategories",
      label: "Underkategorier",
      sortingItem: "subCategories",
      labelAsc: "underkategorier Ö-A",
      labelDesc: "underkategorier A-Ö",
      getValue: (item: CategoryItem) => (
        <div className="flex flex-wrap gap-2">
          {item.subCategories.map((category, i) => (
            <span
              key={i}
              className={`${badgeClass} bg-[var(--accent-color)] text-[var(--text-main-reverse)]`}
            >
              {category}
            </span>
          ))}
        </div>
      ),
      responsivePriority: 1,
    },
    {
      key: "units",
      label: "Enheter med åtkomst",
      sortingItem: "unitCount",
      labelAsc: "antal enheter (stigande)",
      labelDesc: "antal enheter (fallande)",
      getValue: (item: CategoryItem) => (
        <div className="flex flex-wrap gap-2">
          {item.units.map((unit, i) => (
            <span
              key={i}
              className={`${badgeClass} bg-[var(--badge-main)] text-[var(--text-main-reverse)]`}
            >
              {unit}
            </span>
          ))}
        </div>
      ),
      responsivePriority: 2,
    },
  ];

  // --- Filter Controls (Unique) ---
  const filterControls = {
    showWithSubCategories: filters.hasSubCategories === true,
    setShowWithSubCategories: (val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        hasSubCategories: val ? true : undefined,
      }));
    },

    showWithoutSubCategories: filters.hasSubCategories === false,
    setShowWithoutSubCategories: (val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        hasSubCategories: val ? false : undefined,
      }));
    },

    selectedUnits: filters.unitIds ?? [],
    toggleUnit: (unitId: number) => {
      setFilters((prev) => {
        const units = new Set(prev.unitIds ?? []);
        if (units.has(unitId)) {
          units.delete(unitId);
        } else {
          units.add(unitId);
        }
        return { ...prev, unitIds: Array.from(units) };
      });
    },
  };

  // --- Filter List (Unique)
  const filterList = () => [
    {
      label: "Underkategorier",
      breakpoint: "ml",
      options: [
        {
          label: "Har underkategorier",
          isSelected: filterControls.showWithSubCategories,
          setSelected: filterControls.setShowWithSubCategories,
          count: counts?.withSubCategories,
        },
        {
          label: "Inga underkategorier",
          isSelected: filterControls.showWithoutSubCategories,
          setSelected: filterControls.setShowWithoutSubCategories,
          count: counts?.withoutSubCategories,
        },
      ],
    },
    {
      label: "Enheter med åtkomst",
      breakpoint: "lg",
      options: units.map((unit) => ({
        label: unit.name,
        isSelected: filterControls.selectedUnits.includes(unit.id),
        setSelected: () => filterControls.toggleUnit(unit.id),
        count: counts?.unitCount?.[unit.name],
      })),
    },
  ];

  return (
    <>
      <ManageBase<CategoryItem> // <-- Unique.
        itemName="kategori" // <-- Unique.
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
      <CategoryModal // <-- Unique.
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

export default CategoriesClient; // <-- Unique.
