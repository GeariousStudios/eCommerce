import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { LinkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";

type DropdownItem = {
  href: string;
  label: string;
};

type Props = {
  label: string;
  rows: number;
  items: DropdownItem[];
};

const NavbarDropdown = (props: Props) => {
  // States.
  const [isOpen, setIsOpen] = useState(false);

  // Open dropdown.
  const openDropdown = () => {
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  // Close dropdown.
  const closeDropdown = () => {
    if (isOpen) {
      setIsOpen(false);
    }
  };

  return (
    <div
      onMouseEnter={openDropdown}
      onMouseLeave={closeDropdown}
      className="relative"
    >
      <div className="mr-3 ml-3">
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
          className={`${isOpen ? "bg-navbar-link" : ""} text-navbar bg-navbar-link-hover duration-fast flex w-full items-center justify-between rounded-xl p-3 text-nowrap transition-colors`}
        >
          <span className="flex items-center gap-3">
            <LinkIcon
              className={`${isOpen ? "text-accent-color" : ""} duration-slow flex h-6 min-h-6 w-6 min-w-6 justify-start transition-colors`}
            />
            <span className="duration-slow w-0 overflow-hidden transition-all md:w-full">
              {props.label}
            </span>
          </span>

          <ChevronRightIcon
            className={`${
              isOpen ? "text-accent-color rotate-180" : ""
            } duration-slow h-6 min-h-6 w-0 rotate-0 transition-all md:w-6 md:min-w-6`}
          />
        </button>
      </div>
      <ul
        id="dropdown-menu"
        inert={!isOpen}
        aria-hidden={!isOpen}
        className={`border-main bg-dropdown duration-slow fixed top-0 left-18 h-svh w-64 overflow-hidden border-r-2 text-nowrap transition-all md:left-64 ${
          isOpen ? "visible max-w-64" : "invisible max-w-0"
        } ${
          props.rows === 1
            ? isOpen
              ? "md:w-64 md:max-w-64"
              : "md:w-64"
            : props.rows === 2
              ? isOpen
                ? "md:w-96 md:max-w-96"
                : "md:w-96"
              : props.rows === 3
                ? isOpen
                  ? "md:w-128 md:max-w-128"
                  : "md:w-128"
                : ""
        }`}
      >
        {props.items.map((item) => (
          <li
            key={item.href}
            className="bg-dropdown-link-hover m-3 w-58 rounded-xl transition-colors"
          >
            <Link
              href={item.href}
              tabIndex={isOpen ? 0 : -1}
              className={"text-navbar flex h-full w-full p-3"}
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
