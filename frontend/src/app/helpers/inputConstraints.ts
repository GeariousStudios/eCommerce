// --- UserModal ---
export const userConstraints = {
  firstName: { maxLength: 32 },
  lastName: { maxLength: 32 },
  username: { maxLength: 16, pattern: "^\\S+$" },
  password: { minLength: 8, maxLength: 128, pattern: "^\\S+$" },
  email: { maxLength: 320 },
};

// --- NewsTypeModal ---
export const newsTypeConstraints = {
  name: { maxLength: 32 },
};

// --- CategoryModal ---
export const categoryConstraints = {
  name: { maxLength: 32 },
  subCategoryName: { maxLength: 32 },
};

// --- UnitColumnModal ---
export const unitColumnConstraints = {
  name: { maxLength: 32 },
};

// --- UnitGroupModal ---
export const unitGroupConstraints = {
  name: { maxLength: 16 },
};

// --- UnitModal ---
export const unitConstraints = {
  name: { maxLength: 16 },
};

// --- ShiftModal ---
export const shiftConstraints = {
  name: { maxLength: 16 },
};
