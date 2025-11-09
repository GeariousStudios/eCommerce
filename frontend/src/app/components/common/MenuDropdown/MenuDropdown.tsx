import { FocusTrap } from "focus-trap-react";
import { ReactNode, RefObject, useEffect, useRef, useState } from "react";

type Props = {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: RefObject<HTMLElement | null>;
};

const MenuDropdown = (props: Props) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<string | undefined>("16rem");
  const [entered, setEntered] = useState(false);

  const updateWidth = () => {
    const element = innerRef.current;

    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const maxWidthRight = window.innerWidth - rect.left;
    const maxWidthLeft = rect.right - 80;
    const availableWidth = Math.min(maxWidthRight, maxWidthLeft, 256);
    setWidth(`${availableWidth}px`);
  };

  useEffect(() => {
    if (!props.isOpen || !innerRef.current) {
      return;
    }

    const raf = requestAnimationFrame(updateWidth);

    return () => cancelAnimationFrame(raf);
  }, [props.isOpen]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(updateWidth);

    if (innerRef.current) {
      resizeObserver.observe(innerRef.current);
    }

    window.addEventListener("resize", updateWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  useEffect(() => {
    if (!props.isOpen) {
      setEntered(false);
      return;
    }

    setEntered(false);
    const id = requestAnimationFrame(() => {
      setEntered(true);
    });

    return () => cancelAnimationFrame(id);
  }, [props.isOpen]);

  useEffect(() => {
    if (!props.isOpen) {
      return;
    }

    updateWidth();

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
        role="dialog"
        aria-hidden={!props.isOpen}
        className={`${props.isOpen ? "visible" : "invisible"} ${props.isOpen && entered ? "opacity-100" : "opacity-0"} max-h-[462.5px] absolute top-full right-0 z-[calc(var(--z-tooltip)+1)] mt-1 flex flex-col gap-8 overflow-x-hidden overflow-y-auto rounded-2xl bg-[var(--bg-topbar)] p-4 break-words shadow-[0_0_16px_0_rgba(0,0,0,0.125)] transition-[opacity,visibility] duration-[var(--fast)]`}
        style={{ width }}
      >
        {props.children}
      </div>
    </FocusTrap>
  );
};

export default MenuDropdown;
