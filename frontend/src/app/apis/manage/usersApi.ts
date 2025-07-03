import { UserFilters, UserItem } from "../../types/manageTypes";

const token = localStorage.getItem("token");
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export type SortOrder = "asc" | "desc";

// --- developer/manage/UsersClient.tsx ---
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
  filters?: UserFilters;
}): Promise<{ items: UserItem[]; total: number; counts?: any }> => {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sortBy,
    sortOrder,
    search,
  });

  // --- FILTERS START ---
  if (filters?.isLocked !== undefined) {
    params.append("isLocked", String(filters.isLocked));
  }

  filters?.roles?.forEach((role) => {
    params.append("roles", role);
  });
  // --- FILTERS STOP ---

  const response = await fetch(`${apiUrl}/user-management?${params}`, {
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
  const response = await fetch(`${apiUrl}/user-management/delete/${id}`, {
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
    let errorMessage = "Kunde inte ta bort användaren";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = await response.text();
    }
    throw new Error(errorMessage);
  }
};
