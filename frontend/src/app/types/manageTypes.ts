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
  units: string[];

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
  hasUnits: boolean;

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type UnitGroupFilters = {
  hasUnits?: boolean;
};

// --- report/manage/UnitsClient.tsx ---
export type UnitItem = {
  id: number;
  name: string;
  unitGroupName: string;
  isHidden?: boolean;

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type UnitFilters = {
  unitGroupIds?: number[];
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
