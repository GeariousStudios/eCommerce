import { useTranslations } from "next-intl";
import { MasterPlanFilters, MasterPlanItem } from "../../types/manageTypes";

const token = localStorage.getItem("token");
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export type SortOrder = "asc" | "desc";

// --- admin/manage/units/master-plans/MasterPlansClient.tsx ---
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
  filters?: MasterPlanFilters;
}): Promise<{ items: MasterPlanItem[]; total: number; counts?: any }> => {
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

  if (filters?.allowRemovingElements !== undefined) {
    params.append(
      "allowRemovingElements",
      String(filters.allowRemovingElements),
    );
  }

  if (filters?.unitGroupIds) {
    for (const id of filters.unitGroupIds) {
      params.append("unitGroupIds", id.toString());
    }
  }

  filters?.unitIds?.forEach((id) => {
    params.append("unitIds", id.toString());
  });

  filters?.masterPlanFieldIds?.forEach((id) => {
    params.append("fieldIds", id.toString());
  });
  // --- FILTERS STOP ---

  const response = await fetch(`${apiUrl}/master-plan?${params}`, {
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
  const response = await fetch(`${apiUrl}/master-plan/delete/${id}`, {
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

export type UnitGroupOption = {
  id: number;
  name: string;
};

export const fetchUnitGroups = async (): Promise<UnitGroupOption[]> => {
  const response = await fetch(`${apiUrl}/unit-group`, {
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

export type MasterPlanFieldOption = {
  id: number;
  name: string;
};

export const fetchMasterPlanFields = async (): Promise<
  MasterPlanFieldOption[]
> => {
  const response = await fetch(
    `${apiUrl}/master-plan-field?sortBy=name&sortOrder=asc`,
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

  return result.items ?? [];
};

export type UnitOption = {
  id: number;
  name: string;
  unitGroupName?: string;
  lightColorHex: string;
  darkColorHex: string;
  reverseColor: boolean;
  lightTextColorHex: string;
  darkTextColorHex: string;
  masterPlanId?: number;
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
