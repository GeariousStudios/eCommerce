// --- REGULAR ---
export const buttonPrimaryClass =
  "h-10 w-10 cursor-pointer rounded bg-[var(--button-primary)] px-4 py-3 font-semibold transition-colors hover:bg-[var(--button-primary-hover)] active:bg-[var(--button-primary-active)] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-[var(--button-primary)] z-[calc(var(--z-base)+1)] duration-[var(--fast)] flex gap-2 justify-center items-center whitespace-nowrap";

export const buttonSecondaryClass =
  "h-10 w-10 cursor-pointer rounded border-1 border-[var(--button-secondary)] px-4 py-3 font-semibold transition-colors hover:border-[var(--button-secondary-hover)] active:border-[var(--button-secondary-active)] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:border-[var(--border-main)] z-[calc(var(--z-base)+1)] duration-[var(--fast)] flex gap-2 justify-center items-center whitespace-nowrap";

export const buttonNeutralClass =
  "h-10 w-10 cursor-pointer rounded-xl bg-[var(--button-neutral)] text-[var(--text-main-reverse)] px-4 py-3 font-medium text-sm transition-colors hover:bg-[var(--button-neutral-hover)] active:bg-[var(--button-neutral-active)] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-[var(--button-neutral)] z-[calc(var(--z-base)+1)] duration-[var(--fast)] flex gap-2 justify-center items-center whitespace-nowrap";

export const buttonDeletePrimaryClass =
  "h-10 w-10 cursor-pointer rounded bg-[var(--button-delete)] px-4 py-3 font-semibold text-[var(--text-main-reverse)] transition-colors hover:bg-[var(--button-delete-hover)] hover:text-[var(--text-main)] active:bg-[var(--button-delete-active)] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-[var(--button-delete)] z-[calc(var(--z-base)+1)] duration-[var(--fast)] flex gap-2 justify-center items-center whitespace-nowrap";

export const buttonDeleteSecondaryClass =
  "h-10 w-10 cursor-pointer rounded border-1 border-[var(--button-secondary)] px-4 py-3 font-semibold transition-colors hover:border-[var(--button-delete)] active:border-[var(--button-delete-active)] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:border-[var(--border-main)] z-[calc(var(--z-base)+1)] duration-[var(--fast)] flex gap-2 justify-center items-center whitespace-nowrap";

// --- ICON ---
export const iconButtonPrimaryClass =
  "h-6 w-6 flex items-center justify-center cursor-pointer transition-colors duration-[var(--fast)] hover:text-[var(--button-primary)] active:text-[var(--button-primary-active)] z-[calc(var(--z-base)+1)] disabled:opacity-25 disabled:hover:text-[var(--text-main)] disabled:cursor-not-allowed";

export const iconbuttonDeletePrimaryClass =
  "h-6 w-6 flex items-center justify-center cursor-pointer transition-colors duration-[var(--fast)] hover:text-[var(--button-delete)] active:text-[var(--button-delete-active)] z-[calc(var(--z-base)+1)]";

export const iconClass16 = "min-h-4 min-w-4 w-4 h-4";
export const iconClass24 = "min-h-6 min-w-6 w-6 h-6";

// --- OTHER ---
export const hyperLinkButtonClass =
  "cursor-pointer font-semibold text-[var(--accent-color)] transition-[color] duration-[var(--fast)] hover:text-[var(--accent-color-hover)] z-[calc(var(--z-base)+1)]";

export const roundedButtonClass =
  "h-8 w-8 flex justify-center items-center cursor-pointer bg-[var(--button-rounded)] rounded-full z-[calc(var(--z-base)+1)] text-[var(--button-rounded-stroke)] border-[1.5px] hover:bg-[var(--button-rounded-hover)] transition-colors duration-[var(--fast)] active:bg-[var(--button-rounded-active)]";

export const switchClass = (isTrue: boolean) =>
  `${isTrue ? "bg-[var(--accent-color)]" : "bg-gray-500"} h-6 w-10 cursor-pointer rounded-full px-0.5`;

export const switchKnobClass = (isTrue: boolean) =>
  `${isTrue ? "translate-x-4" : "translate-x-0"} h-5 w-5 rounded-full bg-white duration-[var(--fast)]`;
