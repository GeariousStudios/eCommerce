import Link from "next/link";
import { ElementType, useState } from "react";

type Props = {
  href: string;
  label: string;
  icon: ElementType;
  iconHover: ElementType;
};

const NavbarLink = (props: Props) => {
  // States.
  const [onHover, setOnHover] = useState(false);

  // Mouse enter.
  const mouseEnter = () => {
    if (!onHover) {
      setOnHover(true);
    }
  };

  // Mouse leave.
  const mouseLeave = () => {
    if (onHover) {
      setOnHover(false);
    }
  };

  // Icon.
  const Icon = onHover && props.iconHover ? props.iconHover : props.icon;

  return (
    <div className="mx-4">
      <Link
        onMouseEnter={mouseEnter}
        onMouseLeave={mouseLeave}
        href={props.href}
        className="flex h-[38px] w-[38px] items-center gap-4 rounded-lg border-2 border-transparent p-2 text-[var(--text-navbar)] transition-[background,color,max-width] duration-[var(--fast)] hover:bg-[var(--bg-navbar-link)] md:w-full md:max-w-full md:justify-between"
      >
        <span className="flex items-center gap-4">
          <Icon
            className={`${onHover ? "text-[var(--accent-color)]" : ""} flex h-6 w-6 transition-colors duration-[var(--slow)]`}
          />
          <span className="hidden overflow-hidden whitespace-nowrap md:flex">
            {props.label}
          </span>
        </span>
      </Link>
    </div>
  );
};

export default NavbarLink;
