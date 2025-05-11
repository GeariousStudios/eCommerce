import React, { useState, useRef, useEffect } from "react";
import ChevronDownIcon from "@heroicons/react/20/solid/ChevronDownIcon";

type OptionProps = {
  value: string;
  label: string;
};

type DropdownProps = {
  id?: string;
  label?: string;
  options: OptionProps[];
  value: string;
  onChange?: (value: string) => void;
  required?: boolean;
  onModal?: boolean;
};

const SingleDropdown = ({
  id,
  label,
  options,
  value,
  onChange,
  required,
  onModal = false,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const close = (e: MouseEvent | TouchEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
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

  const selectedLabel = options.find((opt) => opt.value === value)?.label || "";

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div
        className={`${isOpen ? "outline-2 outline-offset-2 outline-[var(--accent-color)]" : ""} z-1 flex max-h-12 min-h-12 w-full cursor-pointer items-center rounded border-2 border-[var(--border-main)] bg-transparent p-4 transition-[max-height] duration-[var(--medium)]`}
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
        <span className="grow">{selectedLabel}</span>
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
        className={`${value || isOpen ? `-top-4 ${onModal ? "bg-[var(--bg-modal)]" : "bg-[var(--bg-main)]"} font-semibold text-[var(--accent-color)]` : "top-[57.5%] -translate-y-[65%] bg-transparent"} pointer-events-none absolute left-3 z-2 pr-1.5 pl-1.5 transition-[translate,top] duration-[var(--slow)] select-none`}
      >
        {label}
      </label>

      <ul
        className={`${isOpen ? "pointer-events-auto max-h-48 opacity-100" : "max-h-0"} ${options.length >= 4 ? "overflow-y-auto" : "overflow-y-hidden"} absolute left-0 z-10 ml-2 w-[calc(100%-1rem)] list-none rounded-b border-2 border-t-0 border-[var(--border-main)] bg-[var(--bg-main)] opacity-0 transition-[opacity,max-height] duration-[var(--medium)]`}
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
            className={`${value === opt.value ? "font-bold" : ""} cursor-pointer p-4 transition-colors duration-[var(--slow)] select-none hover:bg-[var(--accent-color)]`}
            role="option"
            onClick={() => {
              onChange && onChange(opt.value);
              setIsOpen(false);
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
                onChange && onChange(opt.value);
                setIsOpen(false);
              }
            }}
          >
            {opt.label}
          </li>
        ))}
      </ul>

      {/* This <select> is here to get form validation check */}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
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

export default SingleDropdown;
