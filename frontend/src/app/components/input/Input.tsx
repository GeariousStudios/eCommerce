import React, { ReactNode, useEffect, useRef } from "react";

type InputProps = {
  id?: string;
  label?: string;
  placeholder?: string;
  icon?: ReactNode;
  type?: string;
  value?: string;
  checked?: boolean;
  indeterminate?: boolean;
  onChange?: (value: string | boolean) => void;
  required?: boolean;
  spellCheck?: boolean;
  onModal?: boolean;
  readOnly?: boolean;
};

const isDarkTheme = () => {
  const currentTheme = localStorage.getItem("theme");

  if (currentTheme === "dark") {
    return true;
  }

  return false;
};

const Input = ({
  id,
  label,
  placeholder,
  icon,
  type,
  value,
  checked,
  indeterminate,
  onChange,
  required = false,
  spellCheck = false,
  onModal = false,
  readOnly = false,
}: InputProps & { icon?: ReactNode }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const isCheckbox = type === "checkbox";
  const isRadio = type === "radio";
  const isDate = type === "date";
  const isDisabled = id === "disabled";

  return (
    <>
      <div
        className={`${isCheckbox || isRadio ? "flex items-center justify-center" : "w-full"} ${isDarkTheme() ? "dark-calender" : ""} relative`}
      >
        <input
          ref={(el) => {
            if (el) {
              el.indeterminate = !!indeterminate;
              inputRef.current = el;
            }
          }}
          type={type}
          id={id}
          name={id}
          placeholder={
            isCheckbox || isRadio
              ? undefined
              : `${placeholder !== undefined ? placeholder : " "}`
          }
          value={isCheckbox || isRadio ? undefined : value}
          checked={isCheckbox || isRadio ? checked : undefined}
          onChange={(e) =>
            onChange &&
            (isCheckbox || isRadio
              ? onChange(e.target.checked)
              : onChange(e.target.value))
          }
          spellCheck={spellCheck}
          required={required}
          className={`${isDisabled ? "!cursor-not-allowed opacity-25" : ""} ${isCheckbox || isRadio ? `relative cursor-pointer appearance-none accent-[var(--accent-color)]` : "duration-medium flex h-[40px] w-full caret-[var(--accent-color)]"} ${isRadio ? "rounded-full" : ""} ${readOnly ? "!pointer-events-none" : ""} ${icon ? "pl-12" : ""} peer rounded border-1 border-[var(--border-main)] p-2`}
          readOnly={readOnly}
        />
        {icon && (
          <div className="pointer-events-none absolute top-1/2 left-4 h-6 w-6 -translate-y-1/2 opacity-50 peer-focus:text-[var(--accent-color)] peer-focus:opacity-100">
            {icon}
          </div>
        )}
        {label?.trim() &&
          (!isCheckbox && !isRadio ? (
            <label
              htmlFor={id}
              className={`${isDate ? "top-0" : "top-[60%]"} ${onModal ? "bg-[var(--bg-modal)]" : "bg-[var(--bg-main)]"} pointer-events-none absolute left-2 -translate-y-[65%] px-1.5 transition-[top] duration-[var(--slow)] select-none`}
            >
              {label}
              {required && <span className="ml-1 text-red-700">*</span>}
            </label>
          ) : (
            <label
              htmlFor={id}
              className={`${readOnly ? "!pointer-events-none" : ""} ${isDisabled ? "opacity-25" : "opacity-100"} "cursor-pointer"`}
            >
              <input
                type={type}
                id={id}
                name={id}
                checked={checked}
                onChange={(e) => onChange?.(e.target.checked)}
                required={required}
                spellCheck={spellCheck}
                className="invisible"
                readOnly={readOnly}
              />
              <span className="relative inline-block">
                <span
                  className={`${checked ? "" : "!font-normal"} !text-[var(--text-main)]`}
                >
                  {label}
                </span>
                <div className="absolute bottom-0 left-0 h-[2px] w-0 rounded-full bg-[var(--accent-color)] transition-all duration-[var(--fast)] group-hover:w-full" />
              </span>
            </label>
          ))}
      </div>
    </>
  );
};

export default Input;
