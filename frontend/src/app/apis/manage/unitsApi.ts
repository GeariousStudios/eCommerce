import { useTranslations } from "next-intl";
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

  if (filters?.shiftIds) {
    for (const id of filters.shiftIds) {
      params.append("shiftIds", id.toString());
    }
  }

  if (filters?.stopTypeIds) {
    for (const id of filters.stopTypeIds) {
      params.append("stopTypeIds", id.toString());
    }
  }
  // --- FILTERS STOP ---

  const response = await fetch(`${apiUrl}/unit?${params}`, {
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
  const response = await fetch(`${apiUrl}/unit/delete/${id}`, {
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

export type UnitColumnOption = {
  id: number;
  name: string;
};

export const fetchUnitColumns = async (): Promise<UnitColumnOption[]> => {
  const response = await fetch(`${apiUrl}/unit-column`, {
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

export type CategoryOption = {
  id: number;
  name: string;
};

export const fetchCategories = async (): Promise<CategoryOption[]> => {
  const response = await fetch(`${apiUrl}/category`, {
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

export type ShiftOption = {
  id: number;
  name: string;
  lightColorHex: string;
  darkColorHex: string;
  lightTextColorHex: string;
  darkTextColorHex: string;
};

export const fetchShifts = async (): Promise<ShiftOption[]> => {
  const response = await fetch(`${apiUrl}/shift`, {
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

export type StopTypeOption = {
  id: number;
  name: string;
  lightColorHex: string;
  darkColorHex: string;
  lightTextColorHex: string;
  darkTextColorHex: string;
};

export const fetchStopTypes = async (): Promise<StopTypeOption[]> => {
  const response = await fetch(`${apiUrl}/stop-type`, {
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
