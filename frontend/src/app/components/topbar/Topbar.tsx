import {
  iconButtonPrimaryClass,
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
  Bars2Icon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { useToast } from "../toast/ToastProvider";
import useAuthStatus from "@/app/hooks/useAuthStatus";
import Message from "../common/Message";
import MenuDropdown from "../common/MenuDropdown/MenuDropdown";
import TopbarLink from "./TopbarLink";
import useTheme from "@/app/hooks/useTheme";
import SettingsModal from "../modals/SettingsModal";
import Link from "next/link";
import useLanguage from "@/app/hooks/useLanguage";
import { useTranslations } from "next-intl";

type Props = {
  hasScrollbar: boolean;
  navbarHidden: boolean;
  setNavbarHidden: (value: boolean) => void;
  breadcrumbs?: {
    label: string;
    href: string;
    clickable: boolean;
    isActive: boolean;
  }[];
  breadcrumbsLoading?: boolean;
};

const Topbar = (props: Props) => {
  const t = useTranslations();

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
  const prefix = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
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
  const { toggleLanguage, currentLanguage } = useLanguage();

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
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
    } finally {
      localStorage.removeItem("token");
      localStorage.setItem(
        "postLogoutToast",
        t("SettingsModal/Logout message"),
      );
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
        className={`${isVisible ? "translate-y-0" : "-translate-y-full"} fixed z-[calc(var(--z-overlay)-2)] flex h-18 w-full justify-between gap-4 border-b-1 border-[var(--border-main)] bg-[var(--bg-navbar)] px-4 py-2 transition-[max-width,translate] duration-[var(--medium)]`}
      >
        {!isAuthReady ? (
          <Message
            icon="loading"
            content="content"
            sideMessage
            fullscreen
            withinContainer={props.navbarHidden}
          />
        ) : (
          <>
            {/* --- WELCOME MESSAGE --- */}
            <div
              className={`${!props.navbarHidden ? (props.hasScrollbar ? "md:ml-67" : "md:ml-64") : ""} flex items-center gap-4`}
            >
              <button
                onClick={() => props.setNavbarHidden(false)}
                className={`${iconButtonPrimaryClass} ${props.navbarHidden ? "block" : "md:hidden"} h-6 min-h-6 w-6 min-w-6`}
                inert={!props.navbarHidden}
              >
                <Bars2Icon />
              </button>

              {props.breadcrumbsLoading ? (
                <span className="animate-shimmer h-6 w-64" />
              ) : props.breadcrumbs?.length ? (
                <div className="flex items-center">
                  {/* <div className="flex flex-wrap md:hidden">
                    {props.breadcrumbs.length > 1 && (
                      <>
                        <span className="xs:inline hidden md:hidden">
                          ...&nbsp;/&nbsp;
                        </span>
                        <span className="font-semibold break-all text-[var(--accent-color)]">
                          {props.breadcrumbs.at(-1)?.label}
                        </span>
                      </>
                    )}
                    {props.breadcrumbs.length === 1 && (
                      <span className="font-semibold text-[var(--accent-color)]">
                        {props.breadcrumbs[0].label}
                      </span>
                    )}
                  </div> 

                  <div className="hidden flex-wrap items-center md:flex"> */}
                  <div className="flex flex-wrap items-center">
                    {props.breadcrumbs.map((item, idx) => (
                      <span key={item.href}>
                        {item.clickable ? (
                          <Link href={item.href} className="">
                            {item.label}
                          </Link>
                        ) : (
                          <span
                            className={
                              item.isActive
                                ? "font-semibold text-[var(--accent-color)]"
                                : !item.clickable
                                  ? "opacity-50"
                                  : ""
                            }
                          >
                            {item.label}
                          </span>
                        )}
                        {idx !== (props.breadcrumbs?.length ?? 0) - 1 && (
                          <span>&nbsp;/&nbsp;</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ) : isLoggedIn ? (
                <div className="flex flex-wrap items-center">
                  {/* <div className="xs:flex hidden"> */}
                  <span className="">{t("SettingsModal/Welcome")}&nbsp;</span>
                  <div>
                    <span className="font-semibold text-[var(--accent-color)]">
                      {firstName ? firstName : username}
                    </span>
                    !
                  </div>
                  {/* </div> */}
                </div>
              ) : (
                <span></span>
              )}
            </div>

            {/* --- BUTTONS AND THEIR CONTENT --- */}
            <div className="flex items-center justify-end gap-4">
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
                    <span>{t("SettingsModal/No messages")}</span>
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
                    {isLoggedIn ? (
                      <>
                        <OutlineUserIcon
                          className={`${userIconClicked ? "opacity-0" : "opacity-100"} absolute transition-opacity duration-[var(--fast)] group-hover:opacity-0`}
                        />
                        <SolidUserIcon
                          className={`${userIconClicked ? "opacity-100" : "opacity-0"} absolute text-[var(--accent-color)] transition-opacity duration-[var(--fast)] group-hover:opacity-100`}
                        />
                      </>
                    ) : (
                      <>
                        <OutlineCog6ToothIcon
                          className={`${userIconClicked ? "opacity-0" : "opacity-100"} absolute transition-opacity duration-[var(--fast)] group-hover:opacity-0`}
                        />
                        <SolidCog6ToothIcon
                          className={`${userIconClicked ? "opacity-100" : "opacity-0"} absolute text-[var(--accent-color)] transition-opacity duration-[var(--fast)] group-hover:opacity-100`}
                        />
                      </>
                    )}
                  </span>
                </button>

                <MenuDropdown
                  triggerRef={userIconRef}
                  isOpen={userIconClicked}
                  onClose={() => setUserIconClicked(false)}
                >
                  <div className="relative">
                    <div className="flex justify-between gap-4">
                      {isLoggedIn ? (
                        <span className="font-semibold break-words text-[var(--accent-color)]">
                          {firstName && lastName
                            ? firstName + " " + lastName
                            : firstName || username}
                        </span>
                      ) : (
                        <span className="font-semibold break-words text-[var(--accent-color)]">
                          {t("SettingsModal/No one logged in")}
                        </span>
                      )}

                      <button
                        onClick={() => {
                          toggleLanguage();
                        }}
                        className={`${roundedButtonClass} relative flex !h-6 min-h-6 !w-6 min-w-6 overflow-hidden`}
                        aria-label={
                          currentLanguage === "sv"
                            ? t("SettingsModal/Switch to English")
                            : t("SettingsModal/Switch to Swedish")
                        }
                      >
                        <div className="absolute inset-0 origin-center">
                          <div
                            className={`absolute inset-0 ${
                              currentLanguage === "sv"
                                ? "bg-blue-500"
                                : "bg-white"
                            }`}
                          >
                            <div
                              className={`absolute top-0 bottom-0 left-[40%] w-[20%] ${
                                currentLanguage === "sv"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                            />
                            <div
                              className={`absolute top-[40%] right-0 left-0 h-[20%] ${
                                currentLanguage === "sv"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                            />
                          </div>
                        </div>
                      </button>
                    </div>
                    <hr className="absolute mt-4 -ml-4 flex w-[calc(100%+2rem)] text-[var(--border-tertiary)]" />
                  </div>

                  <div>
                    <span className="flex pb-1 text-xs font-semibold whitespace-nowrap uppercase">
                      {t("Common/Manage")}
                    </span>
                    <TopbarLink
                      onClick={toggleTheme}
                      label={
                        currentTheme === "dark"
                          ? t("SettingsModal/Light theme")
                          : t("SettingsModal/Dark theme")
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
                        label={t("Common/Settings")}
                        icon={OutlineCog6ToothIcon}
                        iconHover={SolidCog6ToothIcon}
                      />
                    )}
                  </div>

                  <div className="relative">
                    <hr className="absolute -mt-4 -ml-4 w-[calc(100%+2rem)] text-[var(--border-tertiary)]" />
                    <span className="flex pb-1 text-xs font-semibold whitespace-nowrap uppercase">
                      {t("SettingsModal/Session")}
                    </span>
                    {isLoggedIn ? (
                      <TopbarLink
                        onClick={handleLogout}
                        label={t("Common/Logout")}
                        icon={OutlineArrowLeftEndOnRectangleIcon}
                        iconHover={SolidArrowLeftEndOnRectangleIcon}
                      />
                    ) : (
                      <TopbarLink
                        href="/"
                        label={t("Common/Login")}
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
