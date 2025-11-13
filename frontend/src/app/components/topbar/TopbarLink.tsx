import Link from "next/link";
import { ElementType } from "react";

type Props = {
  href?: string;
  onClick?: () => void;
  label: string;
  icon: ElementType;
  iconHover: ElementType;
};

const TopbarLink = (props: Props) => {
  return (
    <>
      {props.href ? (
        <Link
          href={props.href}
          className="group flex h-[40px] w-full cursor-pointer items-center gap-4 rounded-lg border border-transparent p-2 transition-[background,max-width] duration-(--fast) hover:bg-(--bg-topbar-link) md:justify-between"
        >
          <div className="flex items-center gap-4 overflow-hidden">
            <span className="relative flex min-h-6 min-w-6 items-center">
              <props.icon className="absolute transition-opacity duration-(--fast) group-hover:opacity-0" />
              <props.iconHover className="absolute text-(--accent-color) opacity-0 transition-opacity duration-(--fast) group-hover:opacity-100" />
            </span>
            <span className="truncate">{props.label}</span>
          </div>
        </Link>
      ) : (
        <button
          onClick={props.onClick}
          className="group flex h-[40px] w-full cursor-pointer items-center gap-4 rounded-lg border border-transparent p-2 transition-[background,max-width] duration-(--fast) hover:bg-(--bg-topbar-link) md:justify-between"
        >
          <div className="flex items-center gap-4 overflow-hidden">
            <span className="relative flex min-h-6 min-w-6 items-center">
              <props.icon className="absolute transition-opacity duration-(--fast) group-hover:opacity-0" />
              <props.iconHover className="absolute text-(--accent-color) opacity-0 transition-opacity duration-(--fast) group-hover:opacity-100" />
            </span>
            <span className="truncate">{props.label}</span>
          </div>
        </button>
      )}
    </>
  );
};

export default TopbarLink;
