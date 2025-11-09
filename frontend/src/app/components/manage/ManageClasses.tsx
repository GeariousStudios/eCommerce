export const thClass =
  "pl-4 p-2 min-w-48 h-[40px] cursor-pointer border-1 border-t-0 border-[var(--border-secondary)] border-b-[var(--border-main)] text-left transition-[background] duration-[var(--fast)] hover:bg-[var(--bg-grid-header-hover)]";

export const tdClass =
  "py-2 px-4 min-w-48 h-[40px] border-1 border-b-0 border-[var(--border-secondary)] text-left break-all";

export const filterClass =
  "truncate font-semibold transition-colors duration-[var(--fast)] group-hover:text-[var(--accent-color)]";

export const filterIconClass =
  "h-6 w-6 transition-[color,rotate] duration-[var(--fast)] group-hover:text-[var(--accent-color)]";

export const viewClass =
  "h-6 w-6 transition-[color,rotate] duration-[var(--fast)] group-hover:text-[var(--accent-color)]";

export const badgeClass =
  "flex min-h-6 h-auto py-1 items-center justify-center rounded-full bg-[var(--accent-color)] px-4 text-sm font-semibold text-[var(--text-main-light)] break-all";

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
