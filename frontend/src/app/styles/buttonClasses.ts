// --- REGULAR ---
export const buttonPrimaryClass =
  "min-h-[40px] min-w-[40px] cursor-pointer rounded bg-[var(--button-primary)] p-2 font-semibold text-[var(--text-main-reverse)] transition-colors hover:bg-[var(--button-primary-hover)] hover:text-[var(--text-main)] active:bg-[var(--button-primary-active)] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-[var(--button-primary)] z-[calc(var(--z-base)+1)]";

export const buttonSecondaryClass =
  "min-h-[40px] min-w-[40px] cursor-pointer rounded border-1 border-[var(--button-secondary)] p-2 font-semibold transition-colors hover:border-[var(--button-secondary-hover)] active:border-[var(--button-secondary-active)] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:border-[var(--border-tertiary)] z-[calc(var(--z-base)+1)]";

export const buttonDeletePrimaryClass =
  "min-h-[40px] min-w-[40px] cursor-pointer rounded bg-[var(--button-delete)] p-2 font-semibold text-[var(--text-main-reverse)] transition-colors hover:bg-[var(--button-delete-hover)] hover:text-[var(--text-main)] active:bg-[var(--button-delete-active)] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-[var(--button-delete)] z-[calc(var(--z-base)+1)]";

export const buttonAddPrimaryClass =
  "min-h-[40px] min-w-[40px] cursor-pointer rounded bg-[var(--button-add)] p-2 font-semibold text-[var(--text-main-reverse)] transition-colors hover:bg-[var(--button-add-hover)] hover:text-[var(--text-main)] active:bg-[var(--button-add-active)] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-[var(--button-add)] z-[calc(var(--z-base)+1)]";

export const buttonDeleteSecondaryClass =
  "min-h-[40px] min-w-[40px] cursor-pointer rounded border-1 border-[var(--button-secondary)] p-2 font-semibold transition-colors hover:border-[var(--button-delete)] active:border-[var(--button-delete-active)] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:border-[var(--border-tertiary)] z-[calc(var(--z-base)+1)]";

// --- ICON ---
export const iconButtonPrimaryClass =
  "h-[24px] w-[24px] flex items-center justify-center cursor-pointer transition-colors duration-[var(--fast)] hover:text-[var(--button-primary)] active:text-[var(--button-primary-active)] z-[calc(var(--z-base)+1)] disabled:opacity-25 disabled:hover:text-[var(--text-main)] disabled:cursor-not-allowed";

export const iconButtonDeletePrimaryClass =
  "h-[24px] w-[24px] flex items-center justify-center cursor-pointer transition-colors duration-[var(--fast)] hover:text-[var(--button-delete)] active:text-[var(--button-delete-active)] z-[calc(var(--z-base)+1)]";

// --- OTHER ---
export const hyperLinkButtonClass =
  "cursor-pointer font-semibold text-[var(--accent-color)] transition-[color] duration-[var(--fast)] hover:text-[var(--accent-color-hover)] z-[calc(var(--z-base)+1)]";

export const roundedButtonClass =
  "h-[40px] w-[40px] flex justify-center items-center cursor-pointer bg-[var(--bg-navbar-link)] rounded-full z-[calc(var(--z-base)+1)]";

export const textPrimaryButtonClass =
  "cursor-pointer font-semibold text-[var(--accent-color)] transition-[color] duration-[var(--fast)] hover:text-[var(--accent-color-hover)] z-[calc(var(--z-base)+1)]";

export const textSecondaryButtonClass =
  "cursor-pointer font-semibold transition-[color] duration-[var(--fast)] hover:text-[var(--accent-color-hover)] z-[calc(var(--z-base)+1)]";

export const switchClass = (isTrue: boolean) =>
  `${isTrue ? "bg-[var(--accent-color)]" : "bg-gray-500"} min-h-6 min-w-10 h-6 w-10 cursor-pointer rounded-full px-0.5`;

export const switchKnobClass = (isTrue: boolean) =>
  `${isTrue ? "translate-x-4" : "translate-x-0"} h-5 w-5 min-h-5 min-w-5 rounded-full bg-white duration-[var(--fast)]`;

export const smallSwitchClass = (isTrue: boolean) =>
  `${isTrue ? "bg-[var(--accent-color)]" : "bg-gray-500"} h-4 w-6.5 min-h-4 min-w-6.5 cursor-pointer rounded-full px-0.5`;

export const smallSwitchKnobClass = (isTrue: boolean) =>
  `${isTrue ? "translate-x-2.25" : "translate-x-0"} h-3.25 w-3.25 min-h-3.25 min-w-3.25 rounded-full bg-white duration-[var(--fast)]`;
