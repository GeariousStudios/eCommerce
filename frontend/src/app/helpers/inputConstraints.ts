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
  comparisonText: { maxLength: 32 },
};

// --- UnitGroupModal ---
export const unitGroupConstraints = {
  name: { maxLength: 16 },
};

// --- UnitModal ---
export const unitConstraints = {
  name: { maxLength: 16 },
  colorHex: { pattern: /^#([0-9A-Fa-f]{6})$/ },
};

// --- ShiftModal ---
export const shiftConstraints = {
  name: { maxLength: 32 },
  colorHex: { pattern: /^#([0-9A-Fa-f]{6})$/ },
};

// --- ShiftTeamModal ---
export const shiftTeamConstraints = {
  name: { maxLength: 32 },
  colorHex: { pattern: /^#([0-9A-Fa-f]{6})$/ },
};

// --- TrendingPanel ---
export const trendingPanelConstraints = {
  name: { maxLength: 32 },
};

// --- StopTypeModal ---
export const stopTypeConstraints = {
  name: { maxLength: 32 },
  colorHex: { pattern: /^#([0-9A-Fa-f]{6})$/ },
};

// --- MasterPlanModal ---
export const masterPlanConstraints = {
  name: { maxLength: 32 },
  masterPlanFieldName: { maxLength: 32 },
};