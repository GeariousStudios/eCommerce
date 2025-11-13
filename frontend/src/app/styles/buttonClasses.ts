// --- REGULAR ---
export const buttonPrimaryClass =
  "min-h-[40px] min-w-[40px] cursor-pointer rounded bg-(--button-primary) p-2 font-semibold text-(--text-main-reverse) transition-colors hover:bg-(--button-primary-hover) hover:text-(--text-main) active:bg-(--button-primary-active) disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-(--button-primary) z-[calc(var(--z-base)+1)] border border-transparent";

export const buttonSecondaryClass =
  "min-h-[40px] min-w-[40px] cursor-pointer rounded border border-(--button-secondary) p-2 font-semibold transition-colors hover:border-(--button-secondary-hover) active:border-(--button-secondary-active) disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:border-(--border-tertiary) z-[calc(var(--z-base)+1)]";

export const buttonDeletePrimaryClass =
  "min-h-[40px] min-w-[40px] cursor-pointer rounded bg-(--button-delete) p-2 font-semibold text-(--text-main-reverse) transition-colors hover:bg-(--button-delete-hover) hover:text-(--text-main) active:bg-(--button-delete-active) disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-(--button-delete) z-[calc(var(--z-base)+1)]";

export const buttonAddPrimaryClass =
  "min-h-[40px] min-w-[40px] cursor-pointer rounded bg-(--button-add) p-2 font-semibold text-(--text-main-reverse) transition-colors hover:bg-(--button-add-hover) hover:text-(--text-main) active:bg-(--button-add-active) disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-(--button-add) z-[calc(var(--z-base)+1)]";

export const buttonDeleteSecondaryClass =
  "min-h-[40px] min-w-[40px] cursor-pointer rounded border border-(--button-secondary) p-2 font-semibold transition-colors hover:border-(--button-delete) active:border-(--button-delete-active) disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:border-(--border-tertiary) z-[calc(var(--z-base)+1)]";

// --- ICON ---
export const iconButtonPrimaryClass =
  "h-[24px] w-[24px] flex items-center justify-center cursor-pointer transition-colors duration-(--fast) hover:text-(--button-primary) active:text-(--button-primary-active) z-[calc(var(--z-base)+1)] disabled:opacity-25 disabled:hover:text-(--text-main) disabled:cursor-not-allowed";

export const iconButtonDeletePrimaryClass =
  "h-[24px] w-[24px] flex items-center justify-center cursor-pointer transition-colors duration-(--fast) hover:text-(--button-delete) active:text-(--button-delete-active) z-[calc(var(--z-base)+1)]";

// --- OTHER ---
export const hyperLinkButtonClass =
  "cursor-pointer font-semibold text-(--accent-color) transition-[color] duration-(--fast) hover:text-(--accent-color-hover) z-[calc(var(--z-base)+1)]";

export const roundedButtonClass =
  "h-[40px] w-[40px] flex justify-center items-center cursor-pointer bg-(--bg-navbar-link) rounded-full z-[calc(var(--z-base)+1)]";

export const textPrimaryButtonClass =
  "cursor-pointer font-semibold transition-[color] duration-(--fast) text-(--accent-color) z-[calc(var(--z-base)+1)]";

export const textSecondaryButtonClass =
  "cursor-pointer font-semibold transition-[color] duration-(--fast) hover:underline z-[calc(var(--z-base)+1)]";

export const switchClass = (isTrue: boolean) =>
  `${isTrue ? "bg-(--accent-color)" : "bg-gray-500"} min-h-6 min-w-10 h-6 w-10 cursor-pointer rounded-full px-0.5`;

export const switchKnobClass = (isTrue: boolean) =>
  `${isTrue ? "translate-x-4" : "translate-x-0"} h-5 w-5 min-h-5 min-w-5 rounded-full bg-white duration-(--fast)`;

export const smallSwitchClass = (isTrue: boolean) =>
  `${isTrue ? "bg-(--accent-color)" : "bg-gray-500"} h-4 w-6.5 min-h-4 min-w-6.5 cursor-pointer rounded-full px-0.5`;

export const smallSwitchKnobClass = (isTrue: boolean) =>
  `${isTrue ? "translate-x-2.25" : "translate-x-0"} h-3.25 w-3.25 min-h-3.25 min-w-3.25 rounded-full bg-white duration-(--fast)`;
