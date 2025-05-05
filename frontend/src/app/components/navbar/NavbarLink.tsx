import Link from "next/link";
import { ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
};

const NavbarLink = (props: Props) => {
  return (
    <Link
      className="bg-navbar-link-hover text-navbar duration-hover flex h-full items-center p-3 transition-colors"
      href={props.href}
    >
      {props.children}
    </Link>
  );
};

export default NavbarLink;
