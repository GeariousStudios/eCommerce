import { ReactNode, RefObject, useEffect, useRef } from "react";

type Props = {
  content: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: RefObject<HTMLElement | null>;
};

const MenuDropdown = (props: Props) => {
  // Refs.
  const innerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside.
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
    <div
      ref={innerRef}
      role="dialog"
      aria-hidden={!props.isOpen}
      className={`${props.isOpen ? "visible opacity-100" : "invisible opacity-0"} absolute top-full right-0 mt-1 flex w-64 flex-col gap-8 overflow-x-hidden overflow-y-auto rounded-2xl bg-[var(--bg-topbar)] p-4 shadow-[0_0_16px_0_rgba(0,0,0,0.125)] transition-[opacity,visibility] duration-[var(--fast)]`}
    >
      {props.content}
    </div>
  );
};

export default MenuDropdown;
