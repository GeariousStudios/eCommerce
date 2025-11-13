import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { FocusTrap } from "focus-trap-react";

type OptionProps = {
  value: string;
  label: string;
};

type DropdownProps = {
  id?: string;
  label?: string;
  options: OptionProps[];
  value: string[];
  onChange?: (value: string[]) => void;
  required?: boolean;
  onModal?: boolean;
  showAbove?: boolean;
  tabIndex?: number;
  emptyOption?: boolean;
  inChip?: boolean;
  addSpacer?: boolean;
  customSpace?: number;
  scrollContainer?: () => HTMLElement | null;
  smallDropdown?: boolean;
  showMore?: boolean;
};

const MultiDropdown = ({
  id,
  label,
  options,
  value,
  onChange,
  required,
  onModal = false,
  showAbove = false,
  tabIndex,
  emptyOption = false,
  inChip = false,
  addSpacer = false,
  customSpace,
  scrollContainer,
  smallDropdown = false,
  showMore = false,
}: DropdownProps) => {
  // --- VARIABLES ---
  // --- Refs ---
  const wrapperRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const dropdownRef = useRef<HTMLUListElement>(null);

  // --- States ---
  const [isOpen, setIsOpen] = useState(false);

  // --- ISOPEN HANDLER ---
  useEffect(() => {
    const sc = scrollContainer?.();
    if (!sc) {
      return;
    }

    if (isOpen && !showAbove && addSpacer) {
      sc.style.paddingBottom = customSpace ? `${customSpace}rem` : "4rem";
    } else {
      sc.style.paddingBottom = "";
    }
    return () => {
      sc.style.paddingBottom = "";
    };
  }, [isOpen, showAbove, scrollContainer, addSpacer]);

  useEffect(() => {
    const close = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const wrapper = wrapperRef.current;

      if (wrapper && !wrapper.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);

    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, []);

  useEffect(() => {
    if (isOpen && optionRefs.current[0]) {
      setTimeout(() => {
        optionRefs.current[0]?.focus();
      }, 0);
    }
  }, [isOpen]);

  const selectedLabels = options
    .filter((opt) => value.includes(opt.value))
    .map((opt) => opt.label);
  const displayLabel = selectedLabels.join(", ");

  return (
    <div className={`relative w-full`} ref={wrapperRef}>
      <div
        className={`${isOpen ? "outline-2 outline-offset-2 outline-(--accent-color)" : ""} ${inChip ? "border-(--text-main)" : "border-(--border-tertiary)"} ${smallDropdown ? "h-[24px] text-sm" : "h-[40px]"} z-1 flex w-full cursor-pointer items-center rounded border bg-transparent p-2 transition-[max-height] duration-(--medium)`}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          } else if (e.key === "Escape") {
            setIsOpen(false);
          }
        }}
        tabIndex={tabIndex ?? 0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span
          className={`${emptyOption && !value ? "invisible" : ""} grow truncate overflow-hidden text-ellipsis`}
        >
          {displayLabel}
        </span>
        <span
          className={`${isOpen ? "text-(--accent-color)" : ""} flex transition-colors duration-(--fast)`}
        >
          <ChevronDownIcon
            className={`${
              isOpen ? "-rotate-180 text-(--accent-color)" : ""
            } ${smallDropdown ? "h-4 w-4" : "h-6 w-6"} -rotate-0 transition-[color,rotate] duration-(--slow)`}
          />
        </span>
      </div>

      <label
        htmlFor={id}
        className={`${value.length > 0 || isOpen ? `-top-4 ${onModal ? "bg-(--bg-modal)" : inChip ? "bg-(--bg-navbar)" : "bg-(--bg-main)"} font-semibold text-(--accent-color)` : "top-[60%] -translate-y-[65%] bg-transparent"} ${smallDropdown ? "text-sm" : ""} pointer-events-none absolute left-2 z-2 px-1.5 transition-[translate,top] duration-(--slow) select-none`}
      >
        {label}
        {required && <span className="pr-2" />}
        {required && (
          <span className="absolute -ml-1.25 text-xl text-red-700">*</span>
        )}
      </label>

      {isOpen && (
        <FocusTrap
          focusTrapOptions={{
            clickOutsideDeactivates: true,
            escapeDeactivates: true,
            returnFocusOnDeactivate: true,
            fallbackFocus: () => document.body,
          }}
        >
          <ul
            data-inside-modal="true"
            ref={(el) => {
              dropdownRef.current = el;
            }}
            className={`${isOpen ? `pointer-events-auto ${showMore ? "max-h-68" : "max-h-48"} opacity-100` : "max-h-0"} ${options.length >= 4 ? "overflow-y-auto" : "overflow-y-hidden"} ${onModal ? "bg-(--bg-modal)" : inChip ? "bg-(--bg-navbar)" : "bg-(--bg-main)"} ${showAbove ? "bottom-full rounded-t border-b-0" : "rounded-b border-t-0"} ${smallDropdown ? "text-sm" : ""} absolute z-(--z-tooltip) ml-2 w-[calc(100%-1rem)] list-none border border-(--border-tertiary) opacity-0 transition-[opacity,max-height] duration-(--medium)`}
            role="listbox"
            inert={!isOpen || undefined}
          >
            <li role="option" aria-hidden="true" hidden></li>
            {options.map((opt, index) => (
              <li
                key={opt.value}
                ref={(el) => {
                  optionRefs.current[index] = el;
                }}
                tabIndex={0}
                className={`${value.includes(opt.value) ? "font-bold" : ""} cursor-pointer p-2 transition-colors duration-(--slow) select-none hover:bg-(--accent-color)`}
                role="option"
                onClick={(e) => {
                  e.stopPropagation();

                  let newValue: string[];

                  if (value.includes(opt.value)) {
                    newValue = value.filter((v) => v !== opt.value);
                  } else {
                    newValue = [...value, opt.value];
                  }

                  onChange && onChange(newValue);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsOpen(false);
                  } else if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    let newValue: string[];

                    if (value.includes(opt.value)) {
                      newValue = value.filter((v) => v !== opt.value);
                    } else {
                      newValue = [...value, opt.value];
                    }

                    onChange && onChange(newValue);
                    setIsOpen(false);
                  }
                }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </FocusTrap>
      )}

      {/* This <select> is here to get form validation check */}
      <select
        id={id}
        value={value[0] || ""}
        onChange={(e) => onChange && onChange([e.target.value])}
        required={required}
        tabIndex={-1}
        className="pointer-events-none absolute top-1/2 w-full opacity-0"
      >
        <option value="">...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MultiDropdown;
