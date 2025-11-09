import useTheme from "@/app/hooks/useTheme";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import React, { ReactNode, useEffect, useRef, useState } from "react";

type InputProps = {
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  icon?: ReactNode;
  type?: string;
  value?: string;
  checked?: boolean;
  indeterminate?: boolean;
  onChange?: (value: string | boolean) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  required?: boolean;
  spellCheck?: boolean;
  onModal?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  tabIndex?: number;
  notRounded?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  inChip?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  min?: string | number;
  max?: string | number;
  focusOnMount?: boolean;
  compact?: boolean;
  showAsterixOnPlaceholder?: boolean;
  showAsterix?: boolean;
};

const Input = ({
  id,
  name,
  label,
  placeholder,
  icon,
  type,
  value,
  checked,
  indeterminate,
  onChange,
  onBlur,
  required = false,
  spellCheck = false,
  onModal = false,
  readOnly = false,
  autoComplete = "on",
  onKeyDown,
  tabIndex,
  notRounded = false,
  minLength,
  maxLength,
  pattern,
  inChip = false,
  inputMode,
  min,
  max,
  focusOnMount = false,
  compact = false,
  showAsterixOnPlaceholder = false,
  showAsterix = false,
}: InputProps & { icon?: ReactNode }) => {
  const { currentTheme } = useTheme();

  const inputRef = useRef<HTMLInputElement>(null);

  const isCheckbox = type === "checkbox";
  const isRadio = type === "radio";
  const isDate = type === "date";
  const isTime = type === "time";
  const isDateTime = type === "datetime-local";
  const isColor = type === "color";
  const isDisabled = id === "disabled";

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (focusOnMount && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [focusOnMount]);

  return (
    <>
      <div
        className={`${isCheckbox || isRadio ? "flex items-center justify-center" : "w-full"} ${currentTheme === "dark" ? "dark-calendar" : ""} relative`}
      >
        {!value && showAsterixOnPlaceholder && placeholder && (
          <span className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2">
            <span className="invisible">{placeholder}</span>
            <span className="text-xl text-red-700"> *</span>
          </span>
        )}

        <input
          inputMode={inputMode}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          ref={(el) => {
            if (el) {
              el.indeterminate = !!indeterminate;
            }

            inputRef.current = el;
          }}
          type={type === "password" && showPassword ? "text" : type}
          id={id}
          name={name ?? id}
          placeholder={
            isCheckbox || isRadio || isColor
              ? undefined
              : `${placeholder !== undefined ? placeholder : " "}`
          }
          value={isCheckbox || isRadio ? undefined : value}
          checked={isCheckbox || isRadio ? checked : undefined}
          onChange={(e) => {
            if (type === "number") {
              const clean = e.target.value
                .replace(/^0+(?!$)/, "")
                .replace(/[^\d]/g, "");

              if (clean === "") {
                onChange?.("");
              } else {
                const numericValue = Math.min(Number(clean), 999999);
                onChange?.(numericValue.toString());
              }
            } else {
              let v = e.target.value;

              if (pattern && /\s/.test(pattern) === false) {
                v = v.replace(/\s/g, "");
              }

              if (typeof maxLength === "number") {
                v = v.slice(0, maxLength);
              }

              if (isCheckbox || isRadio) {
                onChange?.(e.target.checked);
              } else {
                onChange?.(v);
              }
            }
          }}
          onInput={(e) => {
            const input = e.target as HTMLInputElement;
            let value = input.value;

            if ((isDate || isDateTime) && /^\d{5,}/.test(value)) {
              value = value.replace(/^(\d{4})\d+/, "$1");
              input.value = value;
            }

            if ((isDate || isDateTime) && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
              onBlur?.(e as any);
            }
          }}
          onBlur={onBlur}
          spellCheck={spellCheck}
          required={required}
          className={`${isDisabled ? "!pointer-events-none opacity-25" : ""} ${isCheckbox || isRadio ? `relative cursor-pointer appearance-none accent-[var(--accent-color)]` : `duration-medium flex ${compact ? "h-[24px] border-0! p-0!" : "h-[40px]"} w-full caret-[var(--accent-color)]`} ${isRadio ? "rounded-full" : ""} ${readOnly ? "!pointer-events-none" : ""} ${icon ? "pl-12" : ""} ${placeholder?.trim() ? "placeholder" : ""} ${type === "password" ? "-mr-6 pr-8" : ""} peer ${notRounded ? "border-y-1" : "rounded border-1"} ${!value && (isDate || isTime || isDateTime) ? "is-empty" : ""} ${inChip ? "border-[var(--text-main)]" : "border-[var(--border-tertiary)]"} ${
            isColor ? "cursor-pointer p-1" : "p-2"
          }`}
          readOnly={readOnly}
          autoComplete={autoComplete}
          onKeyDown={(e) => {
            if (type === "number") {
              const blocked = ["e", "E", "+", "-", ",", "."];
              if (blocked.includes(e.key)) {
                e.preventDefault();
              }
            }
            onKeyDown?.(e);
          }}
          min={type === "number" ? 0 : min}
          max={type === "number" ? 999999 : max}
          tabIndex={isDisabled ? -1 : (tabIndex ?? 0)}
        />

        {icon && (
          <div className="pointer-events-none absolute top-1/2 left-4 flex h-6 w-6 -translate-y-1/2 opacity-50 peer-focus:text-[var(--accent-color)] peer-focus:opacity-100">
            {icon}
          </div>
        )}

        {type === "password" && (
          <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center pl-2">
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((prev) => !prev)}
              className="flex cursor-pointer transition-colors duration-[var(--fast)] hover:text-[var(--accent-color)]"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        )}

        {label?.trim() &&
          (!isCheckbox && !isRadio ? (
            <label
              htmlFor={id}
              className={`${isDate || isTime || isDateTime ? "top-0" : "top-[60%]"} ${onModal ? "bg-[var(--bg-modal)]" : inChip ? "bg-[var(--bg-navbar)]" : "bg-[var(--bg-main)]"} pointer-events-none absolute left-2 -translate-y-[65%] px-1.5 transition-[top] duration-[var(--slow)] select-none`}
            >
              {label}
              {(required || showAsterix) && <span className="pr-2" />}
              {(required || showAsterix) && (
                <span className="absolute -ml-1.25 text-xl text-red-700">*</span>
              )}
            </label>
          ) : (
            <label
              htmlFor={id}
              className={`${readOnly ? "!pointer-events-none" : ""} ${isDisabled ? "opacity-25" : "opacity-100"} cursor-pointer`}
            >
              <span className="relative ml-4 inline-block">
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
