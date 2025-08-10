import { useTranslations } from "next-intl";

// --- developer/manage/UsersClient.tsx ---
export type UserItem = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles: string[];
  isLocked: boolean;

  isOnline: boolean;
  creationDate: string;
  lastLogin: string | null;
};

export type UserFilters = {
  roles?: string[];
  isLocked?: boolean;
};

// --- admin/manage/units/CategoriesClient.tsx ---
export type CategoryItem = {
  id: number;
  name: string;
  subCategories: string[];
  units: {
    id: number;
    name: string;
    categoryId?: number;
    unitGroupName?: string;
  }[];

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type CategoryFilters = {
  unitIds?: number[];
  hasSubCategories?: boolean;
};

// --- admin/manage/units/UnitColumnsClient.tsx ---
export type UnitColumnDataType = "Number" | "Text" | "Boolean";
export const getDataTypeOptions = (t: (key: string) => string) => [
  {
    label: t("Common/Number"),
    value: "Number" as UnitColumnDataType,
  },
  {
    label: t("Common/Text"),
    value: "Text" as UnitColumnDataType,
  },
  // {
  //   label: t("Common/Boolean"),
  //   value: "Boolean" as UnitColumnDataType,
  // },
];

export type UnitColumnItem = {
  id: number;
  name: string;
  dataType: UnitColumnDataType;
  hasData: boolean;
  units: string[];

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type UnitColumnFilters = {
  dataTypes?: UnitColumnDataType[];
  hasData?: boolean;
  unitIds?: number[];
};

// --- admin/manage/units/UnitGroupsClient.tsx ---
export type UnitGroupItem = {
  id: number;
  name: string;
  unitGroup: string;
  units: {
    id: number;
    name: string;
  }[];

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type UnitGroupFilters = {
  unitIds?: number[];
};

// --- admin/manage/UnitsClient.tsx ---
export type UnitItem = {
  id: number;
  name: string;
  unitGroupName: string;
  unitColumnIds: number[];
  categoryIds: number[];
  isHidden?: boolean;

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type UnitFilters = {
  unitGroupIds?: number[];
  unitColumnIds?: number[];
  categoryIds?: number[];
  isHidden?: boolean;
};

// --- admin/manage/NewsTypesClient.tsx ---
export type NewsTypeItem = {
  id: number;
  name: string;

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type NewsTypeFilters = {};

// --- admin/manage/ShiftsClient.tsx ---
export type ShiftItem = {
  id: number;
  name: string;
  units: {
    id: number;
    name: string;
  }[];

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type ShiftFilters = {
  unitIds?: number[];
};

// --- admin/manage/ShiftTeamsClient.tsx ---
export type ShiftTeamItem = {
  id: number;
  name: string;
  shifts: {
    id: number;
    name: string;
  }[];

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type ShiftTeamFilters = {
  shiftIds?: number[];
};
