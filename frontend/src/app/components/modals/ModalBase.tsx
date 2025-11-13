import {
  buttonPrimaryClass,
  buttonSecondaryClass,
} from "@/app/styles/buttonClasses";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { FocusTrap } from "focus-trap-react";
import { motion, useDragControls } from "framer-motion";
import { get } from "http";
import { useTranslations } from "next-intl";
import {
  ElementType,
  forwardRef,
  ReactNode,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

type BaseProps = {
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
  nestedModal?: boolean;
  smallModal?: boolean;
};

type SectionProps = {
  children: ReactNode;
  className?: string;
  compact?: boolean;
};

export type ModalBaseHandle = {
  requestClose: () => void;
  getScrollEl: () => HTMLElement | null;
};

const ModalBase = forwardRef((props: BaseProps, ref) => {
  const t = useTranslations();

  useImperativeHandle(ref, () => ({
    requestClose,
    getScrollEl: () =>
      (innerRef.current?.querySelector(".modal-body") as HTMLElement | null) ??
      null,
  }));

  // --- VARIABLES ---
  // --- Refs ---
  const innerRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef(null);
  const dragControls = useDragControls();

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
  }, [props.isOpen, props.onClose, props.disableClickOutside]);

  useEffect(() => {
    if (props.nestedModal) {
      return;
    }

    if (props.isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [props.isOpen]);

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
        <div
          ref={constraintsRef}
          className="z-(--z-overlay) fixed inset-0 h-full w-screen bg-black/50"
        >
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              allowOutsideClick: true,
              escapeDeactivates: false,
            }}
          >
            <div className="relative top-1/2">
              {/* <div id="portal-root" /> */}
              <motion.div
                ref={innerRef}
                role="dialog"
                aria-hidden={!props.isOpen}
                aria-modal="true"
                className={`${props.isOpen ? "visible opacity-100" : "invisible opacity-0"} ${props.smallModal ? "max-w-lg" : "max-w-3xl"} bg-(--bg-modal) duration-(--fast) relative left-1/2 z-[calc(var(--z-modal))] flex max-h-[90svh] w-[90vw] -translate-1/2 flex-col overflow-x-hidden rounded-2xl shadow-[0_0_16px_0_rgba(0,0,0,0.125)] transition-[opacity,visibility]`}
                drag
                dragControls={dragControls}
                dragListener={false}
                dragMomentum={false}
                dragElastic={0}
                dragConstraints={constraintsRef}
              >
                {/* --- Header (not scrollable) --- */}
                {!props.disableCloseButton && (
                  <div
                    className="cursor-move p-4"
                    onPointerDown={(e) => {
                      document.body.style.userSelect = "none";
                      dragControls.start(e);
                      const handleUp = () => {
                        document.body.style.userSelect = "";
                        window.removeEventListener("pointerup", handleUp);
                      };
                      window.addEventListener("pointerup", handleUp);
                    }}
                  >
                    <div
                      className={`${props.smallGap ? "gap-8" : "gap-12"} relative flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-4">
                        {Icon && (
                          <Icon className="xs:h-8 xs:min-h-8 xs:w-8 xs:min-w-8 text-(--accent-color) h-6 min-h-6 w-6 min-w-6" />
                        )}
                        <span className="xs:text-xl flex items-center font-semibold">
                          {props.label}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={requestClose}
                        className="xs:h-[30px] xs:min-h-[30px] xs:w-[30px] xs:min-w-[30px] duration-(--fast) hover:text-(--accent-color) h-[22px] min-h-[22px] w-[22px] min-w-[22px] cursor-pointer"
                      >
                        <XMarkIcon />
                      </button>
                      <hr className="xs:mt-16 absolute mt-14 -ml-4 flex w-[calc(100%+2rem)] text-(--border-tertiary)" />
                    </div>
                  </div>
                )}

                {/* --- Body (scrollable) --- */}
                <div className="flex min-h-0 flex-col">{props.children}</div>
              </motion.div>
            </div>
            {/* </div> */}
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
          <div className="z-(--z-overlay) fixed inset-0 h-full w-screen bg-black/75">
            <div className="relative top-1/2">
              <div className="bg-(--bg-modal) duration-(--fast) relative left-1/2 z-[calc(var(--z-modal))] flex w-[90vw] max-w-md -translate-1/2 flex-col overflow-x-hidden rounded-2xl p-4 shadow-[0_0_16px_0_rgba(0,0,0,0.125)] transition-[opacity,visibility]">
                <p className="text-(--text-main) mb-6">
                  {props.confirmCloseMessage ?? t("Modal/Unsaved")}
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={handleConfirmClose}
                    className={`${buttonPrimaryClass} w-full grow-2 sm:w-auto`}
                  >
                    {t("Modal/Close anyway")}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCancel}
                    className={`${buttonSecondaryClass} w-full grow sm:w-auto`}
                  >
                    {t("Modal/Abort")}
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

const Content = ({ children, className }: SectionProps) => (
  <div
    className={`modal-body ${className ?? ""} relative flex flex-col gap-6 overflow-y-auto p-4`}
  >
    {children}
  </div>
);

const Footer = ({ children, className }: SectionProps) => (
  <div
    className={`${className ?? ""} border-(--border-tertiary) grid grid-cols-3 gap-4 border-t p-4`}
  >
    {children}
  </div>
);

ModalBase.displayName = "ModalBase";
(
  ModalBase as typeof ModalBase & {
    Content: typeof Content;
    Footer: typeof Footer;
  }
).Content = Content;
(
  ModalBase as typeof ModalBase & {
    Content: typeof Content;
    Footer: typeof Footer;
  }
).Footer = Footer;

export default ModalBase as typeof ModalBase & {
  Content: typeof Content;
  Footer: typeof Footer;
};
