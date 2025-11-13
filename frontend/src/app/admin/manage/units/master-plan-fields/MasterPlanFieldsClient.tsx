"use client";

import { useToast } from "../../../../components/toast/ToastProvider";
import useManage from "@/app/hooks/useManage";
import {
  getMasterPlanFieldAlignmentOptions,
  getMasterPlanFieldDataTypeOptions,
  MasterPlanFieldAlignment,
  MasterPlanFieldDataType,
  MasterPlanFieldFilters,
  MasterPlanFieldItem,
} from "@/app/types/manageTypes"; // <-- Unique.
import {
  deleteContent,
  fetchContent,
  fetchMasterPlans,
  MasterPlanOption,
} from "@/app/apis/manage/masterPlanFieldsApi"; // <-- Unique.
import ManageBase from "@/app/components/manage/ManageBase";
import MasterPlanFieldModal from "@/app/components/modals/admin/units/MasterPlanFieldModal"; // <-- Unique.
import DeleteModal from "@/app/components/modals/DeleteModal";
import { badgeClass } from "@/app/components/manage/ManageClasses";
import { useEffect, useState } from "react";
import { utcIsoToLocalDateTime } from "@/app/helpers/timeUtils";
import { useTranslations } from "next-intl";
import useTheme from "@/app/hooks/useTheme";
import { count } from "console";

type Props = {
  isConnected: boolean | null;
};

const MasterPlanFieldsClient = (props: Props) => {
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
  } = useManage<MasterPlanFieldItem, MasterPlanFieldFilters>(
    async (params) => {
      // <-- Unique.
      try {
        const result = await fetchContent(params);
        return {
          items: Array.isArray(result.items) ? result.items : [],
          total: result.total,
          counts: result.counts,
        };
      } catch (err: any) {
        notify(
          "error",
          err.message ||
            t("Manage/Failed to fetch") + t("Common/master plan fields"),
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

  // --- FETCH MASTER PLANS INITIALIZATION (Unique) ---
  const [masterPlans, setMasterPlans] = useState<MasterPlanOption[]>([]);
  useEffect(() => {
    fetchMasterPlans()
      .then(setMasterPlans)
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
      notify(
        "success",
        t("Common/Master plan field") + t("Manage/deleted2"),
        4000,
      ); // <-- Unique.
    } catch (err: any) {
      notify("error", err?.message || t("Modal/Unknown error"));
    }
  };

  // --- Theme ---
  const { currentTheme } = useTheme();

  // --- Grid Items (Unique) ---
  const gridItems = () => [
    {
      key: "name, isHidden, masterPlans",
      getValue: (item: MasterPlanFieldItem) => (
        <div className="flex flex-col gap-4 rounded-2xl bg-(--bg-grid-header) p-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-4 text-2xl font-bold">
              <span className="flex items-center">{item.name}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">
              {t("Common/Master plans")}:
            </span>
            <>
              {item.masterPlanIds.length === 0 ? (
                <span className="-mt-2">-</span>
              ) : (
                item.masterPlanIds.map((id, i) => {
                  const mp = masterPlans.find((x) => x.id === id);
                  return (
                    <span
                      key={i}
                      className={`${badgeClass} bg-(--badge-main) text-(--text-main-reverse)`}
                    >
                      {mp?.name}
                    </span>
                  );
                })
              )}
            </>
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
      getValue: (item: MasterPlanFieldItem) => (
        <p className="flex flex-col">
          <span className="font-semibold">{t("Common/Created")}</span>
          {utcIsoToLocalDateTime(item.creationDate)} {t("Common/by")}{" "}
          {item.createdBy}
        </p>
      ),
    },
    {
      key: "updateDate, updatedBy",
      getValue: (item: MasterPlanFieldItem) => (
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
      getValue: (item: MasterPlanFieldItem) => (
        <div className="flex items-center gap-4">{item.name}</div>
      ),
      responsivePriority: 0,
    },
    {
      key: "dataType",
      label: t("MasterPlanFieldModal/Data type"),
      sortingItem: "datatype",
      labelAsc: t("MasterPlanFieldModal/data type") + " Ö-A",
      labelDesc: t("MasterPlanFieldModal/data type") + " A-Ö",
      getValue: (item: MasterPlanFieldItem) => (
        <span>{t("Common/" + item.dataType)}</span>
      ),
      responsivePriority: 2,
    },
    {
      key: "alignment",
      label: t("MasterPlanFieldModal/Alignment"),
      sortingItem: "alignment",
      labelAsc: t("MasterPlanFieldModal/alignment") + " Ö-A",
      labelDesc: t("MasterPlanFieldModal/alignment") + " A-Ö",
      getValue: (item: MasterPlanFieldItem) => (
        <span>{t("Common/" + item.alignment)}</span>
      ),
      responsivePriority: 3,
    },
    {
      key: "masterPlanName",
      label: t("Common/Master plans"),
      sortingItem: "masterplanname",
      labelAsc: t("Common/master plan") + " Ö-A",
      labelDesc: t("Common/master plan") + " A-Ö",
      getValue: (item: MasterPlanFieldItem) => (
        <div className="flex flex-wrap gap-2">
          {item.masterPlanIds.map((id, i) => {
            const mp = masterPlans.find((x) => x.id === id);
            return (
              <span
                key={i}
                className={`${badgeClass} bg-(--badge-main) text-(--text-main-reverse)`}
              >
                {mp?.name}
              </span>
            );
          })}
        </div>
      ),
      responsivePriority: 4,
    },
    {
      key: "isHidden",
      label: t("Common/Status"),
      sortingItem: "visibilitycount",
      labelAsc: t("MasterPlanFields/hidden master plan fields"),
      labelDesc: t("MasterPlanFields/visible master plan fields"),
      classNameAddition: "w-[100px] min-w-[100px]",
      childClassNameAddition: "w-[72px] min-w-[72px]",
      getValue: (item: MasterPlanFieldItem) => (
        <span
          className={`${badgeClass} ${item.isHidden ? "bg-(--locked)" : "bg-(--unlocked)"} w-full text-(--text-main-reverse)`}
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

    selectedMasterPlans: filters.masterPlanIds ?? [],
    setMasterPlanSelected: (masterPlanId: number, val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        masterPlanIds: val
          ? [...(prev.masterPlanIds ?? []), masterPlanId]
          : (prev.masterPlanIds ?? []).filter((id) => id !== masterPlanId),
      }));
    },

    selectedDataTypes: filters.dataTypes ?? [],
    toggleDataType: (type: MasterPlanFieldDataType) => {
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

    selectedAlignments: filters.alignments ?? [],
    toggleAlignment: (alignment: MasterPlanFieldAlignment) => {
      setFilters((prev) => {
        const alignments = new Set(prev.alignments ?? []);
        if (alignments.has(alignment)) {
          alignments.delete(alignment);
        } else {
          alignments.add(alignment);
        }
        return { ...prev, alignments: Array.from(alignments) };
      });
    },
  };

  // --- Filter List (Unique)
  const filterList = () => [
    {
      label: t("Common/Status"),
      breakpoint: "ml",
      options: [
        {
          label: t("MasterPlanFields/Visible master plan fields"),
          isSelected: filterControls.showVisible,
          setSelected: filterControls.setShowVisible,
          count: counts?.visibilityCount?.["Visible"] ?? 0,
        },
        {
          label: t("MasterPlanFields/Hidden master plan fields"),
          isSelected: filterControls.showHidden,
          setSelected: filterControls.setShowHidden,
          count: counts?.visibilityCount?.["Hidden"] ?? 0,
        },
      ],
    },
    {
      label: t("MasterPlanFieldModal/Data type"),
      breakpoint: "lg",
      options: getMasterPlanFieldDataTypeOptions(t).map(({ label, value }) => ({
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
      label: t("MasterPlanFieldModal/Alignment"),
      breakpoint: "xl",
      options: getMasterPlanFieldAlignmentOptions(t).map(
        ({ label, value }) => ({
          label,
          isSelected: filterControls.selectedAlignments.includes(value),
          setSelected: (val: boolean) => {
            const selected = filterControls.selectedAlignments.includes(value);
            if (val !== selected) {
              filterControls.toggleAlignment(value);
            }
          },
          count: counts?.alignmentCount?.[value] ?? 0,
        }),
      ),
    },
    {
      label: t("Common/Master plans"),
      breakpoint: "2xl",
      options: masterPlans.map((masterPlan) => ({
        label: masterPlan.name,
        isSelected: filterControls.selectedMasterPlans.includes(masterPlan.id),
        setSelected: (val: boolean) =>
          filterControls.setMasterPlanSelected(masterPlan.id, val),
        count: counts?.masterPlanCount?.[masterPlan.id] ?? 0,
      })),
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
      <ManageBase<MasterPlanFieldItem> // <-- Unique.
        itemName={t("Common/master plan field")} // <-- Unique.
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
      <MasterPlanFieldModal // <-- Unique.
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
            {t("MasterPlanFields/Confirm1")}
            <br />
            <br />
            {t("MasterPlanFields/Confirm2")}
            <br />
            <br />
            {t("MasterPlanFields/Confirm3")}
          </>
        }
      />
    </>
  );
};

export default MasterPlanFieldsClient; // <-- Unique.
