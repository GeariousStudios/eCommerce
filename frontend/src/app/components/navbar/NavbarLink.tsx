import Link from "next/link";
import { usePathname } from "next/navigation";
import { ElementType } from "react";

type Props = {
  href: string;
  label: string;
  icon: ElementType;
  iconHover: ElementType;
};

const NavbarLink = (props: Props) => {
  const pathname = usePathname();
  const isActive = pathname === props.href;

  return (
    <>
      <Link
        href={props.href}
        className={`${isActive ? "text-[var(--accent-color)]" : ""} group flex w-full items-center py-2 transition-[background,max-width] duration-[var(--fast)] justify-between`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="relative flex min-h-6 min-w-6 items-center">
            <props.icon
              className={`${isActive ? "opacity-0" : "opacity-100"} absolute transition-opacity duration-[var(--fast)] group-hover:opacity-0`}
            />
            <props.iconHover
              className={`${isActive ? "opacity-100" : "opacity-0"} absolute text-[var(--accent-color)] transition-opacity duration-[var(--fast)] group-hover:opacity-100`}
            />
          </span>
          <span className="truncate font-semibold duration-[var(--fast)] group-hover:text-[var(--accent-color)]">
            {props.label}
          </span>
        </div>
      </Link>
    </>
  );
};

export default NavbarLink;
