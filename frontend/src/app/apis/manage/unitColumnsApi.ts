import { useTranslations } from "next-intl";
import { UnitColumnFilters, UnitColumnItem } from "../../types/manageTypes";

const token = localStorage.getItem("token");
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export type SortOrder = "asc" | "desc";

// --- report/manage/UnitColumnsClient.tsx ---
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
  filters?: UnitColumnFilters;
}): Promise<{ items: UnitColumnItem[]; total: number; counts?: any }> => {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sortBy,
    sortOrder,
    search,
  });

  // --- FILTERS START ---
  filters?.dataTypes?.forEach((type) => {
    params.append("dataTypes", type);
  });

  filters?.unitIds?.forEach((id) => {
    params.append("unitIds", id.toString());
  });
  // --- FILTERS STOP ---

  const response = await fetch(`${apiUrl}/unit-column?${params}`, {
    headers: {
      "X-User-Language": localStorage.getItem("language") || "sv",
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
  const response = await fetch(`${apiUrl}/unit-column/delete/${id}`, {
    method: "DELETE",
    headers: {
      "X-User-Language": localStorage.getItem("language") || "sv",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    return;
  }

  if (!response.ok) {
    // const t = useTranslations();
    // let errorMessage = t("Api/Failed to delete") + t("Common/column");
    // try {
    //   const errorData = await response.json();
    //   errorMessage = errorData.message || errorMessage;
    // } catch {
    //   errorMessage = await response.text();
    // }
    // throw new Error(errorMessage);
    let message = "Unknown error";
    try {
      const data = await response.json();
      message = data?.message || message;
    } catch {
      message = (await response.text()) || message;
    }
    throw new Error(message);
  }
};

export type UnitOption = {
  id: number;
  name: string;
  unitGroupName?: string;
};

export const fetchUnits = async (): Promise<UnitOption[]> => {
  const response = await fetch(`${apiUrl}/unit?sortBy=name&sortOrder=asc`, {
    headers: {
      "X-User-Language": localStorage.getItem("language") || "sv",
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
