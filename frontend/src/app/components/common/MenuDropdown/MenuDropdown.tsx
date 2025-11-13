import { FocusTrap } from "focus-trap-react";
import { ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: RefObject<HTMLElement | null>;
  closeOnScroll?: boolean;
  onModal?: boolean;
};

const MenuDropdown = (props: Props) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<string | undefined>("16rem");
  const [entered, setEntered] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updateWidthAndPosition = () => {
    if (!props.triggerRef?.current) return;

    const rect = props.triggerRef.current.getBoundingClientRect();
    const desiredWidth = 256;
    const leftPos = rect.right - desiredWidth;

    const adjustedWidth = leftPos < 8 ? rect.right - 8 : desiredWidth;

    setWidth(`${adjustedWidth}px`);
    setPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.right - adjustedWidth + window.scrollX,
    });
  };

  useEffect(() => {
    if (!props.isOpen) {
      return;
    }

    const triggerEl = props.triggerRef?.current;
    if (!triggerEl) {
      return;
    }

    updateWidthAndPosition();

    const scrollContainer = triggerEl.closest(".modal-body");
    if (scrollContainer) {
      scrollContainer.addEventListener(
        "scroll",
        props.closeOnScroll ? props.onClose : updateWidthAndPosition,
      );
    }

    window.addEventListener("resize", updateWidthAndPosition);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) {
          props.onClose();
        }
      },
      {
        root: scrollContainer || null,
        threshold: 0,
      },
    );

    observer.observe(triggerEl);

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", updateWidthAndPosition);
      }
      window.removeEventListener("resize", updateWidthAndPosition);
      observer.disconnect();
    };
  }, [props.isOpen]);

  useEffect(() => {
    if (!props.isOpen) {
      setEntered(false);
      return;
    }

    updateWidthAndPosition();

    const timeout = setTimeout(() => {
      updateWidthAndPosition();
    }, 0);

    const id = requestAnimationFrame(() => setEntered(true));

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(id);
    };
  }, [props.isOpen]);

  useEffect(() => {
    if (!props.isOpen) {
      return;
    }

    updateWidthAndPosition();

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

  const dropdown = (
    <FocusTrap
      active={props.isOpen}
      focusTrapOptions={{
        initialFocus: false,
        allowOutsideClick: true,
        escapeDeactivates: true,
        fallbackFocus: () => innerRef.current ?? document.body,
      }}
    >
      <div
        ref={innerRef}
        {...(props.onModal ? { "data-inside-modal": "true" } : {})}
        role="dialog"
        aria-hidden={!props.isOpen}
        className={`${props.isOpen ? "visible" : "invisible"} ${props.isOpen && entered ? "opacity-100" : "opacity-0"} bg-(--bg-topbar) duration-(--fast) absolute top-full right-0 z-[calc(var(--z-tooltip)+1)] mt-1 flex max-h-[462.5px] flex-col gap-8 overflow-x-hidden overflow-y-auto rounded-2xl p-4 break-words shadow-[0_0_16px_0_rgba(0,0,0,0.125)] transition-[opacity,visibility]`}
        style={{
          width,
          top: position.top,
          left: position.left,
        }}
      >
        {props.children}
      </div>
    </FocusTrap>
  );

  return props.isOpen ? createPortal(dropdown, document.body) : null;
};

export default MenuDropdown;
