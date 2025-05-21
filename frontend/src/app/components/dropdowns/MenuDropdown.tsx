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

  const updateWidth = () => {
    const element = innerRef.current;

    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const maxWidthRight = window.innerWidth - rect.left;
    const maxWidthLeft = rect.right - 24;
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
    <div
      ref={innerRef}
      role="dialog"
      aria-hidden={!props.isOpen}
      className={`${props.isOpen ? "visible opacity-100" : "invisible opacity-0"} absolute top-full right-0 z-[calc(var(--z-tooltip)+1)] mt-2 flex flex-col overflow-x-hidden overflow-y-auto rounded-2xl bg-[var(--bg-navbar-submenu)] p-6 text-[var(--text-navbar)] shadow-[0_0_16px_0_rgba(0,0,0,0.125)] transition-[opacity,visibility] duration-[var(--fast)]`}
      style={{ width }}
    >
      {props.children}
    </div>
  );
};

export default MenuDropdown;
