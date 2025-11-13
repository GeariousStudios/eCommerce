import { useTranslations } from "next-intl";

// --- developer/manage/users/UsersClient.tsx ---
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

// --- admin/manage/units/categories/CategoriesClient.tsx ---
export type CategoryItem = {
  id: number;
  name: string;
  subCategories: string[];
  units: {
    id: number;
    name: string;
    categoryId?: number;
    unitGroupName?: string;
    lightColorHex: string;
    darkColorHex: string;
    lightTextColorHex: string;
    darkTextColorHex: string;
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

// --- admin/manage/units/unit-columns/UnitColumnsClient.tsx ---
export type UnitColumnDataType = "Number" | "Text" | "Boolean";
export const getUnitColumnDataTypeOptions = (t: (key: string) => string) => [
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
  perHour: boolean;
  perHourName?: string;
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

// --- admin/manage/units/unit-groups/UnitGroupsClient.tsx ---
export type UnitGroupItem = {
  id: number;
  name: string;
  unitGroup: string;
  units: {
    id: number;
    name: string;
    lightColorHex: string;
    darkColorHex: string;
    lightTextColorHex: string;
    darkTextColorHex: string;
  }[];

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type UnitGroupFilters = {
  unitIds?: number[];
};

// --- admin/manage/units/UnitsClient.tsx ---
export type UnitItem = {
  id: number;
  name: string;
  unitGroupName: string;
  unitColumnIds: number[];
  categoryIds: number[];
  shiftIds: number[];
  stopTypeIds: number[];
  isHidden?: boolean;
  isPlannable?: boolean;
  masterPlanName: string;
  lightColorHex: string;
  darkColorHex: string;
  lightTextColorHex: string;
  darkTextColorHex: string;

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type UnitFilters = {
  unitGroupIds?: number[];
  unitColumnIds?: number[];
  categoryIds?: number[];
  shiftIds?: number[];
  stopTypeIds?: number[];
  isPlannable?: boolean;
  masterPlanIds?: number[];
  isHidden?: boolean;
};

// --- admin/manage/news/NewsTypesClient.tsx ---
export type NewsTypeItem = {
  id: number;
  name: string;

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type NewsTypeFilters = {};

// --- admin/manage/shifts/ShiftsClient.tsx ---
export type ShiftItem = {
  id: number;
  name: string;
  units: {
    id: number;
    name: string;
    lightColorHex: string;
    darkColorHex: string;
    lightTextColorHex: string;
    darkTextColorHex: string;
  }[];
  shiftTeams: {
    id: number;
    name: string;
    lightColorHex: string;
    darkColorHex: string;
    lightTextColorHex: string;
    darkTextColorHex: string;
  }[];
  isHidden?: boolean;
  lightColorHex: string;
  darkColorHex: string;
  lightTextColorHex: string;
  darkTextColorHex: string;

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type ShiftFilters = {
  unitIds?: number[];
  shiftTeamIds?: number[];
  isHidden?: boolean;
};

// --- admin/manage/shifts/shift-teams/ShiftTeamsClient.tsx ---
export type ShiftTeamItem = {
  id: number;
  name: string;
  shifts: {
    id: number;
    name: string;
    lightColorHex: string;
    darkColorHex: string;
    lightTextColorHex: string;
    darkTextColorHex: string;
  }[];
  isHidden?: boolean;
  lightColorHex: string;
  darkColorHex: string;
  lightTextColorHex: string;
  darkTextColorHex: string;

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type ShiftTeamFilters = {
  shiftIds?: number[];
  isHidden?: boolean;
};

// --- admin/manage/planned-stops/stop-types/StopTypesClient.tsx ---
export type StopTypeItem = {
  id: number;
  name: string;
  units: {
    id: number;
    name: string;
    lightColorHex: string;
    darkColorHex: string;
    lightTextColorHex: string;
    darkTextColorHex: string;
  }[];
  lightColorHex: string;
  darkColorHex: string;
  lightTextColorHex: string;
  darkTextColorHex: string;
  isHidden?: boolean;

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type StopTypeFilters = {
  unitIds?: number[];
  isHidden?: boolean;
};

// --- admin/manage/units/master-plans/MasterPlansClient.tsx ---
export type MasterPlanItem = {
  id: number;
  name: string;
  unitGroupName: string;
  units: {
    id: number;
    name: string;
    lightColorHex: string;
    darkColorHex: string;
    lightTextColorHex: string;
    darkTextColorHex: string;
  }[];
  fields: {
    id: number;
    name: string;
  }[];
  isHidden?: boolean;
  allowRemovingElements?: boolean;

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type MasterPlanFilters = {
  unitIds?: number[];
  unitGroupIds?: number[];
  masterPlanFieldIds?: number[];
  isHidden?: boolean;
  allowRemovingElements?: boolean;
};

// --- admin/manage/units/master-plan-fields/MasterPlanFieldsClient.tsx ---
export type MasterPlanFieldItem = {
  id: number;
  name: string;
  masterPlanIds: number[];
  dataType: MasterPlanFieldDataType;
  alignment: "Left" | "Center" | "Right";
  isHidden: boolean;

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type MasterPlanFieldFilters = {
  dataTypes?: MasterPlanFieldDataType[];
  alignments?: ("Left" | "Center" | "Right")[];
  masterPlanIds?: number[];
  isHidden?: boolean;
};

export type MasterPlanFieldDataType = "Number" | "Text" | "Boolean" | "Date";
export const getMasterPlanFieldDataTypeOptions = (
  t: (key: string) => string,
) => [
  {
    label: t("Common/Number"),
    value: "Number" as MasterPlanFieldDataType,
  },
  {
    label: t("Common/Text"),
    value: "Text" as MasterPlanFieldDataType,
  },
  // {
  //   label: t("Common/Boolean"),
  //   value: "Boolean" as MasterPlanFieldDataType,
  // },
  {
    label: t("Common/Date"),
    value: "Date" as MasterPlanFieldDataType,
  },
];

export type MasterPlanFieldAlignment = "Left" | "Center" | "Right";
export const getMasterPlanFieldAlignmentOptions = (
  t: (key: string) => string,
) => [
  {
    label: t("Common/Left"),
    value: "Left" as MasterPlanFieldAlignment,
  },
  {
    label: t("Common/Center"),
    value: "Center" as MasterPlanFieldAlignment,
  },
  {
    label: t("Common/Right"),
    value: "Right" as MasterPlanFieldAlignment,
  },
];
