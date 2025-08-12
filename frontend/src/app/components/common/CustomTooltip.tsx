import * as Tooltip from "@radix-ui/react-tooltip";
import { ReactNode, useEffect, useRef, useState } from "react";

type TooltipProps = {
  content?: ReactNode;
  children?: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  hideOnClick?: boolean;
  lgHidden?: boolean;
  showOnTouch?: boolean;
  shortDelay?: boolean;
  mediumDelay?: boolean;
  longDelay?: boolean;
};

const CustomTooltip = ({
  content,
  children,
  side = "top",
  hideOnClick = false,
  lgHidden = false,
  showOnTouch = false,
  shortDelay = false,
  mediumDelay = false,
  longDelay = false,
}: TooltipProps) => {
  const [delay, setDelay] = useState<number>(0);
  const openTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (shortDelay) {
      setDelay(250);
    } else if (mediumDelay) {
      setDelay(500);
    } else if (longDelay) {
      setDelay(750);
    } else {
      setDelay(0);
    }
  }, [shortDelay, mediumDelay, longDelay]);

  const clearTimers = () => {
    if (openTimeout.current) {
      clearTimeout(openTimeout.current);
    }

    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
    }

    openTimeout.current = null;
    closeTimeout.current = null;
  };

  const handlePointerEnter = (e: PointerEvent | any) => {
    if (e.pointerType === "touch" && !showOnTouch) {
      return;
    }

    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
    }

    if (delay > 0) {
      if (openTimeout.current) {
        clearTimeout(openTimeout.current);
      }

      openTimeout.current = setTimeout(() => setIsOpen(true), delay);
    } else {
      setIsOpen(true);
    }
  };

  const handlePointerLeave = (e: PointerEvent | any) => {
    if (e.pointerType === "touch" && !showOnTouch) {
      return;
    }

    if (openTimeout.current) {
      clearTimeout(openTimeout.current);
    }

    closeTimeout.current = setTimeout(() => {
      setIsOpen(false);
    }, 0);
  };

  const handleTouchStart = () => {
    if (showOnTouch) {
      if (openTimeout.current) {
        clearTimeout(openTimeout.current);
      }

      if (closeTimeout.current) {
        clearTimeout(closeTimeout.current);
      }

      if (delay > 0) {
        openTimeout.current = setTimeout(() => setIsOpen(true), delay);
      } else {
        setIsOpen(true);
      }
    }
  };

  const handleTouchEnd = () => {
    if (showOnTouch && hideOnClick) {
      setIsOpen(false);
    }
  };

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

  useEffect(() => {
    return () => clearTimers();
  }, []);

  return (
    <Tooltip.Provider delayDuration={0} skipDelayDuration={0}>
      <Tooltip.Root open={isOpen} disableHoverableContent>
        <Tooltip.Trigger
          asChild
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
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
