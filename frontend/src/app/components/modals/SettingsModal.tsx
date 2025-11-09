import ModalBase from "./ModalBase";
import ModalLink from "../modals/ModalLink";
import {
  PencilIcon,
  BellIcon as OutlineBellIcon,
  Cog6ToothIcon as OutlineCog6ToothIcon,
  UserCircleIcon as OutlineUserCircleIcon,
} from "@heroicons/react/24/outline";
import {
  Cog6ToothIcon as SolidCog6ToothIcon,
  BellIcon as SolidBellIcon,
  UserCircleIcon as SolidUserCircleIcon,
} from "@heroicons/react/24/solid";
import { CheckIcon } from "@heroicons/react/16/solid";
import { useEffect, useRef, useState } from "react";
import useTheme from "@/app/hooks/useTheme";
import SingleDropdown from "../common/SingleDropdown";
import { useToast } from "../toast/ToastProvider";
import { useAuth } from "@/app/context/AuthContext";
import {
  buttonSecondaryClass,
  iconButtonPrimaryClass,
  roundedButtonClass,
} from "@/app/styles/buttonClasses";
import Input from "../common/Input";
import CustomTooltip from "../common/CustomTooltip";
import useLanguage from "@/app/hooks/useLanguage";
import { useTranslations } from "next-intl";
import { userConstraints } from "@/app/helpers/inputConstraints";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
};

const SettingsModal = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- States ---
  const [isGeneralOpen, setIsGeneralOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [inputValue, setInputValue] = useState("");
  const [editingField, setEditingField] = useState<
    "password" | "firstName" | "lastName" | "email" | null
  >(null);

  // --- Other ---
  const { toggleTheme, currentTheme } = useTheme();
  const { toggleLanguage, currentLanguage } = useLanguage();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");
  const { notify } = useToast();
  const {
    username,
    firstName,
    lastName,
    email,
    isLoggedIn,
    userId,
    fetchAuthData,
  } = useAuth();

  /* --- BACKEND --- */
  // --- Handle logout ---
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

  // --- Update user ---
  const updateProfile = async () => {
    try {
      const updatedFields: Record<string, any> = {};

      if (editingField === "password" && inputValue.trim() !== "") {
        updatedFields.password = inputValue;
      } else if (
        editingField === "firstName" &&
        inputValue.trim() !== "" &&
        inputValue !== firstName
      ) {
        updatedFields.firstName = inputValue;
      } else if (
        editingField === "lastName" &&
        inputValue.trim() !== "" &&
        inputValue !== lastName
      ) {
        updatedFields.lastName = inputValue;
      } else if (
        editingField === "email" &&
        inputValue.trim() !== "" &&
        inputValue !== email
      ) {
        updatedFields.email = inputValue;
      }

      if (Object.keys(updatedFields).length === 0) {
        notify("info", t("Modal/Nothing"));
        setEditingField(null);
        return;
      }

      const response = await fetch(`${apiUrl}/user/update-profile`, {
        method: "PUT",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedFields),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          let firstError: string | null = null;
          let lowestOrder = Number.MAX_SAFE_INTEGER;

          for (const field in result.errors) {
            const fieldErrors = result.errors[field];

            for (const msg of fieldErrors) {
              const match = msg.match(/\[(\d+)\]/);
              const order = match ? parseInt(match[1], 10) : 99;

              if (order < lowestOrder) {
                lowestOrder = order;
                firstError = msg.replace(/\[\d+\]\s*/, "");
              }
            }
          }
          if (firstError) {
            notify("error", firstError);
          }
          return;
        }

        if (result.message) {
          notify("error", result.message);
          return;
        }

        notify("error", t("Modal/Unknown error"));
        return;
      }

      notify("success", t("SettingsModal/Profile") + t("Modal/updated"), 4000);
      setEditingField(null);

      if (props.onProfileUpdated) {
        props.onProfileUpdated();
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
      setEditingField(null);
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

  // --- DISABLE ALL ABOVE STATES ---
  const disableAll = () => {
    setIsGeneralOpen(false);
    setIsProfileOpen(false);
    setIsNotificationsOpen(false);

    setEditingField(null);
  };

  // --- ENABLE ISGENERALOPEN UPON ISOPEN ---
  useEffect(() => {
    disableAll();
    setIsGeneralOpen(true);
  }, [props.isOpen]);

  // --- CLASSES ---
  const hrClass = "mt-4 mb-4 rounded-full text-[var(--border-tertiary)]";
  const itemRowClass = "flex-wrap flex items-center justify-between gap-2";

  return (
    <ModalBase
      isOpen={props.isOpen}
      onClose={props.onClose}
      label={t("Common/Settings")}
      icon={SolidCog6ToothIcon}
      smallGap
    >
      <ModalBase.Content>
        <div className="flex h-128 flex-col gap-4 sm:flex-row">
          {/* --- BUTTONS --- */}
          <ul className="flex flex-wrap gap-2 rounded-lg bg-[var(--bg-navbar)] p-2 sm:flex-1 sm:flex-col sm:gap-0 sm:bg-transparent sm:p-0">
            {/* --- General --- */}
            <li>
              <ModalLink
                onClick={() => {
                  disableAll();
                  setIsGeneralOpen(true);
                }}
                label={t("SettingsModal/General")}
                icon={OutlineCog6ToothIcon}
                iconHover={SolidCog6ToothIcon}
                isActive={isGeneralOpen}
              />
            </li>

            {/* --- Profile --- */}
            <li>
              <ModalLink
                onClick={() => {
                  disableAll();
                  setIsProfileOpen(true);
                }}
                label={t("SettingsModal/Profile")}
                icon={OutlineUserCircleIcon}
                iconHover={SolidUserCircleIcon}
                isActive={isProfileOpen}
              />
            </li>

            {/* --- Notifications --- */}
            <CustomTooltip content={t("Common/Not implemented")} showOnTouch>
              <li>
                <ModalLink
                  disabled
                  // onClick={() => {
                  //   disableAll();
                  //   setIsNotificationsOpen(true);
                  // }}
                  label={t("SettingsModal/Notifications")}
                  icon={OutlineBellIcon}
                  iconHover={SolidBellIcon}
                  isActive={isNotificationsOpen}
                />
              </li>
            </CustomTooltip>
          </ul>

          {/* --- CONTENT --- */}
          <div className="flex flex-2">
            {/* --- Descriptions --- */}
            <div className="flex flex-grow">
              {/* --- General --- */}
              {isGeneralOpen ? (
                <div className="w-full">
                  <div id="portal-root" />
                  <div className={`${itemRowClass}`}>
                    <span>Tema</span>
                    <span className="w-24">
                      <SingleDropdown
                        options={[
                          { label: t("Common/Dark"), value: "dark" },
                          { label: t("Common/Light"), value: "light" },
                        ]}
                        value={currentTheme ?? ""}
                        onChange={(val) => {
                          if (
                            (val === "dark" && currentTheme !== "dark") ||
                            (val === "light" && currentTheme !== "light")
                          ) {
                            toggleTheme();
                          }
                        }}
                        onModal
                      />
                    </span>
                  </div>

                  <hr className={`${hrClass}`} />

                  <div className={`${itemRowClass}`}>
                    <span>{t("SettingsModal/Language")}</span>
                    <span>
                      <button
                        onClick={() => {
                          toggleLanguage();
                        }}
                        className={`${roundedButtonClass} relative flex !h-10 min-h-10 !w-10 min-w-10 overflow-hidden`}
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
                    </span>
                  </div>

                  <hr className={`${hrClass}`} />

                  <div className={`${itemRowClass}`}>
                    <span> {t("SettingsModal/Logout user")}</span>
                    <span>
                      <button
                        onClick={() => {
                          handleLogout();
                          props.onClose();
                        }}
                        className={`${buttonSecondaryClass} w-full rounded-full px-4`}
                      >
                        {t("Common/Logout")}
                      </button>
                    </span>
                  </div>
                </div>
              ) : // --- Profile ---
              isProfileOpen ? (
                <div className="w-full">
                  <div id="portal-root" />
                  <div className={`${itemRowClass}`}>
                    <span>{t("Common/Username")}</span>
                    <div className="flex items-center gap-4">
                      <CustomTooltip side="left" content={username} showOnTouch>
                        <span className="w-48 truncate overflow-x-hidden">
                          {username}
                        </span>
                      </CustomTooltip>
                      <CustomTooltip
                        content={t("SettingsModal/Uneditable")}
                        showOnTouch
                      >
                        <button
                          className={`${iconButtonPrimaryClass} !h-6 !w-6`}
                          disabled
                        >
                          <PencilIcon />
                        </button>
                      </CustomTooltip>
                    </div>
                  </div>

                  <hr className={`${hrClass}`} />

                  <div className={`${itemRowClass}`}>
                    <span>{t("Common/Password")}</span>

                    {username === "master" ? (
                      <div className="flex items-center gap-4">
                        <span className="w-48">•••••••••</span>
                        <CustomTooltip
                          content="Kan inte redigera lösenord för master-konto!"
                          showOnTouch
                        >
                          <button
                            className={`${iconButtonPrimaryClass} !h-6 !w-6`}
                            disabled
                          >
                            <PencilIcon />
                          </button>
                        </CustomTooltip>
                      </div>
                    ) : editingField === "password" ? (
                      <div className="flex items-center gap-4">
                        <Input
                          placeholder="•••••••••"
                          value={inputValue}
                          onChange={(val) => {
                            setInputValue(val as string);
                          }}
                          type="password"
                          autoComplete="new-password"
                          {...userConstraints.password}
                        />
                        <button
                          onClick={() => updateProfile()}
                          className={`${iconButtonPrimaryClass}`}
                        >
                          <CheckIcon />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <span className="w-48">•••••••••</span>
                        <button
                          onClick={() => {
                            setEditingField("password");
                            setInputValue("");
                          }}
                          className={`${iconButtonPrimaryClass} !h-6 !w-6`}
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    )}
                  </div>

                  <hr className={`${hrClass}`} />

                  <div className={`${itemRowClass}`}>
                    <span>{t("Users/First name")}</span>

                    {editingField === "firstName" ? (
                      <div className="flex items-center gap-4">
                        <Input
                          placeholder={firstName}
                          value={inputValue}
                          onChange={(val) => {
                            setInputValue(val as string);
                          }}
                          {...userConstraints.firstName}
                        />
                        <button
                          onClick={() => {
                            updateProfile();
                            fetchAuthData();
                          }}
                          className={`${iconButtonPrimaryClass}`}
                        >
                          <CheckIcon />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <CustomTooltip
                          side="left"
                          content={firstName}
                          showOnTouch
                        >
                          <span className="w-48 truncate overflow-x-hidden">
                            {firstName}
                          </span>
                        </CustomTooltip>
                        <button
                          onClick={() => {
                            setEditingField("firstName");
                            setInputValue("");
                          }}
                          className={`${iconButtonPrimaryClass} !h-6 !w-6`}
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    )}
                  </div>

                  <hr className={`${hrClass}`} />

                  <div className={`${itemRowClass}`}>
                    <span>{t("Users/Last name")}</span>

                    {editingField === "lastName" ? (
                      <div className="flex items-center gap-4">
                        <Input
                          placeholder={lastName}
                          value={inputValue}
                          onChange={(val) => {
                            setInputValue(val as string);
                          }}
                          {...userConstraints.lastName}
                        />
                        <button
                          onClick={() => {
                            updateProfile();
                            fetchAuthData();
                          }}
                          className={`${iconButtonPrimaryClass}`}
                        >
                          <CheckIcon />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <CustomTooltip
                          side="left"
                          content={lastName}
                          showOnTouch
                        >
                          <span className="w-48 truncate overflow-x-hidden">
                            {lastName}
                          </span>
                        </CustomTooltip>
                        <button
                          onClick={() => {
                            setEditingField("lastName");
                            setInputValue("");
                          }}
                          className={`${iconButtonPrimaryClass} !h-6 !w-6`}
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    )}
                  </div>

                  <hr className={`${hrClass}`} />

                  <div className={`${itemRowClass}`}>
                    <span>{t("Users/Email")}</span>

                    {editingField === "email" ? (
                      <div className="flex items-center gap-4">
                        <Input
                          placeholder={email}
                          value={inputValue}
                          onChange={(val) => {
                            setInputValue(val as string);
                          }}
                          type="email"
                          id="email"
                          {...userConstraints.email}
                        />
                        <button
                          onClick={() => {
                            updateProfile();
                            fetchAuthData();
                          }}
                          className={`${iconButtonPrimaryClass}`}
                        >
                          <CheckIcon />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <CustomTooltip side="left" content={email} showOnTouch>
                          <span className="w-48 truncate overflow-x-hidden">
                            {email}
                          </span>
                        </CustomTooltip>
                        <button
                          onClick={() => {
                            setEditingField("email");
                            setInputValue("");
                          }}
                          className={`${iconButtonPrimaryClass} !h-6 !w-6`}
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                ""
              )}
            </div>
          </div>
        </div>
      </ModalBase.Content>
    </ModalBase>
  );
};

export default SettingsModal;
