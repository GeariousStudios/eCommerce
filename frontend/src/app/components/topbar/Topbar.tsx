import { roundedButtonClass } from "@/app/styles/buttonClasses";
import {
  BellIcon as SolidBellIcon,
  UserIcon as SolidUserIcon,
  ArrowLeftEndOnRectangleIcon as SolidArrowLeftEndOnRectangleIcon,
  ArrowRightEndOnRectangleIcon as SolidArrowRightEndOnRectangleIcon,
  Cog6ToothIcon as SolidCog6ToothIcon,
  MoonIcon as SolidMoonIcon,
  SunIcon as SolidSunIcon,
} from "@heroicons/react/24/solid";
import {
  BellIcon as OutlineBellIcon,
  UserIcon as OutlineUserIcon,
  ArrowLeftEndOnRectangleIcon as OutlineArrowLeftEndOnRectangleIcon,
  ArrowRightEndOnRectangleIcon as OutlineArrowRightEndOnRectangleIcon,
  Cog6ToothIcon as OutlineCog6ToothIcon,
  MoonIcon as OutlineMoonIcon,
  SunIcon as OutlineSunIcon,
} from "@heroicons/react/24/outline";
// import {
//   ArrowLeftEndOnRectangleIcon as SolidArrowLeftEndOnRectangleIcon,
//   ArrowRightEndOnRectangleIcon as SolidArrowRightEndOnRectangleIcon,
//   Cog6ToothIcon as SolidCog6ToothIcon,
//   MoonIcon as SolidMoonIcon,
//   SunIcon as SolidSunIcon,
// } from "@heroicons/react/20/solid";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useNotification } from "../notification/NotificationProvider";
import useAuthStatus from "@/app/hooks/useAuthStatus";
import Message from "../message/Message";
import MenuDropdown from "../dropdowns/MenuDropdown";
import TopbarLink from "./TopbarLink";
import useTheme from "@/app/hooks/useTheme";

type Props = {
  hasScrollbar: boolean;
};

const Topbar = (props: Props) => {
  // Refs.
  const userIconRef = useRef<HTMLButtonElement>(null);
  const bellIconRef = useRef<HTMLButtonElement>(null);

  // States.
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [userIconClicked, setUserIconClicked] = useState(false);
  const [bellIconClicked, setBellIconClicked] = useState(false);

  // Other variables.
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");
  const { notify } = useNotification();
  const { username, name, isLoggedIn, isAuthReady } = useAuthStatus();
  const { toggleTheme, currentTheme } = useTheme();

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
      <div
        inert={!isVisible}
        className={`${isVisible ? "translate-y-0" : "-translate-y-full"} ${props.hasScrollbar ? "pl-26 md:pl-71" : "pl-23 md:pl-68"} fixed top-0 right-0 z-[calc(var(--z-overlay)-2)] flex h-18 w-full border-b-1 border-[var(--border-main)] bg-[var(--bg-navbar)] p-4 transition-transform duration-[var(--slow)]`}
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
            {/* Buttons */}
            <div className="flex h-full w-full items-center justify-end gap-4">
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
                    <span className="group relative flex h-6 w-6 items-center justify-center">
                      <OutlineBellIcon
                        className={`${bellIconClicked ? "opacity-0" : "opacity-100"} absolute transition-opacity duration-[var(--fast)] group-hover:opacity-0`}
                      />
                      <SolidBellIcon
                        className={`${bellIconClicked ? "opacity-100" : "opacity-0"} absolute text-[var(--accent-color)] transition-opacity duration-[var(--fast)] group-hover:opacity-100`}
                      />
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
              <div className="relative">
                <button
                  ref={userIconRef}
                  className={`${roundedButtonClass}`}
                  onClick={() => {
                    closeAllMenus();
                    setUserIconClicked(!userIconClicked);
                  }}
                >
                  <span className="group relative flex h-6 w-6 items-center justify-center">
                    <OutlineUserIcon
                      className={`${userIconClicked ? "opacity-0" : "opacity-100"} absolute transition-opacity duration-[var(--fast)] group-hover:opacity-0`}
                    />
                    <SolidUserIcon
                      className={`${userIconClicked ? "opacity-100" : "opacity-0"} absolute text-[var(--accent-color)] transition-opacity duration-[var(--fast)] group-hover:opacity-100`}
                    />
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
                          icon={
                            currentTheme === "dark"
                              ? OutlineSunIcon
                              : OutlineMoonIcon
                          }
                          iconHover={
                            currentTheme === "dark"
                              ? SolidSunIcon
                              : SolidMoonIcon
                          }
                        />
                        {isLoggedIn && (
                          <TopbarLink
                            href="/"
                            label="Inställningar"
                            icon={OutlineCog6ToothIcon}
                            iconHover={SolidCog6ToothIcon}
                          />
                        )}
                      </div>

                      <div className="relative">
                        <hr className="absolute -mt-4 -ml-4 w-[calc(100%+2rem)] text-[var(--border-main)]" />
                        <span className="pb-1 text-sm font-semibold">
                          Session
                        </span>
                        {isLoggedIn ? (
                          <TopbarLink
                            onClick={handleLogout}
                            label="Logga ut"
                            icon={OutlineArrowLeftEndOnRectangleIcon}
                            iconHover={SolidArrowLeftEndOnRectangleIcon}
                          />
                        ) : (
                          <TopbarLink
                            href="/"
                            label="Logga in"
                            icon={OutlineArrowRightEndOnRectangleIcon}
                            iconHover={SolidArrowRightEndOnRectangleIcon}
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
