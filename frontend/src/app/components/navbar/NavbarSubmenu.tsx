import useAuthStatus from "@/app/hooks/useAuthStatus";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { ElementType, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

// --- PROPS ---
type SubmenuItem = {
  href?: string;
  onClick?: () => void;
  label: string;

  requiresLogin?: boolean;
  requiresAdmin?: boolean;
  requiresDev?: boolean;
};

type Submenu = {
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
  // --- VARIABLES ---
  // --- Refs ---
  const innerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // --- States ---
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrollbar, setHasScrollbar] = useState(false);

  // --- Other ---
  const { isLoggedIn, isAdmin, isDev } = useAuthStatus();

  // --- COLUMN AMOUNT ---
  const visibleMenus = props.menus.filter(
    (menu) =>
      (!menu.requiresLogin || isLoggedIn) &&
      (!menu.requiresAdmin || isAdmin) &&
      (!menu.requiresDev || isDev),
  );

  const cols = visibleMenus.length;

  // --- SCROLLBAR OBSERVER ---
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

  // --- CLOSE ON CLICK OUTSIDE ---
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

  const submenu = (
    <div
      ref={innerRef}
      id="submenu-menu"
      inert={!isOpen}
      className={`${isOpen ? "visible max-w-49" : "invisible max-w-2"} fixed top-1/2 z-[calc(var(--z-overlay)-3)] h-[calc(100%-3rem)] w-49 -translate-y-1/2 overflow-x-hidden rounded-r-2xl bg-[var(--bg-navbar-submenu)] text-[var(--text-navbar)] transition-all duration-[var(--slow)] left-60`}
    >
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
                  className={`${isOpen ? "opacity-100" : "opacity-0"} w-full p-6 pl-8 transition-opacity duration-[var(--fast)]`}
                >
                  {menu.items.map((item, index) => (
                    <div key={index}>
                      {(!item.requiresLogin || isLoggedIn) &&
                        (!item.requiresAdmin || isAdmin) &&
                        (!item.requiresDev || isDev) && (
                          <div>
                            <li className="w-34 rounded-lg transition-colors hover:text-[var(--accent-color)]">
                              {item.href ? (
                                <Link
                                  onClick={() => setIsOpen(false)}
                                  href={item.href}
                                  tabIndex={isOpen ? 0 : -1}
                                  className={"flex h-full w-full truncate p-2"}
                                >
                                  {item.label}
                                </Link>
                              ) : (
                                <button
                                  onClick={item.onClick}
                                  tabIndex={isOpen ? 0 : -1}
                                  className={
                                    "flex h-full w-full cursor-pointer truncate p-2 hover:text-[var(--accent-color)]"
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
  );

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
                className="group flex w-full cursor-pointer items-center py-2 transition-colors duration-[var(--fast)] justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="relative flex h-6 w-6 items-center">
                    <props.icon
                      className={`${isOpen ? "opacity-0" : "opacity-100"} absolute transition-opacity duration-[var(--fast)] group-hover:opacity-0`}
                    />
                    <props.iconHover
                      className={`${isOpen ? "opacity-100" : "opacity-0"} absolute text-[var(--accent-color)] transition-opacity duration-[var(--fast)] group-hover:opacity-100`}
                    />
                  </span>
                  <span
                    className={`${isOpen ? "text-[var(--accent-color)]" : ""} truncate overflow-hidden font-semibold duration-[var(--fast)] group-hover:text-[var(--accent-color)]`}
                  >
                    {props.label}
                  </span>
                </div>

                <ChevronRightIcon
                  className={`${
                    isOpen ? "rotate-180 text-[var(--accent-color)]" : ""
                  } rotate-0 transition-[color,rotate] duration-[var(--fast)] group-hover:text-[var(--accent-color)] h-6 w-6`}
                />
              </button>
            </div>
          </div>
        )}
      {ReactDOM.createPortal(submenu, document.body)}
    </>
  );
};

export default NavbarSubmenu;
