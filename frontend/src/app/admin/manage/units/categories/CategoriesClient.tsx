"use client";

import { useToast } from "../../../../components/toast/ToastProvider";
import useManage from "@/app/hooks/useManage";
import { CategoryFilters, CategoryItem } from "@/app/types/manageTypes"; // <-- Unique.
import {
  deleteContent,
  fetchContent,
  fetchUnits,
  UnitOption,
} from "@/app/apis/manage/categoriesApi"; // <-- Unique.
import ManageBase from "@/app/components/manage/ManageBase";
import CategoryModal from "@/app/components/modals/admin/units/CategoryModal"; // <-- Unique.
import DeleteModal from "@/app/components/modals/DeleteModal";
import { badgeClass } from "@/app/components/manage/ManageClasses";
import { useEffect, useState } from "react";
import { utcIsoToLocalDateTime } from "@/app/helpers/timeUtils";
import { useTranslations } from "next-intl";

type Props = {
  isConnected: boolean | null;
};

const CategoriesClient = (props: Props) => {
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
  } = useManage<CategoryItem, CategoryFilters>(
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
          err.message || t("Manage/Failed to fetch") + t("Common/categories"),
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
      notify("success", t("Common/Category") + t("Manage/deleted"), 4000); // <-- Unique.
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
            <span className="w-full font-semibold">
              {t("Categories/Sub categories")}:
            </span>
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
            <span className="w-full font-semibold">
              {t("Manage/Used by units")}:
            </span>
            {item.units.length === 0 ? (
              <span className="-mt-2">-</span>
            ) : (
              item.units.map((unit, i) => {
                const isDuplicate = nameCounts[unit.name] > 1;
                const matchingUnit = units.find((u) => u.name === unit.name);
                const label =
                  isDuplicate && matchingUnit?.unitGroupName
                    ? `${unit.name} (${matchingUnit.unitGroupName})`
                    : unit.name;

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
      getValue: (item: CategoryItem) => (
        <p className="flex flex-col">
          <span className="font-semibold">{t("Common/Created")}</span>
          {utcIsoToLocalDateTime(item.creationDate)} {t("Common/by")}{" "}
          {item.createdBy}
        </p>
      ),
    },
    {
      key: "updateDate, updatedBy",
      getValue: (item: CategoryItem) => (
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
      getValue: (item: CategoryItem) => item.name,
      responsivePriority: 0,
    },
    {
      key: "subCategories",
      label: t("Categories/Sub categories"),
      sortingItem: "subCategories",
      labelAsc: t("Categories/sub category amount") + t("Manage/ascending"),
      labelDesc: t("Categories/sub category amount") + t("Manage/descending"),
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
      label: t("Manage/Used by units"),
      sortingItem: "unitcount",
      labelAsc: t("Manage/unit amount") + t("Manage/ascending"),
      labelDesc: t("Manage/unit amount") + t("Manage/descending"),
      getValue: (item: CategoryItem) => (
        <div className="flex flex-wrap gap-2">
          {item.units.map((unit, i) => {
            const isDuplicate = nameCounts[unit.name] > 1;
            const matchingUnit = units.find((u) => u.name === unit.name);
            const label =
              isDuplicate && matchingUnit?.unitGroupName
                ? `${unit.name} (${matchingUnit.unitGroupName})`
                : unit.name;

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
      responsivePriority: 3,
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
      label: t("Categories/Sub categories"),
      breakpoint: "ml",
      options: [
        {
          label: t("Categories/Has sub categories"),
          isSelected: filterControls.showWithSubCategories,
          setSelected: filterControls.setShowWithSubCategories,
          count: counts?.subCategoryCount?.["With"] ?? 0,
        },
        {
          label: t("Categories/No sub categories"),
          isSelected: filterControls.showWithoutSubCategories,
          setSelected: filterControls.setShowWithoutSubCategories,
          count: counts?.subCategoryCount?.["Without"] ?? 0,
        },
      ],
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
  ];

  // const anySelectedInUse = () => {
  //   // <-- Unique.
  //   return items.some(
  //     (item) => deletingItemIds.includes(item.id) && item.units.length > 0,
  //   );
  // };

  return (
    <>
      <ManageBase<CategoryItem> // <-- Unique.
        itemName={t("Common/category")} // <-- Unique.
        items={items}
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        toggleEditItemModal={toggleEditItemModal}
        toggleDeleteItemModal={toggleDeleteItemModal}
        isLoading={isLoading}
        isConnected={props.isConnected === true}
        selectMessage="Manage/Select1" // <-- Unique.
        editLimitMessage="Manage/EditLimit1" // <-- Unique.
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
        // confirmOnDelete={anySelectedInUse()} // <-- Unique.
      />
    </>
  );
};

export default CategoriesClient; // <-- Unique.
