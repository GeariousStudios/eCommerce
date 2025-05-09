import React from "react";
import styles from "./Input.module.scss";

type InputProps = {
  id?: string;
  label?: string;
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
  const isDate = type === "date";
  const isNotClickable = id === "notClickable";

  return (
    <div
      className={`${isCheckbox ? "flex items-center justify-center" : ""} ${isDarkTheme() ? "dark-calender" : ""} relative w-full`}
    >
      <input
        type={type}
        id={id}
        name={id}
        placeholder={isCheckbox ? undefined : " "}
        value={isCheckbox ? undefined : value}
        checked={isCheckbox ? checked : undefined}
        onChange={(e) =>
          onChange &&
          (isCheckbox ? onChange(e.target.checked) : onChange(e.target.value))
        }
        spellCheck={spellCheck}
        required={required}
        className={`${isNotClickable ? "pointer-events-none" : "pointer-events-auto"} ${isCheckbox ? "relative max-h-5 min-h-5 max-w-5 min-w-5 cursor-pointer appearance-none bg-[var(--bg-main)] accent-[var(--accent-color)]" : "duration-medium mt-4 mb-4 flex max-h-12 min-h-12 w-full bg-transparent p-4 caret-[var(--accent-color)] transition-all"} ${isDate ? "" : ""} ${onModal ? "modal-label" : ""} rounded border-2 border-[var(--border-main)] last:mb-4`}
      />
      {label?.trim() && (
        <label
          htmlFor={id}
          className={`${isDate ? "top-0" : "top-[30%]"} pointer-events-none absolute left-3 translate-y-[15%] pr-1.5 pl-1.5 transition-all duration-[var(--slow)] select-none`}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Input;
