import { useTranslations } from "next-intl";
import {
  MasterPlanFieldFilters,
  MasterPlanFieldItem,
} from "../../types/manageTypes";

const token = localStorage.getItem("token");
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export type SortOrder = "asc" | "desc";

// --- admin/manage/units/master-plan-fields/MasterPlanFieldsClient.tsx ---
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
  filters?: MasterPlanFieldFilters;
}): Promise<{ items: MasterPlanFieldItem[]; total: number; counts?: any }> => {
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

  filters?.masterPlanIds?.forEach((id) => {
    params.append("masterPlanIds", id.toString());
  });

  filters?.dataTypes?.forEach((type) => {
    params.append("dataType", type);
  });

  filters?.alignments?.forEach((alignment) => {
    params.append("alignment", alignment);
  });
  // --- FILTERS STOP ---

  const response = await fetch(`${apiUrl}/master-plan-field?${params}`, {
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
  const response = await fetch(`${apiUrl}/master-plan-field/delete/${id}`, {
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

export type MasterPlanOption = {
  id: number;
  name: string;
};

export const fetchMasterPlans = async (): Promise<MasterPlanOption[]> => {
  const response = await fetch(
    `${apiUrl}/master-plan?sortBy=name&sortOrder=asc`,
    {
      headers: {
        "X-User-Language": localStorage.getItem("language") || "sv",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (response.status === 401) {
    localStorage.removeItem("token");
  }

  const result = await response.json();

  return Array.isArray(result.items) ? result.items : [];
};
