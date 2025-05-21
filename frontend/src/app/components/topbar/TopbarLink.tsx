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
          className="group flex w-full items-center py-2 transition-[background,max-width] duration-[var(--fast)]"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="relative flex min-h-6 min-w-6 items-center">
              <props.icon className="absolute transition-opacity duration-[var(--fast)] group-hover:opacity-0" />
              <props.iconHover className="absolute text-[var(--accent-color)] opacity-0 transition-opacity duration-[var(--fast)] group-hover:opacity-100" />
            </span>
            <span className="truncate transition-colors duration-[var(--fast)] group-hover:text-[var(--accent-color)]">
              {props.label}
            </span>
          </div>
        </Link>
      ) : (
        <button
          onClick={props.onClick}
          className="group flex w-full cursor-pointer items-center py-2 transition-[background,max-width] duration-[var(--fast)] hover:text-[var(--accent-color)]"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="relative flex min-h-6 min-w-6 items-center">
              <props.icon className="absolute transition-opacity duration-[var(--fast)] group-hover:opacity-0" />
              <props.iconHover className="absolute text-[var(--accent-color)] opacity-0 transition-opacity duration-[var(--fast)] group-hover:opacity-100" />
            </span>
            <span className="truncate transition-colors duration-[var(--fast)] group-hover:text-[var(--accent-color)]">
              {props.label}
            </span>
          </div>
        </button>
      )}
    </>
  );
};

export default TopbarLink;
