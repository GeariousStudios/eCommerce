import * as Tooltip from "@radix-ui/react-tooltip";
import { ReactNode, useEffect, useRef, useState } from "react";

type TooltipProps = {
  content?: ReactNode;
  children?: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  hideOnClick?: boolean;
  lgHidden?: boolean;
  touchToggle?: boolean;
};

const CustomTooltip = ({
  content,
  children,
  side = "top",
  hideOnClick = false,
  lgHidden = false,
  touchToggle = false,
}: TooltipProps) => {
  // Refs.
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);
  const isTouchEvent = useRef(false);

  // States.
  const [isOpen, setIsOpen] = useState(false);

  const handlePointerEnter = () => {
    if (isTouchEvent.current && !touchToggle) {
      return;
    }

    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
    setIsOpen(true);
  };

  const handlePointerLeave = () => {
    if (isTouchEvent.current && !touchToggle) {
      return;
    }

    closeTimeout.current = setTimeout(() => {
      setIsOpen(false);
    }, 0);
  };

  const handleClick = () => {
    if (touchToggle) {
      setIsOpen((prev) => !prev);
    }
  };

  useEffect(() => {
    const detectTouch = (event: PointerEvent) => {
      isTouchEvent.current = event.pointerType === "touch";
    };

    window.addEventListener("pointerdown", detectTouch);

    return () => {
      window.removeEventListener("pointerdown", detectTouch);
    };
  }, []);

  useEffect(() => {
    if (!hideOnClick) {
      return;
    }

    const handleGlobalClick = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleGlobalClick);
    document.addEventListener("touchstart", handleGlobalClick);

    return () => {
      document.removeEventListener("mousedown", handleGlobalClick);
      document.removeEventListener("touchstart", handleGlobalClick);
    };
  }, [isOpen]);

  return (
    <Tooltip.Provider delayDuration={0} skipDelayDuration={0}>
      <Tooltip.Root open={isOpen} disableHoverableContent={true}>
        <Tooltip.Trigger
          asChild
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onClick={touchToggle ? handleClick : undefined}
        >
          {children}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          {isOpen && content && (
            <Tooltip.Content
              side={side}
              sideOffset={3}
              className={`${lgHidden ? "lg:hidden" : ""} pointer-events-none z-[var(--z-tooltip)] rounded bg-[var(--bg-tooltip)] p-[0.4rem_0.6rem] text-[0.8rem] font-semibold text-[var(--text-tooltip)]`}
            >
              {content}
              <Tooltip.Arrow
                width={15}
                height={7.5}
                className="pointer-events-none translate-y-[-1px] fill-[var(--bg-tooltip)]"
              />
            </Tooltip.Content>
          )}
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

export default CustomTooltip;
