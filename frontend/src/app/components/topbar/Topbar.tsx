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
import { useEffect, useRef, useState } from "react";
import { useToast } from "../toast/ToastProvider";
import useAuthStatus from "@/app/hooks/useAuthStatus";
import Message from "../message/Message";
import MenuDropdown from "../dropdowns/MenuDropdown";
import TopbarLink from "./TopbarLink";
import useTheme from "@/app/hooks/useTheme";
import SettingsModal from "../modals/SettingsModal";

type Props = {
  hasScrollbar: boolean;
};

const Topbar = (props: Props) => {
  // --- VARIABLES ---
  // --- Refs ---
  const userIconRef = useRef<HTMLButtonElement>(null);
  const bellIconRef = useRef<HTMLButtonElement>(null);

  // --- States ---
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [userIconClicked, setUserIconClicked] = useState(false);
  const [bellIconClicked, setBellIconClicked] = useState(false);

  // --- Other ---
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");
  const { notify } = useToast();
  const {
    username,
    firstName,
    lastName,
    isLoggedIn,
    isAuthReady,
    fetchAuthData,
  } = useAuthStatus();
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

  return (
    <>
      {/* --- MODAL(S) --- */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onProfileUpdated={fetchAuthData}
      />

      <div
        inert={!isVisible}
        className={`${isVisible ? "translate-y-0" : "-translate-y-full"} ${props.hasScrollbar ? "max-w-[calc(100%-5.5rem)] md:max-w-[calc(100%-17.75rem)]" : "max-w-[calc(100%-4.75rem)] md:max-w-[calc(100%-16rem)]"} transition-transforn fixed top-0 right-0 z-[calc(var(--z-overlay)-2)] flex h-18 w-full border-b-1 border-[var(--border-main)] bg-[var(--bg-navbar)] p-4 duration-[var(--slow)]`}
      >
        {!isAuthReady ? (
          <div className="inline">
            <span className="hidden md:inline">
              <Message
                icon="loading"
                content="Hämtar innehåll..."
                sideMessage
                fullscreen
                withinContainer
              />
            </span>
            <span className="inline md:hidden">
              <Message icon="loading" fullscreen withinContainer />
            </span>
          </div>
        ) : (
          <>
            {/* --- WELCOME MESSAGE --- */}
            {isLoggedIn && (
              <div className="xs:flex hidden w-full items-center text-lg whitespace-nowrap">
                <span className="">Välkommen tillbaka,&nbsp;</span>
                <span className="font-semibold text-[var(--accent-color)]">
                  {firstName ? firstName : username}
                </span>
                !
              </div>
            )}

            {/* --- BUTTONS AND THEIR CONTENT --- */}
            <div className="flex w-full items-center justify-end gap-4">
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
                        className={`${bellIconClicked ? "opacity-100" : "opacity-0"} absolute text-[var(--accent-color)] transition-opacity duration-[var(--fast)] group-hover:opacity-100`}
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
                      className={`${userIconClicked ? "opacity-100" : "opacity-0"} absolute text-[var(--accent-color)] transition-opacity duration-[var(--fast)] group-hover:opacity-100`}
                    />
                  </span>
                </button>

                <MenuDropdown
                  triggerRef={userIconRef}
                  isOpen={userIconClicked}
                  onClose={() => setUserIconClicked(false)}
                >
                  {isLoggedIn && (
                    <div className="relative">
                      <span className="font-semibold break-words text-[var(--accent-color)]">
                        {firstName && lastName
                          ? firstName + " " + lastName
                          : firstName || username}
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
                        currentTheme === "dark" ? SolidSunIcon : SolidMoonIcon
                      }
                    />
                    {isLoggedIn && (
                      <TopbarLink
                        onClick={() => {
                          closeAllMenus();
                          setIsSettingsModalOpen(true);
                        }}
                        label="Inställningar"
                        icon={OutlineCog6ToothIcon}
                        iconHover={SolidCog6ToothIcon}
                      />
                    )}
                  </div>

                  <div className="relative">
                    <hr className="absolute -mt-4 -ml-4 w-[calc(100%+2rem)] text-[var(--border-main)]" />
                    <span className="pb-1 text-sm font-semibold">Session</span>
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
