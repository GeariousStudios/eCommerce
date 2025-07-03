"use client";

import { useToast } from "../../../components/toast/ToastProvider";
import useManage from "@/app/hooks/useManage";
import { NewsTypeFilters, NewsTypeItem } from "@/app/types/manageTypes"; // <-- Unique.
import { deleteContent, fetchContent } from "@/app/apis/manage/newsTypesApi"; // <-- Unique.
import ManageBase from "@/app/components/manage/ManageBase";
import NewsTypeModal from "@/app/components/modals/manage/NewsTypeModal"; // <-- Unique.
import DeleteModal from "@/app/components/modals/DeleteModal";

type Props = {
  isConnected: boolean | null;
};

const NewsTypesClient = (props: Props) => {
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
  } = useManage<NewsTypeItem, NewsTypeFilters>(async (params) => {
    // <-- Unique.
    try {
      const result = await fetchContent(params);
      return {
        items: result.items,
        total: result.total,
        counts: result.counts,
      };
    } catch (err: any) {
      notify("error", err.message || "Kunde inte hämta nyhetstyper"); // <-- Unique.
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
      notify("success", "Nyhetstyp borttagen!", 4000); // <-- Unique.
    } catch (err: any) {
      notify("error", err?.message || String(err));
    }
  };

  // --- Grid Items (Unique) ---
  const gridItems = () => [
    {
      key: "name",
      getValue: (item: NewsTypeItem) => (
        <div className="flex flex-col gap-4 rounded-2xl bg-[var(--bg-grid-header)] p-4">
          <div className="flex flex-col">
            <span className="flex items-center justify-between text-2xl font-bold">
              <span className="flex items-center">{item.name}</span>
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "creationDate, createdBy",
      getValue: (item: NewsTypeItem) => (
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
      getValue: (item: NewsTypeItem) => (
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
      getValue: (item: NewsTypeItem) => item.name,
      responsivePriority: 0,
    },
  ];

  return (
    <>
      <ManageBase<NewsTypeItem> // <-- Unique.
        itemName="nyhetstyp" // <-- Unique.
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
      />

      {/* --- MODALS --- */}
      <NewsTypeModal // <-- Unique.
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

export default NewsTypesClient; // <-- Unique.
