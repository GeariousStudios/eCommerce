"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  ReactNode,
  RefObject,
} from "react";
import { createPortal } from "react-dom";
import MenuDropdown from "./MenuDropdown";

type Props = {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLElement | null>;
  addSpacing?: number;
};

const MenuDropdownAnchor = ({
  children,
  isOpen,
  onClose,
  triggerRef,
  addSpacing,
}: Props) => {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    position: "absolute",
  });

  useLayoutEffect(() => {
    if (!isOpen) return;
    const trg = triggerRef.current;
    if (!trg) return;

    const r = trg.getBoundingClientRect();
    const cs = getComputedStyle(trg);
    const triggerZ = Number.parseInt(cs.zIndex || "0") || 0;

    setStyle({
      position: "absolute",
      left: r.left + window.scrollX,
      width: r.width,
      height: r.height,
      ...(triggerZ ? { zIndex: triggerZ + 1 } : {}),
    });

    const handle = () => {
      const rr = trg.getBoundingClientRect();
      setStyle((prev) => ({
        ...prev,
        left: rr.left + window.scrollX,
        width: rr.width,
        height: rr.height,
      }));
    };

    window.addEventListener("resize", handle, { passive: true });

    return () => {
      window.removeEventListener("resize", handle);
    };
  }, [isOpen, triggerRef]);

  useEffect(() => {
    if (!isOpen) return;

    const anchor = anchorRef.current;
    const trg = triggerRef.current;
    if (!anchor || !trg) return;

    const getScrollParent = (el: HTMLElement | null): HTMLElement => {
      let node: HTMLElement | null = el;
      while (node && node !== document.body) {
        const style = getComputedStyle(node);
        const canScrollY =
          (style.overflowY === "auto" || style.overflowY === "scroll") &&
          node.scrollHeight > node.clientHeight;
        if (canScrollY) return node;
        node = node.parentElement;
      }
      return (document.scrollingElement as HTMLElement) || document.body;
    };

    const scrollParent = getScrollParent(trg);
    const isWindow =
      scrollParent === document.body ||
      scrollParent === document.documentElement;

    const triggerRect = trg.getBoundingClientRect();
    const containerRect = isWindow
      ? new DOMRect(0, 0, window.innerWidth, window.innerHeight)
      : scrollParent.getBoundingClientRect();

    const menu = anchor.querySelector('[role="dialog"]') as HTMLElement | null;
    if (!menu) return;

    const menuRect = menu.getBoundingClientRect();
    const menuHeight = menuRect.height;

    const m = parseFloat(getComputedStyle(menu).marginTop) || 0;

    const triggerAbsTop = triggerRect.top + window.scrollY;
    const triggerAbsBottom = triggerRect.bottom + window.scrollY;
    const anchorH = triggerRect.height;

    const containerAbsBottom = isWindow
      ? window.scrollY + window.innerHeight
      : scrollParent.scrollTop + containerRect.bottom;

    const spaceBelow = containerAbsBottom - triggerAbsBottom;

    const spacing = addSpacing ?? 0;

    if (spaceBelow >= menuHeight + m) {
      setStyle((prev) => ({
        ...prev,
        top: triggerAbsTop + spacing,
      }));
    } else {
      setStyle((prev) => ({
        ...prev,
        top: triggerAbsTop - anchorH - menuHeight - 2 * m - spacing,
      }));
    }
  }, [isOpen, triggerRef]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={anchorRef}
      style={{
        ...style,
        pointerEvents: "none",
      }}
    >
      <div style={{ pointerEvents: "auto" }}>
        <MenuDropdown isOpen={isOpen} onClose={onClose} triggerRef={triggerRef}>
          {children}
        </MenuDropdown>
      </div>
    </div>,
    document.body,
  );
};

export default MenuDropdownAnchor;
