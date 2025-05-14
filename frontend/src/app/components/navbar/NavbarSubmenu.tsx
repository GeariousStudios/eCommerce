import useAuthStatus from "@/app/hooks/useAuthStatus";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import {
  ComponentType,
  ElementType,
  SVGProps,
  useEffect,
  useRef,
  useState,
} from "react";

type SubmenuItem = {
  title?: string;
  href?: string;
  onClick?: () => void;
  label: string;

  requiresLogin?: boolean;
  requiresAdmin?: boolean;
  requiresDev?: boolean;
};

type Submenu = {
  label: string;
  items: SubmenuItem[];

  requiresLogin?: boolean;
  requiresAdmin?: boolean;
  requiresDev?: boolean;
};

type Props = {
  label: string;
  icon: ElementType;
  iconHover: ElementType;
  menus: Submenu[];
  hasScrollbar: boolean;

  requiresLogin?: boolean;
  requiresAdmin?: boolean;
  requiresDev?: boolean;
};

const NavbarSubmenu = (props: Props) => {
  // Refs.
  const innerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // States.
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrollbar, setHasScrollbar] = useState(false);
  const { isLoggedIn, isAdmin, isDev } = useAuthStatus();

  // Column amount.
  const visibleMenus = props.menus.filter(
    (menu) =>
      (!menu.requiresLogin || isLoggedIn) &&
      (!menu.requiresAdmin || isAdmin) &&
      (!menu.requiresDev || isDev),
  );

  const cols = visibleMenus.length;

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
    }, 25);
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

  // Icon.
  const Icon = isOpen && props.iconHover ? props.iconHover : props.icon;

  return (
    <>
      {(!props.requiresLogin || isLoggedIn) &&
        (!props.requiresAdmin || isAdmin) &&
        (!props.requiresDev || isDev) && (
          <div onMouseEnter={mouseEnter} onMouseLeave={mouseLeave}>
            <div className="mx-4">
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
                className={`${isOpen ? "bg-[var(--bg-navbar-link)]" : ""} bg-navbar-link-hover h-[38px] w-[38px] rounded-lg border-2 border-transparent p-2 text-[var(--text-navbar)] transition-colors duration-[var(--fast)] md:flex md:w-full md:justify-between`}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={`${isOpen ? "text-[var(--accent-color)]" : ""} h-6 w-6 transition-colors duration-[var(--slow)]`}
                  />
                  <span className="hidden overflow-hidden whitespace-nowrap md:flex">
                    {props.label}
                  </span>
                </span>

                <ChevronRightIcon
                  className={`${
                    isOpen ? "rotate-180 text-[var(--accent-color)]" : ""
                  } h-0 w-0 rotate-0 transition-[color,rotate] duration-[var(--slow)] md:h-6 md:w-6`}
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
                  <props.iconHover className="flex max-h-4 min-h-4 max-w-4 min-w-4 text-[var(--accent-color)]" />
                  <span className="text-xs whitespace-nowrap">
                    {props.label}
                  </span>
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
                    <div key={index}>
                      {(!menu.requiresLogin || isLoggedIn) &&
                        (!menu.requiresAdmin || isAdmin) &&
                        (!menu.requiresDev || isDev) && (
                          <ul
                            className={`${isOpen ? "opacity-100" : "opacity-0"} w-34 transition-opacity duration-[var(--fast)]`}
                          >
                            <li className="border-[var(--border-main)] pt-6 pb-1 whitespace-nowrap">
                              {menu.label}
                            </li>

                            {/* Border */}
                            <li className="h-[2px] rounded bg-[var(--border-main)]" />
                            {/* Border */}

                            {menu.items.map((item, index) => (
                              <div key={index}>
                                {(!item.requiresLogin || isLoggedIn) &&
                                  (!item.requiresAdmin || isAdmin) &&
                                  (!item.requiresDev || isDev) && (
                                    <div>
                                      <li
                                        className={`${item.title ? "pt-4 pb-1 text-xs font-semibold whitespace-nowrap" : ""} ${!item.title && index === 0 ? "pt-2" : ""}`}
                                      >
                                        {item.title ?? ""}
                                      </li>

                                      <li className="w-34 rounded-lg transition-colors hover:bg-[var(--bg-navbar-link)]">
                                        {item.href ? (
                                          <Link
                                            href={item.href}
                                            tabIndex={isOpen ? 0 : -1}
                                            className={
                                              "flex h-full w-full p-2 text-sm whitespace-nowrap text-[var(--text-navbar)]"
                                            }
                                          >
                                            {item.label}
                                          </Link>
                                        ) : (
                                          <button
                                            onClick={item.onClick}
                                            tabIndex={isOpen ? 0 : -1}
                                            className={
                                              "flex h-full w-full cursor-pointer p-2 text-sm whitespace-nowrap text-[var(--text-navbar)]"
                                            }
                                          >
                                            {item.label}
                                          </button>
                                        )}
                                      </li>
                                    </div>
                                  )}
                              </div>
                            ))}
                          </ul>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
    </>
  );
};

export default NavbarSubmenu;
