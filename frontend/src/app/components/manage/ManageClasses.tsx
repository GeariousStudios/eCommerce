export const thClass =
  "pl-4 p-2 min-w-48 h-[40px] cursor-pointer border border-t-0 border-(--border-secondary) border-b-(--border-main) text-left transition-[background] duration-(--fast) hover:bg-(--bg-grid-header-hover)";

export const tdClass =
  "py-2 px-4 min-w-48 h-[40px] border border-b-0 border-(--border-secondary) text-left break-all";

export const filterClass =
  "truncate font-semibold transition-colors duration-(--fast) group-hover:text-(--accent-color)";

export const filterIconClass =
  "h-6 w-6 transition-[color,rotate] duration-(--fast) group-hover:text-(--accent-color)";

export const viewClass =
  "h-6 w-6 transition-[color,rotate] duration-(--fast) group-hover:text-(--accent-color)";

export const badgeClass =
  "flex min-h-6 h-auto py-1 items-center justify-center rounded-full bg-(--accent-color) px-4 text-sm font-semibold text-(--text-main-light) break-all";

const priorityClasses = [
  "",
  "hidden sm:table-cell",
  "hidden md:table-cell",
  "hidden lg:table-cell",
  "hidden xl:table-cell",
  "hidden 2xl:table-cell",
];

export const getResponsiveClass = (priority?: number) =>
  priority !== undefined && priority < priorityClasses.length
    ? priorityClasses[priority]
    : "";
