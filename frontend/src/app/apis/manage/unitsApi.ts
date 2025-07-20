import { UnitFilters, UnitItem } from "../../types/manageTypes";

const token = localStorage.getItem("token");
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export type SortOrder = "asc" | "desc";

// --- report/manage/UnitsClient.tsx ---
export const fetchContent = async ({
  page,
  pageSize,
  sortBy,
  sortOrder,
  search,
  filters,
}: {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: SortOrder;
  search: string;
  filters?: UnitFilters;
}): Promise<{ items: UnitItem[]; total: number; counts?: any }> => {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sortBy,
    sortOrder,
    search,
  });

  // --- FILTERS START ---
  if (filters?.isHidden !== undefined) {
    params.append("isHidden", String(filters.isHidden));
  }

  if (filters?.unitGroupIds) {
    for (const id of filters.unitGroupIds) {
      params.append("unitGroupIds", id.toString());
    }
  }

  if (filters?.unitColumnIds) {
    for (const id of filters.unitColumnIds) {
      params.append("unitColumnIds", id.toString());
    }
  }

  if (filters?.categoryIds) {
    for (const id of filters.categoryIds) {
      params.append("categoryIds", id.toString());
    }
  }
  // --- FILTERS STOP ---

  const response = await fetch(`${apiUrl}/unit?${params}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
  }

  const result = await response.json();

  return {
    items: Array.isArray(result.items) ? result.items : [],
    total: result.totalCount ?? 0,
    counts: result.counts ?? null,
  };
};

export const deleteContent = async (id: number): Promise<void> => {
  const response = await fetch(`${apiUrl}/unit/delete/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    return;
  }

  if (!response.ok) {
    let errorMessage = "Kunde inte ta bort enheten";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = await response.text();
    }
    throw new Error(errorMessage);
  }
};

export type UnitGroupOption = {
  id: number;
  name: string;
};

export const fetchUnitGroups = async (): Promise<UnitGroupOption[]> => {
  const response = await fetch(`${apiUrl}/unit-group`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
  }

  const result = await response.json();

  return result.items ?? [];
};

export type UnitColumnOption = {
  id: number;
  name: string;
};

export const fetchUnitColumns = async (): Promise<UnitColumnOption[]> => {
  const response = await fetch(`${apiUrl}/unit-column`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
  }

  const result = await response.json();

  return result.items ?? [];
};

export type CategoryOption = {
  id: number;
  name: string;
};

export const fetchCategories = async (): Promise<CategoryOption[]> => {
  const response = await fetch(`${apiUrl}/category`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
  }

  const result = await response.json();

  return result.items ?? [];
};
