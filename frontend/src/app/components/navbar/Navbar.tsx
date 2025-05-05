"use client";

import { useRef } from "react";
import NavbarLink from "./NavbarLink";
import NavbarSubmenu from "./NavbarSubmenu";
import ThemeButton from "../theme/ThemeButton";

const Navbar = () => {
  return (
    <nav className="bg-navbar duration-slow fixed flex h-svh w-18 flex-col md:w-64">
      {/* Simulated border. */}
      <div className="border-main pointer-events-none absolute top-0 left-0 h-full w-full border-r-2" />
      <div
        id="navbar-menu"
        role="navigation"
        aria-label="Huvudmeny"
        className={"flex flex-col"}
      >
        {/* Temporary margin. */}
        <div className="mt-3"/>
        <NavbarSubmenu
          label="Länk 1"
          rows={3}
          items={[
            { href: "#1", label: "Länk 1.1" },
            { href: "#2", label: "Länk 1.2" },
            { href: "#3", label: "Länk 1.3" },
          ]}
        />
        <NavbarSubmenu
          label="Länk 2"
          rows={1}
          items={[
            { href: "#1", label: "Länk 2.1" },
            { href: "#2", label: "Länk 2.2" },
            { href: "#3", label: "Länk 2.3" },
          ]}
        />
        <NavbarSubmenu
          label="Länk 3"
          rows={1}
          items={[
            { href: "#1", label: "Länk 3.1" },
            { href: "#2", label: "Länk 3.2" },
            { href: "#3", label: "Länk 3.3" },
          ]}
        />
        <NavbarLink href="#">Länk 4</NavbarLink>
      </div>
      <div className="text-navbar ml-auto flex">
        <ThemeButton />
      </div>
    </nav>
  );
};

export default Navbar;
