import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import PortalWrapper from "../helpers/PortalWrapper";

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
};

const MultiDropdown = ({
  id,
  label,
  options,
  value,
  onChange,
  required,
  onModal = false,
}: DropdownProps) => {
  // Refs.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const portalContentRef = useRef<HTMLUListElement>(null);

  // States.
  const [isOpen, setIsOpen] = useState(false);

  // UL handler.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let animationFrameId: number;

    const update = () => {
      if (wrapperRef.current && dropdownRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        dropdownRef.current.style.top = `${rect.bottom}px`;
        dropdownRef.current.style.left = `${rect.left}px`;
        dropdownRef.current.style.width = `${rect.width - 16}px`;
      }

      animationFrameId = requestAnimationFrame(update);
    };

    update();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isOpen]);

  // isOpen handler.
  useEffect(() => {
    const close = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const wrapper = wrapperRef.current;
      const portal = portalContentRef.current;

      if (
        wrapper &&
        portal &&
        !wrapper.contains(target) &&
        !portal.contains(target)
      ) {
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

  const selectedLabels = options
    .filter((opt) => value.includes(opt.value))
    .map((opt) => opt.label);
  const displayLabel = selectedLabels.join(", ");

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div
        className={`${isOpen ? "outline-2 outline-offset-2 outline-[var(--accent-color)]" : ""} z-1 flex h-[38px] w-full cursor-pointer items-center rounded border-2 border-[var(--border-main)] bg-transparent p-2 transition-[max-height] duration-[var(--medium)]`}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          } else if (e.key === "Escape") {
            setIsOpen(false);
          }
        }}
        tabIndex={0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="grow overflow-hidden text-ellipsis whitespace-nowrap">
          {displayLabel}
        </span>
        <span
          className={`${isOpen ? "text-[var(--accent-color)]" : ""} flex transition-colors duration-[var(--fast)]`}
        >
          <ChevronDownIcon
            className={`${
              isOpen ? "rotate-180 text-[var(--accent-color)]" : ""
            } h-6 min-h-6 w-0 min-w-6 rotate-0 transition-[color,rotate] duration-[var(--slow)]`}
          />
        </span>
      </div>

      <label
        htmlFor={id}
        className={`${value.length > 0 || isOpen ? `-top-4 ${onModal ? "bg-[var(--bg-modal)]" : "bg-[var(--bg-main)]"} font-semibold text-[var(--accent-color)]` : "top-[60%] -translate-y-[65%] bg-transparent"} pointer-events-none absolute left-3 z-2 pr-1.5 pl-1.5 transition-[translate,top] duration-[var(--slow)] select-none`}
      >
        {label}
      </label>

      <PortalWrapper>
        <ul
          ref={(el) => {
            dropdownRef.current = el;
            portalContentRef.current = el;
          }}
          className={`${isOpen ? "pointer-events-auto max-h-48 opacity-100" : "max-h-0"} ${options.length >= 4 ? "overflow-y-auto" : "overflow-y-hidden"} fixed z-[var(--z-tooltip)] ml-2 list-none rounded-b border-2 border-t-0 border-[var(--border-main)] bg-[var(--bg-main)] opacity-0 transition-[opacity,max-height] duration-[var(--medium)]`}
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
              className={`${value.includes(opt.value) ? "font-bold" : ""} cursor-pointer p-2 transition-colors duration-[var(--slow)] select-none hover:bg-[var(--accent-color)]`}
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
                } else if (e.key === "Tab") {
                  e.preventDefault();
                  const dir = e.shiftKey ? -1 : 1;
                  const total = options.length;
                  const nextIndex = (index + dir + total) % total;
                  optionRefs.current[nextIndex]?.focus();
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
      </PortalWrapper>

      {/* This <select> is here to get form validation check */}
      <select
        id={id}
        value={value[0] || ""}
        onChange={(e) => onChange && onChange([e.target.value])}
        required={required}
        tabIndex={-1}
        className="pointer-events-none absolute top-1/2 w-full opacity-0"
      >
        <option value="">Välj...</option>
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
