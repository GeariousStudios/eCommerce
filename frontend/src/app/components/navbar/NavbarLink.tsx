import { LinkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
};

const NavbarLink = (props: Props) => {


  return (
    <Link
      className="bg-navbar-link-hover text-navbar duration-fast mr-3 ml-3 flex h-full items-center rounded-xl p-3 text-nowrap transition-colors"
      href={props.href}
    >

      <LinkIcon className="flex h-6 min-h-6 w-6 min-w-6" />
      <span className="duration-slow mr-3 ml-3 w-0 overflow-hidden transition-all md:w-full">
        {props.children}
      </span>
    </Link>
  );
};

export default NavbarLink;
