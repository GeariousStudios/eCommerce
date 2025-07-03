import {
  buttonPrimaryClass,
  buttonSecondaryClass,
} from "@/app/styles/buttonClasses";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { FocusTrap } from "focus-trap-react";
import {
  ElementType,
  forwardRef,
  ReactNode,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

type Props = {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  label?: string;
  icon?: ElementType;
  disableClickOutside?: boolean;
  disableCloseButton?: boolean;
  smallGap?: boolean;
  confirmOnClose?: boolean;
  confirmCloseMessage?: string;
  isDirty?: boolean;
};

export type ModalBaseHandle = {
  requestClose: () => void;
};

const ModalBase = forwardRef((props: Props, ref) => {
  useImperativeHandle(ref, () => ({
    requestClose,
  }));

  // --- VARIABLES ---
  // --- Refs ---
  const innerRef = useRef<HTMLDivElement>(null);

  // --- States ---
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  let Icon = props.icon ?? undefined;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const menuElement = innerRef.current;
      const target = event.target;

      if (
        !props.disableClickOutside &&
        menuElement &&
        !menuElement.contains(target as Node) &&
        target instanceof Element &&
        !target.closest('[data-inside-modal="true"]')
      ) {
        requestClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [props.isOpen, props.onClose]);

  const requestClose = () => {
    if (props.confirmOnClose && props.isDirty) {
      setShowConfirmModal(true);
    } else {
      props.onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmModal(false);
    props.onClose();
  };

  const handleConfirmCancel = () => {
    setShowConfirmModal(false);
  };

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
              <div id="portal-root" />
              <div
                ref={innerRef}
                role="dialog"
                aria-hidden={!props.isOpen}
                className={`${props.isOpen ? "visible opacity-100" : "invisible opacity-0"} relative left-1/2 z-[calc(var(--z-modal))] flex w-[90vw] max-w-3xl -translate-1/2 flex-col overflow-x-hidden rounded-2xl bg-[var(--bg-modal)] shadow-[0_0_16px_0_rgba(0,0,0,0.125)] transition-[opacity,visibility] duration-[var(--fast)]`}
              >
                <div
                  className={`${props.smallGap ? "gap-8" : "gap-12"} flex max-h-[90svh] flex-col overflow-x-hidden overflow-y-auto p-4`}
                >
                  {!props.disableCloseButton && (
                    <div className="relative flex items-center justify-between gap-4">
                      <div className="flex gap-4">
                        {Icon && (
                          <Icon className="xs:h-8 xs:min-h-8 xs:w-8 xs:min-w-8 h-6 min-h-6 w-6 min-w-6 text-[var(--accent-color)]" />
                        )}
                        <span className="xs:text-xl flex items-center font-semibold">
                          {props.label}
                        </span>
                      </div>
                      <button
                        onClick={requestClose}
                        className="xs:h-[32px] xs:min-h-[32px] xs:w-[32px] xs:min-w-[32px] h-[24px] min-h-[24px] w-[24px] min-w-[24px] cursor-pointer duration-[var(--fast)] hover:text-[var(--accent-color)]"
                      >
                        <XMarkIcon />
                      </button>
                      <hr className="xs:mt-16 absolute mt-12 -ml-4 flex w-[calc(100%+2rem)] text-[var(--border-main)]" />
                    </div>
                  )}
                  {props.children}
                </div>
              </div>
            </div>
          </FocusTrap>
        </div>
      )}

      {showConfirmModal && (
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            allowOutsideClick: true,
            escapeDeactivates: false,
          }}
        >
          <div className="fixed inset-0 z-[var(--z-overlay)] h-svh w-screen bg-black/75">
            <div className="relative top-1/2">
              <div className="relative left-1/2 z-[calc(var(--z-modal))] flex w-[90vw] max-w-md -translate-1/2 flex-col overflow-x-hidden rounded-2xl bg-[var(--bg-modal)] p-4 shadow-[0_0_16px_0_rgba(0,0,0,0.125)] transition-[opacity,visibility] duration-[var(--fast)]">
                <p className="mb-6 text-[var(--text-main)]">
                  {props.confirmCloseMessage ??
                    "Du har osparade ändringar. Vill du stänga ändå?"}
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={handleConfirmClose}
                    className={`${buttonPrimaryClass} w-full grow-2 sm:w-auto`}
                  >
                    Stäng ändå
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCancel}
                    className={`${buttonSecondaryClass} w-full grow sm:w-auto`}
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </FocusTrap>
      )}
    </>
  );
});

export default ModalBase;
