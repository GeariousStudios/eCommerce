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

// --- report/manage/CategoriesClient.tsx ---
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

// --- report/manage/UnitGroupsClient.tsx ---
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

// --- report/manage/UnitsClient.tsx ---
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

// --- report/manage/UnitColumnsClient.tsx ---
export type UnitColumnDataType = "Number" | "Text" | "Boolean";
export const dataTypeOptions: { label: string; value: UnitColumnDataType }[] = [
  {
    label: "Number",
    value: "Number",
  },
  {
    label: "Text",
    value: "Text",
  },
  // {
  //   label: "Boolean",
  //   value: "Boolean",
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
