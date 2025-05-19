import { FocusTrap } from "focus-trap-react";
import { ReactNode, RefObject, useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

type Props = {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: RefObject<HTMLElement | null>;
  label: string;
};

const SideMenu = (props: Props) => {
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!props.isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const menuElement = innerRef.current;
      const triggerElement = props.triggerRef && props.triggerRef.current;
      const target = event.target as Node;

      if (
        menuElement &&
        !menuElement.contains(target) &&
        triggerElement &&
        !triggerElement.contains(target)
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
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sidomeny"
        onClick={() => props.onClose()}
        className={`${props.isOpen ? "opacity-100" : "pointer-events-none opacity-0"} fixed inset-0 z-[var(--z-overlay)] h-svh w-screen bg-black/50 transition-opacity duration-[var(--slow)]`}
      >
        <div
          ref={innerRef}
          onClick={(e) => e.stopPropagation()}
          className={`${props.isOpen ? "sm:translate-x-0 sm:translate-y-0 visible translate-y-0" : "sm:translate-y-0 sm:translate-x-full invisible translate-y-full"} sm:w-128 sm:right-0 sm:top-0 sm:h-full sm:rounded-b-2xl sm:!rounded-r-none fixed bottom-0 z-[calc(var(--z-modal))] flex h-3/4 w-full flex-col rounded-l-2xl rounded-r-2xl rounded-b-none bg-[var(--bg-topbar)] shadow-[0_0_16px_0_rgba(0,0,0,0.125)] transition-[translate,visibility] duration-[var(--slow)]`}
        >
          <FocusTrap
            active={props.isOpen}
            focusTrapOptions={{
              initialFocus: false,
              allowOutsideClick: true,
              fallbackFocus: () => innerRef.current!,
            }}
          >
            <div className="flex h-full flex-col">
              <div className="relative flex items-center justify-between p-4">
                <span className="text-2xl font-semibold">{props.label}</span>
                <button
                  onClick={() => props.onClose()}
                  className="h-[32px] w-[32px] cursor-pointer duration-[var(--fast)] hover:text-[var(--accent-color)]"
                >
                  <XMarkIcon />
                </button>
                <hr className="absolute mt-16 -ml-4 flex w-[calc(100%+2rem)] text-[var(--border-main)]" />
              </div>

              <div className="flex-1 overflow-y-auto px-4">{props.children}</div>
            </div>
          </FocusTrap>
        </div>
      </div>
    </>
  );
};

export default SideMenu;
