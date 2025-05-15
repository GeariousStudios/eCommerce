import React, { ReactNode } from "react";

type InputProps = {
  id?: string;
  label?: string;
  placeholder?: string;
  icon?: ReactNode;
  type?: string;
  value?: string;
  checked?: boolean;
  onChange?: (value: string | boolean) => void;
  required?: boolean;
  spellCheck?: boolean;
  onModal?: boolean;
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
  onChange,
  required = false,
  spellCheck = false,
  onModal = false,
}: InputProps & { icon?: ReactNode }) => {
  // Checks.
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
          className={`${isDisabled ? "!cursor-not-allowed opacity-25" : ""} ${isCheckbox || isRadio ? `relative cursor-pointer appearance-none accent-[var(--accent-color)]` : "duration-medium flex h-[38px] w-full caret-[var(--accent-color)]"} ${isRadio ? "rounded-4xl" : ""} ${isDate ? "" : ""} ${icon ? "pl-10" : ""} peer rounded border-2 border-[var(--border-main)] p-2`}
        />
        {icon && (
          <div className="pointer-events-none absolute top-1/2 left-3 h-6 w-6 -translate-y-1/2 opacity-50 peer-focus:text-[var(--accent-color)] peer-focus:opacity-100">
            {icon}
          </div>
        )}
        {label?.trim() && (
          <label
            htmlFor={id}
            className={`${isDate ? "top-0" : "top-[60%]"} ${onModal ? "bg-[var(--bg-modal)]" : "bg-[var(--bg-main)]"} $ pointer-events-none absolute left-3 -translate-y-[65%] px-1.5 transition-[top] duration-[var(--slow)] select-none`}
          >
            {label}
            {required && <span className="ml-1 text-red-700">*</span>}
          </label>
        )}
      </div>
    </>
  );
};

export default Input;
