import Link from "next/link";
import { ElementType } from "react";

type Props = {
  href: string;
  label: string;
  icon: ElementType;
  iconHover: ElementType;
};

const NavbarLink = (props: Props) => {
  return (
    <>
      <Link
        href={props.href}
        className="group flex h-[40px] w-[40px] items-center justify-center gap-4 rounded-lg border-1 border-transparent p-2 transition-[background,max-width] duration-[var(--fast)] hover:bg-[var(--bg-navbar-link)] md:w-full md:max-w-full md:justify-between"
      >
        <div className="flex items-center gap-4 overflow-hidden">
          <span className="relative flex min-h-6 min-w-6 items-center">
            <props.icon className="absolute transition-opacity duration-[var(--fast)] group-hover:opacity-0" />
            <props.iconHover className="absolute text-[var(--accent-color)] opacity-0 transition-opacity duration-[var(--fast)] group-hover:opacity-100" />
          </span>
          <span className="hidden truncate md:flex">{props.label}</span>
        </div>
      </Link>
    </>
  );
};

export default NavbarLink;
