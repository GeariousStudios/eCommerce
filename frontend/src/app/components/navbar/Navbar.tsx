"use client";

import { LinkIcon, UserIcon } from "@heroicons/react/24/outline";
import NavbarLink from "./NavbarLink";
import NavbarSubmenu from "./NavbarSubmenu";
import ThemeButton from "../theme/ThemeButton";
import { useEffect, useRef } from "react";

type Props = {
  hasScrollbar: boolean;
  setHasScrollbar: (value: boolean) => void;
};

const Navbar = (props: Props) => {
  // Refs.
  const innerRef = useRef<HTMLDivElement>(null);

  // Other variables.
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  /* --- BACKEND COMMUNICATION --- */
  const handleLogout = async () => {
    const response = await fetch(`${apiUrl}/user/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      localStorage.removeItem("token");
      window.location.reload();
    } else {
      console.error("Utloggning misslyckades!");
    }
  };
  /* --- BACKEND COMMUNICATION --- */

  // Attach observer to check for scrollbar.
  useEffect(() => {
    const element = innerRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver(() => {
      props.setHasScrollbar(element.scrollHeight > element.clientHeight);
    });

    observer.observe(element);

    props.setHasScrollbar(element.scrollHeight > element.clientHeight);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div className="overflow-y-auto" />
      <nav
        className={`${props.hasScrollbar ? "w-21 md:w-67" : "w-18 md:w-64"} fixed flex h-svh flex-col bg-[var(--bg-navbar)] duration-[var(--slow)]`}
      >
        {/* Simulated border. */}
        <div className="relative h-full w-full">
          <div className="pointer-events-none absolute top-0 left-0 h-full w-full border-r-2 border-[var(--border-main)]" />
          <div
            ref={innerRef}
            id="navbar-menu"
            role="navigation"
            aria-label="Huvudmeny"
            className={"flex h-full flex-col overflow-x-hidden"}
          >
            {/* Temporary margin. */}
            <div className="mt-3" />
            {/* Temporary margin */}

            <NavbarSubmenu
              label="Länk 1"
              icon={LinkIcon}
              menus={[
                {
                  label: "Rubrik",
                  items: [
                    { title: "Titel", href: "#1", label: "Länk 1.1" },
                    { href: "#2", label: "Länk 1.2" },
                    { title: "Titel", href: "#3", label: "Länk 1.3" },
                  ],
                },
                {
                  label: "Rubrik",
                  items: [
                    { href: "#1", label: "Länk 1.4" },
                    { title: "Titel", href: "#2", label: "Länk 1.5" },
                    { href: "#3", label: "Länk 1.6" },
                  ],
                },
              ]}
              hasScrollbar={props.hasScrollbar}
            />

            <NavbarSubmenu
              label="Användare"
              icon={UserIcon}
              menus={[
                {
                  label: "Rubrik",
                  items: [
                    { title: "Titel", href: "#1", label: "Länk 1.1" },
                    { href: "#2", label: "Länk 1.2" },
                    { title: "Titel", href: "#3", label: "Länk 1.3" },
                  ],
                },
                {
                  label: "Rubrik",
                  items: [
                    { href: "#1", label: "Länk 1.4" },
                    { title: "Titel", href: "#2", label: "Länk 1.5" },
                    { href: "#3", label: "Länk 1.6" },
                  ],
                },
              ]}
              hasScrollbar={props.hasScrollbar}
            />

            <NavbarLink href="#" label="Länk 2" icon={LinkIcon} />

            <button type="button" onClick={handleLogout}>
              Logga ut
            </button>

            <div className="mt-auto ml-3 text-[var(--text-navbar)]">
              <ThemeButton />
            </div>

            {/* Temporary margin. */}
            <div className="mb-3" />
            {/* Temporary margin */}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
