import { useEffect, useState } from "react";

type SortOrder = "asc" | "desc";

type UseManageOptions = {
  initialSortBy?: string;
  initialSortOrder?: SortOrder;
};

const useManage = <
  TItem extends { id: number },
  TFilters extends Record<string, any> = Record<string, any>,
>(
  fetchFunction: (params: {
    page: number;
    pageSize: number;
    sortBy: string;
    sortOrder: SortOrder;
    search: string;
    filters?: TFilters;
  }) => Promise<{ items: TItem[]; total: number; counts?: any }>,
  options?: UseManageOptions,
) => {
  // --- States: Items ---
  const [items, setItems] = useState<TItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [deletingItemIds, setDeletingItemIds] = useState<number[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  //   --- States: Loading ---
  const [isLoading, setIsLoading] = useState(false);

  // --- States: Pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [totalItems, setTotalItems] = useState<number | null>(null);

  // --- States: Sort & Search ---
  const [sortBy, setSortBy] = useState<string>(options?.initialSortBy ?? "id");
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    options?.initialSortOrder ?? "asc",
  );

  // --- States: Search & Filtering ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<TFilters>({} as TFilters);
  const [counts, setCounts] = useState<any>();
  const [isGrid, setIsGrid] = useState(false);

  const fetchItems = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }

      const data = await fetchFunction({
        page: currentPage,
        pageSize: itemsPerPage,
        sortBy,
        sortOrder,
        search: searchTerm,
        filters,
      });

      setItems(data.items);
      setTotalItems(data.total);
      setCounts(data.counts);
    } catch (error) {
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  // --- FETCH FREQUENCY ---
  useEffect(() => {
    fetchItems();
  }, [currentPage, itemsPerPage, sortBy, sortOrder, searchTerm, filters]);

  // --- When filtering, go to page 1 ---
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // --- SORTING ---
  const handleSort = (field: string) => {
    const isSameField = sortBy === field;
    const newSortOrder: SortOrder =
      isSameField && sortOrder === "asc" ? "desc" : "asc";

    setSortBy(field);
    setSortOrder(newSortOrder);
  };

  return {
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
  };
};

export default useManage;
