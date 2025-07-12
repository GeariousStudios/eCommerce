import Link from "next/link";
import { usePathname } from "next/navigation";
import { ElementType } from "react";
import CustomTooltip from "../common/CustomTooltip";

type Props = {
  href: string;
  label: string;
  icon: ElementType;
  iconHover: ElementType;
  disabled?: boolean;
  tooltip?: string;
};

const NavbarLink = (props: Props) => {
  const pathname = usePathname();
  const isActive = pathname === props.href;

  return (
    <>
      <CustomTooltip
        content={props.tooltip ? props.tooltip : ""}
        side="right"
        showOnTouch
      >
        <Link
          href={props.href}
          className={`${isActive ? "text-[var(--accent-color)]" : ""} ${props.disabled ? "cursor-not-allowed opacity-33" : ""} group flex h-[40px] w-[40px] items-center justify-center gap-4 rounded-lg border-1 border-transparent p-2 transition-[background,max-width] duration-[var(--fast)] hover:bg-[var(--bg-navbar-link)] md:w-full md:max-w-full md:justify-between`}
        >
          <div className="flex items-center gap-4 overflow-hidden">
            <span className="relative flex min-h-6 min-w-6 items-center">
              <props.icon
                className={`${isActive ? "opacity-0" : "opacity-100"} absolute transition-opacity duration-[var(--fast)] group-hover:opacity-0`}
              />
              <props.iconHover
                className={`${isActive ? "opacity-100" : "opacity-0"} absolute text-[var(--accent-color)] transition-opacity duration-[var(--fast)] group-hover:opacity-100`}
              />
            </span>
            <span
              className={`${isActive ? "font-bold" : ""} hidden truncate md:flex`}
            >
              {props.label}
            </span>
          </div>
        </Link>
      </CustomTooltip>
    </>
  );
};

export default NavbarLink;
