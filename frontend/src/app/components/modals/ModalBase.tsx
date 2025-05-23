import { XMarkIcon } from "@heroicons/react/24/outline";
import { FocusTrap } from "focus-trap-react";
import { ElementType, ReactNode, useEffect, useRef, useState } from "react";

type Props = {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  label?: string;
  icon?: ElementType;
  disableClickOutside?: boolean;
  disableCloseButton?: boolean;
};

const ModalBase = (props: Props) => {
  const innerRef = useRef<HTMLDivElement>(null);
  let Icon = props.icon ?? undefined;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const menuElement = innerRef.current;
      const target = event.target as Node;

      if (
        !props.disableClickOutside &&
        menuElement &&
        !menuElement.contains(target)
      ) {
        props.onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [props.isOpen, props.onClose]);

  return (
    <>
      {props.isOpen && (
        <div className="fixed inset-0 z-[var(--z-overlay)] h-svh w-screen bg-black/50">
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              allowOutsideClick: true,
              escapeDeactivates: false,
            }}
          >
            <div className="relative top-1/2">
              <div
                ref={innerRef}
                role="dialog"
                aria-hidden={!props.isOpen}
                className={`${props.isOpen ? "visible opacity-100" : "invisible opacity-0"} relative left-1/2 z-[calc(var(--z-modal))] flex max-h-[90svh] w-[90vw] max-w-3xl -translate-1/2 flex-col gap-8 overflow-x-hidden overflow-y-auto rounded-2xl bg-[var(--bg-topbar)] p-4 shadow-[0_0_16px_0_rgba(0,0,0,0.125)] transition-[opacity,visibility] duration-[var(--fast)]`}
              >
                {!props.disableCloseButton && (
                  <div className="relative flex items-center justify-between">
                    <div className="flex gap-4">
                      {Icon && <Icon className="h-8 w-8 text-[var(--accent-color)]" />}
                      <span className="text-2xl font-semibold">
                        {props.label}
                      </span>
                    </div>
                    <button
                      onClick={() => props.onClose()}
                      className="h-[32px] w-[32px] cursor-pointer duration-[var(--fast)] hover:text-[var(--accent-color)]"
                    >
                      <XMarkIcon />
                    </button>
                    <hr className="absolute mt-16 -ml-4 flex w-[calc(100%+2rem)] text-[var(--border-main)]" />
                  </div>
                )}
                {props.children}
              </div>
            </div>
          </FocusTrap>
        </div>
      )}
    </>
  );
};

export default ModalBase;
