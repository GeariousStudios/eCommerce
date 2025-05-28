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
import SingleDropdown from "../dropdowns/SingleDropdown";
import { useToast } from "../toast/ToastProvider";
import useAuthStatus from "@/app/hooks/useAuthStatus";
import {
  buttonSecondaryClass,
  iconButtonPrimaryClass,
} from "@/app/styles/buttonClasses";
import Input from "../input/Input";
import CustomTooltip from "../customTooltip/CustomTooltip";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const SettingsModal = (props: Props) => {
  // --- VARIABLES ---
  // --- Refs ---
  const themeRef = useRef<HTMLButtonElement>(null);

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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");
  const { notify } = useToast();
  const { username, firstName, lastName, isLoggedIn, userId } = useAuthStatus();

  /* --- BACKEND --- */
  // --- Handle logout ---
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
      }

      if (Object.keys(updatedFields).length === 0) {
        notify("info", "Inga ändringar att spara!");
        setEditingField(null);
        return;
      }

      const response = await fetch(`${apiUrl}/user/update-profile`, {
        method: "PUT",
        headers: {
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

        notify("error", "Ett okänt fel inträffade");
        return;
      }

      notify("success", "Profil uppdaterad!", 4000);
      setEditingField(null);
    } catch (err) {
      notify("error", String(err));
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
  const hrClass = "mt-4 mb-4 rounded-full text-[var(--border-main)]";
  const itemRowClass = "flex-wrap flex items-center justify-between gap-2";

  return (
    <ModalBase
      isOpen={props.isOpen}
      onClose={props.onClose}
      label="Inställningar"
      icon={SolidCog6ToothIcon}
      smallGap
    >
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
              label="Allmänt"
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
              label="Profil"
              icon={OutlineUserCircleIcon}
              iconHover={SolidUserCircleIcon}
              isActive={isProfileOpen}
            />
          </li>

          {/* --- Notifications --- */}
          <CustomTooltip content="Ej implementerat!">
            <li>
              <ModalLink
                disabled
                // onClick={() => {
                //   disableAll();
                //   setIsNotificationsOpen(true);
                // }}
                label="Aviseringar"
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
                        { label: "Mörkt", value: "dark" },
                        { label: "Ljust", value: "light" },
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
                  <span>Logga ut befintlig användare</span>
                  <span>
                    <button
                      onClick={() => {
                        handleLogout();
                        props.onClose();
                      }}
                      className={`${buttonSecondaryClass} w-full rounded-full px-4`}
                    >
                      Logga ut
                    </button>
                  </span>
                </div>
              </div>
            ) : // --- Profile ---
            isProfileOpen ? (
              <div className="w-full">
                <div id="portal-root" />
                <div className={`${itemRowClass}`}>
                  <span>Användarnamn</span>
                  <div className="flex items-center gap-4">
                    <span className="w-48">{username}</span>
                    <CustomTooltip content="Ej redigerbar!">
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
                  <span>Lösenord</span>

                  {editingField === "password" ? (
                    <div className="flex items-center gap-4">
                      <Input
                        placeholder="•••••••••"
                        value={inputValue}
                        onChange={(val) => setInputValue(val as string)}
                        type="password"
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
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
      </div>
    </ModalBase>
  );
};

export default SettingsModal;
