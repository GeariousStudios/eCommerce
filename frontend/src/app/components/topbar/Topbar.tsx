import {
  buttonNeutralClass,
  iconClass16,
  roundedButtonClass,
} from "@/app/styles/buttonClasses";
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
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useToast } from "../toast/ToastProvider";
import useAuthStatus from "@/app/hooks/useAuthStatus";
import Message from "../message/Message";
import MenuDropdown from "../dropdowns/MenuDropdown";
import TopbarLink from "./TopbarLink";
import useTheme from "@/app/hooks/useTheme";

type Props = {
  hasScrollbar: boolean;
};

const Topbar = (props: Props) => {
  // --- VARIABLES ---
  // --- Refs ---
  const userIconRef = useRef<HTMLButtonElement>(null);
  const bellIconRef = useRef<HTMLButtonElement>(null);

  // --- States ---
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [userIconClicked, setUserIconClicked] = useState(false);
  const [bellIconClicked, setBellIconClicked] = useState(false);

  // --- Other ---
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");
  const { notify } = useToast();
  const { username, name, isLoggedIn, isAuthReady } = useAuthStatus();
  const { toggleTheme, currentTheme } = useTheme();

  // --- HIDE TOPBAR ON SCROLL ---
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

  /* --- BACKEND --- */
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
      localStorage.setItem("postLogoutToast", "Du är nu utloggad!");
      window.location.reload();
    }
  };

  // --- LOGOUT MESSAGE ---
  useEffect(() => {
    const message = localStorage.getItem("postLogoutToast");
    if (message) {
      notify("info", message, 6000);
      localStorage.removeItem("postLogoutToast");
    }
  }, []);

  // --- CLOSE ALL MENUS ---
  const closeAllMenus = () => {
    setUserIconClicked(false);
    setBellIconClicked(false);
  };

  // --- CLASSES ---
  let titleClass =
    "text-xs font-bold text-[var(--text-navbar-header)] uppercase";

  return (
    <>
      <div
        inert={!isVisible}
        className={`${isVisible ? "translate-y-0" : "-translate-y-full"} fixed right-6 z-[calc(var(--z-overlay)-3)] flex min-h-10 w-full max-w-[calc(100%-19rem)] bg-[var(--bg-main)] py-6 transition-transform duration-[var(--slow)]`}
      >
        {!isAuthReady ? (
          <div className="inline">
            <Message
              icon="loading"
              content="Hämtar innehåll..."
              sideMessage
              fullscreen
            />
          </div>
        ) : (
          <>
            {/* --- WELCOME MESSAGE --- */}
            {isLoggedIn && (
              <div className="hidden w-full items-center text-[26px] whitespace-nowrap lg:flex">
                Välkommen, {name}!
              </div>
            )}

            {/* --- BUTTONS AND THEIR CONTENT --- */}
            <div className="flex w-full items-center justify-end gap-4">
              {/* --- Website --- */}
              {isLoggedIn && (
                <button className={`${buttonNeutralClass} 2xs:min-w-36 mr-4`}>
                  <ArrowTopRightOnSquareIcon className={iconClass16} />
                  <span className="2xs:flex hidden">Visa hemsida</span>
                </button>
              )}

              {/* --- Alerts --- */}
              {isLoggedIn && (
                <div className="relative">
                  <button
                    ref={bellIconRef}
                    className={`${roundedButtonClass} group`}
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
                        className={`${bellIconClicked ? "opacity-100" : "opacity-0"} absolute text-[var(--button-rounded-stroke)] transition-opacity duration-[var(--fast)] group-hover:opacity-100`}
                      />
                    </span>
                  </button>

                  <MenuDropdown
                    triggerRef={bellIconRef}
                    isOpen={bellIconClicked}
                    onClose={() => setBellIconClicked(false)}
                  >
                    <span>Du har inga nya meddelanden.</span>
                  </MenuDropdown>
                </div>
              )}

              {/* --- User --- */}
              <div className="relative">
                <button
                  ref={userIconRef}
                  className={`${roundedButtonClass} group`}
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
                      className={`${userIconClicked ? "opacity-100" : "opacity-0"} absolute text-[var(--button-rounded-stroke)] transition-opacity duration-[var(--fast)] group-hover:opacity-100`}
                    />
                  </span>
                </button>

                <MenuDropdown
                  triggerRef={userIconRef}
                  isOpen={userIconClicked}
                  onClose={() => setUserIconClicked(false)}
                >
                  {isLoggedIn && (
                    <div>
                      <span className="font-semibold text-[var(--text-navbar-header)]">
                        {name || username}
                      </span>
                    </div>
                  )}

                  {isLoggedIn && <hr className="my-6 text-[var(--hr-fill)]" />}

                  <div className="flex flex-col gap-2">
                    <span className={titleClass}>Hantera</span>
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
                        currentTheme === "dark" ? SolidSunIcon : SolidMoonIcon
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

                  <hr className="mt-4 mb-6 text-[var(--hr-fill)]" />

                  <div className="flex flex-col">
                    <span className={titleClass}>Session</span>
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
                </MenuDropdown>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Topbar;
