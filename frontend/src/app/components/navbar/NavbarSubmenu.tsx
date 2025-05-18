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
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  // Close menu when clicking outside.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const menuElement = innerRef.current;
      const buttonElement = buttonRef.current;
      const target = event.target as Node;

      if (
        menuElement &&
        !menuElement.contains(target) &&
        buttonElement &&
        !buttonElement.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Class determining width of submenu.
  let widthClasses = "";

  if (hasScrollbar) {
    widthClasses = "w-45";
  } else {
    widthClasses = "w-42";
  }

  if (isOpen) {
    widthClasses += " max-w-45";
  } else {
    widthClasses = " max-w-0";
  }

  if (cols === 1) {
    if (isOpen) {
      if (hasScrollbar) {
        widthClasses += " sm:w-45 sm:max-w-45";
      } else {
        widthClasses += " sm:w-42 sm:max-w-42";
      }
    } else {
      if (hasScrollbar) {
        widthClasses += " sm:w-42";
      } else {
        widthClasses += " sm:w-45";
      }
    }
  } else if (cols === 2) {
    if (isOpen) {
      if (hasScrollbar) {
        widthClasses += " sm:w-85 sm:max-w-85";
      } else {
        widthClasses += " sm:w-82 sm:max-w-82";
      }
    } else {
      if (hasScrollbar) {
        widthClasses += " sm:w-82";
      } else {
        widthClasses += " sm:w-85";
      }
    }
  } else if (cols >= 3) {
    if (isOpen) {
      if (hasScrollbar) {
        widthClasses += " sm:w-125 sm:max-w-125";
      } else {
        widthClasses += " sm:w-122 sm:max-w-122";
      }
    } else {
      if (hasScrollbar) {
        widthClasses += " sm:w-122";
      } else {
        widthClasses += " sm:w-125";
      }
    }
  }

  return (
    <>
      {(!props.requiresLogin || isLoggedIn) &&
        (!props.requiresAdmin || isAdmin) &&
        (!props.requiresDev || isDev) && (
          <div>
            <div>
              <button
                ref={buttonRef}
                onClick={() => {
                  if (!isOpen) {
                    setIsOpen(true);
                  } else {
                    setIsOpen(false);
                  }
                }}
                aria-haspopup="true"
                aria-controls="submenu-menu"
                aria-expanded={isOpen}
                className={`${isOpen ? "bg-[var(--bg-navbar-link)]" : ""} group flex h-[40px] w-[40px] cursor-pointer items-center rounded-lg justify-center p-2 transition-colors duration-[var(--fast)] hover:bg-[var(--bg-navbar-link)] md:w-full md:justify-between`}
              >
                <div className="flex items-center gap-4">
                  <span className="relative flex h-6 w-6 items-center">
                    <props.icon
                      className={`${isOpen ? "opacity-0" : "opacity-100"} absolute transition-opacity duration-[var(--fast)] group-hover:opacity-0`}
                    />
                    <props.iconHover
                      className={`${isOpen ? "opacity-100" : "opacity-0"} absolute text-[var(--accent-color)] transition-opacity duration-[var(--fast)] group-hover:opacity-100`}
                    />
                  </span>
                  <span className="hidden truncate overflow-hidden md:flex">
                    {props.label}
                  </span>
                </div>

                <ChevronRightIcon
                  className={`${
                    isOpen ? "rotate-180 text-[var(--accent-color)]" : ""
                  } h-0 w-0 rotate-0 transition-[color,rotate] duration-[var(--fast)] group-hover:text-[var(--accent-color)] md:h-6 md:w-6`}
                />
              </button>
            </div>
            <div
              ref={innerRef}
              id="submenu-menu"
              inert={!isOpen}
              aria-hidden={!isOpen}
              className={` ${widthClasses} ${isOpen ? "visible" : "invisible"} ${props.hasScrollbar ? "left-22 md:left-67" : "left-19 md:left-64"} fixed top-0 h-full overflow-x-hidden border-r-1 border-[var(--border-main)] bg-[var(--bg-navbar)] transition-all duration-[var(--slow)]`}
            >
              <div className="my-4 ml-4">
                <div className="flex gap-2">
                  <props.iconHover className="flex max-h-4 min-h-4 max-w-4 min-w-4 text-[var(--accent-color)]" />
                  <span className="truncate text-xs">{props.label}</span>
                </div>
                <div
                  className={`grid gap-2 ${
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
                            <li className="truncate border-[var(--border-main)] pt-6 pb-1">
                              {menu.label}
                            </li>

                            {/* Border */}
                            <hr className="text-[var(--border-main)]" />
                            {/* Border */}

                            {menu.items.map((item, index) => (
                              <div key={index}>
                                {(!item.requiresLogin || isLoggedIn) &&
                                  (!item.requiresAdmin || isAdmin) &&
                                  (!item.requiresDev || isDev) && (
                                    <div>
                                      <li
                                        className={`${item.title ? "truncate pt-4 pb-1 text-xs font-semibold" : ""} ${!item.title && index === 0 ? "pt-2" : ""}`}
                                      >
                                        {item.title ?? ""}
                                      </li>

                                      <li className="w-34 rounded-lg transition-colors hover:bg-[var(--bg-navbar-link)]">
                                        {item.href ? (
                                          <Link
                                            onClick={() => setIsOpen(false)}
                                            href={item.href}
                                            tabIndex={isOpen ? 0 : -1}
                                            className={
                                              "flex h-full w-full truncate p-2 text-sm text-[var(--text-navbar)]"
                                            }
                                          >
                                            {item.label}
                                          </Link>
                                        ) : (
                                          <button
                                            onClick={item.onClick}
                                            tabIndex={isOpen ? 0 : -1}
                                            className={
                                              "flex h-full w-full cursor-pointer truncate p-2 text-sm text-[var(--text-navbar)]"
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
