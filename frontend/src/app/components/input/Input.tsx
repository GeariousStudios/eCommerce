import React from "react";

type InputProps = {
  id?: string;
  label?: string;
  placeholder?: string;
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
  type,
  value,
  checked,
  onChange,
  required = false,
  spellCheck = false,
  onModal = false,
}: InputProps) => {
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
          className={`${isDisabled ? "!cursor-not-allowed opacity-25" : ""} ${isCheckbox || isRadio ? `relative max-h-5 min-h-5 max-w-5 min-w-5 cursor-pointer appearance-none accent-[var(--accent-color)]` : "duration-medium flex max-h-12 min-h-12 w-full p-4 caret-[var(--accent-color)]"} ${isRadio ? "rounded-4xl" : ""} ${isDate ? "" : ""} rounded border-2 border-[var(--border-main)]`}
        />
        {label?.trim() && (
          <label
            htmlFor={id}
            className={`${isDate ? "top-0" : "top-[57.5%]"} ${onModal ? "bg-[var(--bg-modal)]" : "bg-[var(--bg-main)]"} pointer-events-none absolute left-3 -translate-y-[65%] pr-1.5 pl-1.5 transition-[top] duration-[var(--slow)] select-none`}
          >
            {label}
          </label>
        )}
      </div>
    </>
  );
};

export default Input;
