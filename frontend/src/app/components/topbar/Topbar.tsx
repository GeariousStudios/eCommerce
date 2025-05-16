import { roundedButtonClass } from "@/app/styles/buttonClasses";
import { BellIcon, UserIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useNotification } from "../notification/NotificationProvider";
import useAuthStatus from "@/app/hooks/useAuthStatus";
import Message from "../message/Message";
import MenuDropdown from "../dropdowns/MenuDropdown";
import TopbarLink from "./TopbarLink";
import {
  ArrowLeftEndOnRectangleIcon,
  ArrowRightEndOnRectangleIcon,
  Cog6ToothIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/20/solid";
import useTheme from "@/app/hooks/useTheme";

const Topbar = () => {
  // Refs.
  const userIconRef = useRef<HTMLButtonElement>(null);
  const bellIconRef = useRef<HTMLButtonElement>(null);

  // States.
  const [currentTheme, setCurrentTheme] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [userIconClicked, setUserIconClicked] = useState(false);
  const [bellIconClicked, setBellIconClicked] = useState(false);

  // Other variables.
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");
  const { notify } = useNotification();
  const { username, name, isLoggedIn, isAuthReady } = useAuthStatus();
  const { toggleTheme, userTheme } = useTheme();

  //   Hide topbar on scroll.
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
        closeAllMenus();
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Update theme variable.
  useEffect(() => {
    const updateTheme = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      setCurrentTheme(theme);
    };

    updateTheme();

    window.addEventListener("theme-changed", updateTheme);
    return () => {
      window.removeEventListener("theme-changed", updateTheme);
    };
  }, []);

  // Display logout message.
  useEffect(() => {
    const message = localStorage.getItem("postLogoutNotification");
    if (message) {
      notify("info", message, 6000);
      localStorage.removeItem("postLogoutNotification");
    }
  }, []);

  /* --- BACKEND COMMUNICATION --- */
  const handleLogout = async () => {
    try {
      await fetch(`${apiUrl}/user/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
    } finally {
      localStorage.removeItem("token");
      localStorage.setItem("postLogoutNotification", "Du är nu utloggad!");
      window.location.reload();
    }
  };
  /* --- BACKEND COMMUNICATION --- */

  const closeAllMenus = () => {
    setUserIconClicked(false);
    setBellIconClicked(false);
  };

  return (
    <>
      {isAuthReady && (
        <div
          inert={isVisible}
          className={`${isVisible ? "-translate-y-full" : "translate-y-0"} fixed top-0 z-[calc(var(--z-overlay)-1)] flex h-18 transition-transform duration-[var(--slow)]`}
        >
          <Link
            href="/"
            className="mt-1.25 ml-1.75 flex h-15 max-w-17 min-w-17 md:max-w-17 md:min-w-40"
            aria-label="Startsida"
          >
            <picture>
              <source
                srcSet={`${currentTheme === "dark" ? "/images/logo_expnd_dark.svg" : "/images/logo_expnd_light.svg"}`}
                media="(min-width: 768px)"
              />
              <img
                src={`${currentTheme === "dark" ? "/images/logo_clpsd_dark.svg" : "/images/logo_clpsd_light.svg"}`}
                alt="Logga"
                className="h-full w-full"
              />
            </picture>
          </Link>
        </div>
      )}

      <div
        inert={!isVisible}
        className={`${isVisible ? "translate-y-0" : "-translate-y-full"} fixed top-0 z-[calc(var(--z-overlay)-1)] flex h-18 w-full border-b-1 border-[var(--border-main)] bg-[var(--bg-navbar)] shadow-[0_0_4px_0_rgba(0,0,0,0.1)] transition-transform duration-[var(--slow)]`}
      >
        {!isAuthReady ? (
          <div className="inline">
            <span className="hidden md:inline">
              <Message
                icon="loading"
                content="Hämtar innehåll..."
                sideMessage={true}
                fullscreen={true}
              />
            </span>
            <span className="inline md:hidden">
              <Message icon="loading" fullscreen={true} />
            </span>
          </div>
        ) : (
          <>
            <Link
              href="/"
              className="mt-1.25 ml-1.75 flex h-15 max-w-17 min-w-17 md:max-w-17 md:min-w-40"
              aria-label="Startsida"
            >
              <picture>
                <source
                  srcSet={`${currentTheme === "dark" ? "/images/logo_expnd_dark.svg" : "/images/logo_expnd_light.svg"}`}
                  media="(min-width: 768px)"
                />
                <img
                  src={`${currentTheme === "dark" ? "/images/logo_clpsd_dark.svg" : "/images/logo_clpsd_light.svg"}`}
                  alt="Logga"
                  className="h-full w-full"
                />
              </picture>
            </Link>

            {/* Buttons */}
            <div className="mr-4 flex h-full w-full items-center justify-end gap-4">
              {/* Alerts */}
              {isLoggedIn && (
                <div className="group relative">
                  <button
                    ref={bellIconRef}
                    className={`${roundedButtonClass}`}
                    onClick={() => {
                      closeAllMenus();
                      setBellIconClicked(!bellIconClicked);
                    }}
                  >
                    <span className="flex h-full w-full items-center justify-center transition-colors duration-[var(--fast)] hover:text-[var(--accent-color)]">
                      <BellIcon className="h-6 w-6" />
                    </span>
                  </button>
                  <MenuDropdown
                    triggerRef={bellIconRef}
                    isOpen={bellIconClicked}
                    onClose={() => setBellIconClicked(false)}
                    content={
                      <>
                        <span>Du har inga nya meddelanden.</span>
                      </>
                    }
                  />
                </div>
              )}

              {/* User */}
              <div className="group relative">
                <button
                  ref={userIconRef}
                  className={`${roundedButtonClass}`}
                  onClick={() => {
                    closeAllMenus();
                    setUserIconClicked(!userIconClicked);
                  }}
                >
                  <span className="flex h-full w-full items-center justify-center transition-colors duration-[var(--fast)] hover:text-[var(--accent-color)]">
                    <UserIcon className="h-6 w-6" />
                  </span>
                </button>
                <MenuDropdown
                  triggerRef={userIconRef}
                  isOpen={userIconClicked}
                  onClose={() => setUserIconClicked(false)}
                  content={
                    <>
                      {isLoggedIn && (
                        <div className="relative">
                          <span className="font-semibold break-words text-[var(--accent-color)]">
                            {name || username}
                          </span>
                          <hr className="absolute mt-4 -ml-4 flex w-[calc(100%+2rem)] text-[var(--border-main)]" />
                        </div>
                      )}
                      <div>
                        <span className="flex pb-1 text-sm font-semibold">
                          Hantera
                        </span>
                        <TopbarLink
                          onClick={toggleTheme}
                          label={
                            currentTheme === "dark"
                              ? "Byt till ljust tema"
                              : "Byt till mörkt tema"
                          }
                          icon={currentTheme === "dark" ? SunIcon : MoonIcon}
                          iconHover={
                            currentTheme === "dark" ? SunIcon : MoonIcon
                          }
                        />
                        {isLoggedIn && (
                          <TopbarLink
                            href="/"
                            label="Inställningar"
                            icon={Cog6ToothIcon}
                            iconHover={Cog6ToothIcon}
                          />
                        )}
                      </div>

                      <div className="relative">
                        <hr className="absolute -mt-4 -ml-4 w-[calc(100%+2rem)] opacity-25" />
                        <span className="pb-1 text-sm font-semibold">
                          Session
                        </span>
                        {isLoggedIn ? (
                          <TopbarLink
                            onClick={handleLogout}
                            label="Logga ut"
                            icon={ArrowLeftEndOnRectangleIcon}
                            iconHover={ArrowLeftEndOnRectangleIcon}
                          />
                        ) : (
                          <TopbarLink
                            href="/"
                            label="Logga in"
                            icon={ArrowRightEndOnRectangleIcon}
                            iconHover={ArrowRightEndOnRectangleIcon}
                          />
                        )}
                      </div>
                    </>
                  }
                />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Topbar;
