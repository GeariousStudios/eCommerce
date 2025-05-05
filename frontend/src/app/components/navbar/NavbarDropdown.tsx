import { ChevronDownIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type DropdownItem = {
  href: string;
  label: string;
};

type Props = {
  label: string;
  items: DropdownItem[];
  isMobile: boolean; // <-- sent from Navbar.tsx.
  isOpen: boolean; // <- sent from Navbar.tsx.
  onToggle: (heightChange: number) => void;
};

const NavbarDropdown = (props: Props) => {
  // Refs.
  const dropdownRef = useRef<HTMLUListElement>(null);

  // States.
  const [isOpen, setIsOpen] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  // Close dropdown when going to/from mobile.
  useEffect(() => {
    setIsOpen(false);
  }, [props.isMobile, props.isOpen]);

  // Open dropdown.
  const openDropdown = () => {
    if (!isOpen && dropdownRef.current) {
      const dropdownHeight = dropdownRef.current.scrollHeight;

      props.onToggle(dropdownHeight);

      setContentHeight(dropdownHeight);
      setIsOpen(true);
    }
  };

  // Open dropdown.
  const closeDropdown = () => {
    if (isOpen && dropdownRef.current) {
      const dropdownHeight = dropdownRef.current.scrollHeight;

      props.onToggle(-dropdownHeight);

      setIsOpen(false);
    }
  };

  return (
    <div
      onMouseEnter={() => {
        if (!props.isMobile) {
          openDropdown();
        }
      }}
      onMouseLeave={() => {
        if (!props.isMobile) {
          closeDropdown();
        }
      }}
      className="relative"
    >
      <button
        onClick={() => {
          if (!isOpen) {
            openDropdown();
          } else if (isOpen) {
            closeDropdown();
          }
        }}
        aria-haspopup="true"
        aria-controls="dropdown-menu"
        aria-expanded={isOpen}
        className={`${isOpen ? "bg-navbar-link" : ""} text-navbar bg-navbar-link-hover duration-hover flex w-full items-center p-3 transition-colors`}
      >
        {props.label}
        <div
          className={`${
            isOpen ? "rotate-180" : "rotate-0"
          } duration-transform ml-2 h-4 w-4 transition-transform`}
        >
          <ChevronDownIcon />
        </div>
      </button>
      <ul
        ref={dropdownRef}
        id="dropdown-menu"
        inert={!isOpen}
        aria-hidden={!isOpen}
        style={{ maxHeight: isOpen ? `${contentHeight}px` : "0px" }}
        className={`${props.isMobile ? "relative" : "absolute w-64 rounded-b border-2"} ${isOpen ? "visible" : "invisible"} border-main bg-dropdown duration-transform overflow-hidden transition-all`}
      >
        {props.items.map((item) => (
          <li
            key={item.href}
            className="bg-dropdown-link-hover transition-colors"
          >
            <Link
              href={item.href}
              tabIndex={isOpen ? 0 : -1}
              className={`${props.isMobile ? "pl-6" : ""} text-navbar block h-full w-full p-3`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NavbarDropdown;
