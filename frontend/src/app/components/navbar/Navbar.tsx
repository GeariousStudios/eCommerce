"use client";

import { useEffect, useRef, useState } from "react";
import { Bars3CenterLeftIcon } from "@heroicons/react/16/solid";
import NavbarLink from "./NavbarLink";
import NavbarDropdown from "./NavbarDropdown";
import ThemeButton from "../theme/ThemeButton";

const Navbar = () => {
  // Refs.
  const menuRef = useRef<HTMLDivElement>(null);

  // States.
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [menuHeight, setMenuHeight] = useState(0);

  // Update view.
  useEffect(() => {
    const updateView = () => {
      const widthIsMobile = window.innerWidth < 640; // <-- 640 = sm breakpoint.
      setIsMobile(widthIsMobile);
      setHasInitialized(true);

      if (!widthIsMobile) {
        setIsOpen(false);
      }
    };

    updateView();
    window.addEventListener("resize", updateView);
    return () => window.removeEventListener("resize", updateView);
  }, []);

  // Set height of mobile menu.
  useEffect(() => {
    if (menuRef.current) {
      setMenuHeight(isOpen ? menuRef.current.scrollHeight : 0);
    }
  }, [isOpen, isMobile]);

  // Recalculate height when dropdown is opened.
  const recalculateHeight = (delta: number) => {
    setMenuHeight((prev) => prev + delta);
  };

  // Close mobile menu when interact outside or press escape.
  useEffect(() => {
    const handleOutside = (e: Event) => {
      const target = e.target as Node;

      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener("click", handleOutside);
      window.addEventListener("touchstart", handleOutside);
      window.addEventListener("keydown", handleEscape);
    } else {
      window.removeEventListener("click", handleOutside);
      window.removeEventListener("touchstart", handleOutside);
      window.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  return (
    <nav className="bg-navbar border-main sticky top-0 flex min-h-12 w-full flex-col border-b-2 sm:flex-row sm:items-center">
      <div className="flex sm:hidden">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          aria-controls="navbar-menu"
          aria-expanded={isOpen}
          aria-label="Visa eller dölj meny"
          className="text-navbar bg-navbar-link-hover duration-hover m-1 h-10 w-10 rounded-full transition-colors sm:hidden"
        >
          <Bars3CenterLeftIcon className="h-10 w-10 p-2" />
        </button>
        <div className="text-navbar ml-auto flex">
          <ThemeButton />
        </div>
      </div>
      <div
        ref={menuRef}
        id="navbar-menu"
        inert={isMobile && !isOpen}
        role="navigation"
        aria-label="Huvudmeny"
        style={{
          maxHeight: !hasInitialized
            ? "0px"
            : isMobile
              ? `${menuHeight}px`
              : "none",
          overflow: !hasInitialized || isMobile ? "hidden" : "visible",
        }}
        className={
          "duration-transform flex-col gap-4 transition-all sm:ml-auto sm:flex sm:h-full sm:flex-row sm:items-center"
        }
      >
        <NavbarLink href="#">Länk 1</NavbarLink>
        <NavbarDropdown
          label="Länk 2"
          isMobile={isMobile}
          isOpen={isOpen}
          onToggle={recalculateHeight}
          items={[
            { href: "#1", label: "Länk 2.1" },
            { href: "#2", label: "Länk 2.2" },
            { href: "#3", label: "Länk 2.3" },
          ]}
        />
        <NavbarLink href="#">Länk 3</NavbarLink>
        <NavbarLink href="#">Länk 4</NavbarLink>
      </div>
      <div className="text-navbar ml-auto hidden sm:flex">
        <ThemeButton />
      </div>
    </nav>
  );
};

export default Navbar;
