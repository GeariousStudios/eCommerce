import Link from "next/link";
import { ComponentType, ReactNode, SVGProps, useState } from "react";

type Props = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
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

  return (
    <Link
      onMouseEnter={mouseEnter}
      onMouseLeave={mouseLeave}
      className="mr-3 ml-3 flex max-h-12 max-w-12 items-center rounded-xl p-3 text-[var(--text-navbar)] transition-colors duration-[var(--fast)] hover:bg-[var(--bg-navbar-link)] md:max-w-full"
      href={props.href}
    >
      <props.icon
        className={`${onHover ? "text-[var(--accent-color)]" : ""} flex h-6 min-h-6 w-6 min-w-6 transition-colors duration-[var(--slow)]`}
      />
      <span className="mr-3 ml-3 w-0 overflow-hidden text-nowrap transition-all duration-[var(--slow)] md:w-full">
        {props.label}
      </span>
    </Link>
  );
};

export default NavbarLink;
