import Link from "next/link";
import { usePathname } from "next/navigation";
import { ElementType } from "react";
import CustomTooltip from "../common/CustomTooltip";

type Props = {
  href?: string;
  onClick?: () => void;
  label: string;
  icon?: ElementType;
  iconHover?: ElementType;
  disabled?: boolean;
  tooltip?: string;
  isActive?: boolean;
};

const ModalLink = (props: Props) => {
  const pathname = usePathname();
  const isActive = props.isActive ?? pathname === props.href;

  return (
    <>
      <CustomTooltip
        content={props.tooltip ? props.tooltip : ""}
        side="right"
        showOnTouch
      >
        {props.href ? (
          <Link
            href={props.href}
            className={`${isActive ? "text-(--accent-color)" : ""} ${props.disabled ? "cursor-not-allowed opacity-33" : ""} group flex h-[40px] w-full items-center gap-4 rounded-lg border border-transparent p-2 transition-[background,max-width] duration-(--fast) hover:bg-(--bg-modal-link) md:justify-between`}
          >
            {props.icon && props.iconHover ? (
              <div className="flex items-center gap-4 overflow-hidden">
                <span className="relative flex min-h-6 min-w-6 items-center">
                  <props.icon
                    className={`${isActive ? "opacity-0" : "opacity-100"} absolute transition-opacity duration-(--fast) group-hover:opacity-0`}
                  />

                  <props.iconHover
                    className={`${isActive ? "opacity-100" : "opacity-0"} absolute text-(--accent-color) transition-opacity duration-(--fast) group-hover:opacity-100`}
                  />
                </span>
                <span className={`${isActive ? "font-bold" : ""} truncate`}>
                  {props.label}
                </span>
              </div>
            ) : (
              <span className={`${isActive ? "font-bold" : ""} truncate`}>
                {props.label}
              </span>
            )}
          </Link>
        ) : (
          <button
            onClick={props.onClick}
            className={`${isActive ? "text-(--accent-color)" : ""} ${props.disabled ? "cursor-not-allowed opacity-33" : "cursor-pointer"} group flex h-[40px] w-full items-center gap-4 rounded-lg border border-transparent p-2 transition-[background,max-width] duration-(--fast) hover:bg-(--bg-modal-link) md:justify-between`}
          >
            {props.icon && props.iconHover ? (
              <div className="flex items-center gap-4 overflow-hidden">
                <span className="relative flex min-h-6 min-w-6 items-center">
                  <props.icon
                    className={`${isActive ? "opacity-0" : "opacity-100"} absolute transition-opacity duration-(--fast) group-hover:opacity-0`}
                  />

                  <props.iconHover
                    className={`${isActive ? "opacity-100" : "opacity-0"} absolute text-(--accent-color) transition-opacity duration-(--fast) group-hover:opacity-100`}
                  />
                </span>
                <span className={`${isActive ? "font-bold" : ""} truncate`}>
                  {props.label}
                </span>
              </div>
            ) : (
              <span className={`${isActive ? "font-bold" : ""} truncate`}>
                {props.label}
              </span>
            )}
          </button>
        )}
      </CustomTooltip>
    </>
  );
};

export default ModalLink;
