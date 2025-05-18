import * as Tooltip from "@radix-ui/react-tooltip";
import { ReactNode, useEffect, useRef, useState } from "react";

type TooltipProps = {
  content?: ReactNode;
  children?: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  hideOnClick?: boolean;
  lgHidden?: boolean;
};

const CustomTooltip = ({
  content,
  children,
  side = "top",
  hideOnClick = false,
  lgHidden = false,
}: TooltipProps) => {
  // Refs.
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);

  // States.
  const [isOpen, setIsOpen] = useState(false);

  const handlePointerEnter = (e: PointerEvent | any) => {
    if (e.pointerType === "touch") {
      return;
    }

    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
    }

    setIsOpen(true);
  };

  const handlePointerLeave = (e: PointerEvent | any) => {
    if (e.pointerType === "touch") {
      return;
    }

    closeTimeout.current = setTimeout(() => {
      setIsOpen(false);
    }, 0);
  };

  // const handlePointerDown = (e: PointerEvent | any) => {
  //   if (e.pointerType === "touch") {
  //     return;
  //   }

  //   setIsOpen((prev) => !prev);
  // };

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
