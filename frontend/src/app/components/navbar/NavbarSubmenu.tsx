import { ChevronRightIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { ComponentType, SVGProps, useEffect, useRef, useState } from "react";

type SubmenuItem = {
  title?: string;
  href: string;
  label: string;
};

type Submenu = {
  label: string;
  items: SubmenuItem[];
};

type Props = {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  menus: Submenu[];
  hasScrollbar: boolean;
};

const NavbarSubmenu = (props: Props) => {
  // Refs.
  const innerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // States.
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrollbar, setHasScrollbar] = useState(false);

  // Column amount.
  const cols = props.menus.length;

  // Mouse enter.
  const mouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setIsOpen(true);
  };

  // Mouse leave.
  const mouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 50);
  };

  // Attach observer to check for scrollbar.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const element = innerRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver(() => {
      setHasScrollbar(element.scrollHeight > element.clientHeight);
    });

    observer.observe(element);

    setHasScrollbar(element.scrollHeight > element.clientHeight);

    return () => {
      observer.disconnect();
    };
  }, [isOpen]);

  // Class determining width of submenu.
  let widthClasses = "";

  if (hasScrollbar) {
    widthClasses = "w-43";
  } else {
    widthClasses = "w-40";
  }

  if (isOpen) {
    widthClasses += " max-w-43";
  } else {
    widthClasses = " max-w-0";
  }

  if (cols === 1) {
    if (isOpen) {
      if (hasScrollbar) {
        widthClasses += " sm:w-43 sm:max-w-43";
      } else {
        widthClasses += " sm:w-40 sm:max-w-40";
      }
    } else {
      if (hasScrollbar) {
        widthClasses += " sm:w-40";
      } else {
        widthClasses += " sm:w-43";
      }
    }
  } else if (cols === 2) {
    if (isOpen) {
      if (hasScrollbar) {
        widthClasses += " sm:w-83 sm:max-w-83";
      } else {
        widthClasses += " sm:w-80 sm:max-w-80";
      }
    } else {
      if (hasScrollbar) {
        widthClasses += " sm:w-80";
      } else {
        widthClasses += " sm:w-83";
      }
    }
  } else if (cols >= 3) {
    if (isOpen) {
      if (hasScrollbar) {
        widthClasses += " sm:w-123 sm:max-w-123";
      } else {
        widthClasses += " sm:w-120 sm:max-w-120";
      }
    } else {
      if (hasScrollbar) {
        widthClasses += " sm:w-120";
      } else {
        widthClasses += " sm:w-123";
      }
    }
  }

  return (
    <div className="relative max-w-18 md:max-w-64">
      <div onMouseEnter={mouseEnter} onMouseLeave={mouseLeave}>
        <div className="mr-3 ml-3 max-w-12 md:max-w-full">
          <button
            onClick={() => {
              if (!isOpen) {
                mouseEnter();
              } else if (isOpen) {
                mouseLeave();
              }
            }}
            aria-haspopup="true"
            aria-controls="submenu-menu"
            aria-expanded={isOpen}
            className={`${isOpen ? "bg-[var(--bg-navbar-link)]" : ""} bg-navbar-link-hover flex max-h-12 w-full max-w-12 items-center justify-between rounded-xl p-3 text-[var(--text-navbar)] transition-colors duration-[var(--fast)] md:max-w-full`}
          >
            <span className="flex items-center gap-3">
              <props.icon
                className={`${isOpen ? "text-[var(--accent-color)]" : ""} flex h-6 min-h-6 w-6 min-w-6 transition-colors duration-[var(--slow)]`}
              />
              <span className="w-0 overflow-hidden text-nowrap transition-all duration-[var(--slow)] md:w-full">
                {props.label}
              </span>
            </span>

            <ChevronRightIcon
              className={`${
                isOpen ? "rotate-180 text-[var(--accent-color)]" : ""
              } h-6 min-h-6 w-0 rotate-0 transition-all duration-[var(--slow)] md:w-6 md:min-w-6`}
            />
          </button>
        </div>
        <div
          ref={innerRef}
          id="submenu-menu"
          inert={!isOpen}
          aria-hidden={!isOpen}
          className={` ${widthClasses} ${isOpen ? "visible" : "invisible"} ${props.hasScrollbar ? "left-21 md:left-67" : "left-18 md:left-64"} fixed top-0 h-svh overflow-x-hidden border-r-2 border-[var(--border-main)] bg-[var(--bg-navbar)] transition-all duration-[var(--slow)]`}
        >
          <div className="mt-3 mb-3 ml-3">
            <div className="flex gap-2">
              <props.icon className="flex max-h-4 min-h-4 max-w-4 min-w-4 text-[var(--accent-color)]" />
              <span className="text-xs text-nowrap">{props.label}</span>
            </div>
            <div
              className={`grid gap-3 ${
                cols === 1
                  ? "grid-cols-1"
                  : cols === 2
                    ? "sm:grid-cols-2"
                    : "sm:grid-cols-3"
              }`}
            >
              {props.menus.map((menu, index) => (
                <ul
                  key={index}
                  className={`${isOpen ? "opacity-100" : "opacity-0"} w-34 transition-opacity duration-[var(--fast)]`}
                >
                  <li className="border-[var(--border-main)] pt-6 pb-1 text-nowrap">
                    {menu.label}
                  </li>

                  {/* Border */}
                  <li className="h-[0.1rem] rounded bg-[var(--accent-color)]" />
                  {/* Border */}

                  {menu.items.map((item, index) => (
                    <div key={index}>
                      <li
                        className={`${item.title ? "pt-4 pb-1 text-xs font-semibold text-nowrap" : ""} ${!item.title && index === 0 ? "pt-2" : ""}`}
                      >
                        {item.title ?? ""}
                      </li>

                      <li className="w-34 rounded-xl transition-colors hover:bg-[var(--bg-navbar-link)]">
                        <Link
                          href={item.href}
                          tabIndex={isOpen ? 0 : -1}
                          className={
                            "flex h-full w-full p-2.5 text-sm text-nowrap text-[var(--text-navbar)]"
                          }
                        >
                          {item.label}
                        </Link>
                      </li>
                    </div>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavbarSubmenu;
