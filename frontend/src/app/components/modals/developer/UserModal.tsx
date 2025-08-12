"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import Input from "../../common/Input";
import { useToast } from "../../toast/ToastProvider";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  switchClass,
  switchKnobClass,
} from "@/app/styles/buttonClasses";
import MultiDropdown from "../../common/MultiDropdown";
import ModalBase, { ModalBaseHandle } from "../ModalBase";
import { useTranslations } from "next-intl";
import { userConstraints } from "@/app/helpers/inputConstraints";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  itemId?: number | null;
  onItemUpdated: () => void;
};

const UserModal = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- Refs ---
  const formRef = useRef<HTMLFormElement>(null);
  const modalRef = useRef<ModalBaseHandle>(null);
  const getScrollEl = () => modalRef.current?.getScrollEl() ?? null;

  // --- States ---
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [newUserRoles, setNewUserRoles] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(false);

  const [originalUsername, setOriginalUsername] = useState("");
  const [originalFirstName, setOriginalFirstName] = useState("");
  const [originalLastName, setOriginalLastName] = useState("");
  const [originalPassword, setOriginalPassword] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [originalNewUserRoles, setOriginalNewUserRoles] = useState<string[]>(
    [],
  );
  const [originalIsLocked, setOriginalIsLocked] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // --- Other ---
  const token = localStorage.getItem("token");
  const { notify } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!props.isOpen) {
      return;
    }

    if (props.itemId !== null && props.itemId !== undefined) {
      fetchUser();
    } else {
      setUsername("");
      setOriginalUsername("");

      setFirstName("");
      setOriginalFirstName("");

      setLastName("");
      setOriginalLastName("");

      setPassword("");
      setOriginalPassword("");

      setEmail("");
      setOriginalEmail("");

      setNewUserRoles([]);
      setOriginalNewUserRoles([]);

      setIsLocked(false);
      setOriginalIsLocked(false);
    }
  }, [props.isOpen, props.itemId]);

  // --- BACKEND ---
  // --- Add user ---
  const addUser = async (event: FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/user-management/create`, {
        method: "POST",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          firstName,
          lastName,
          password,
          email: email.trim() === "" ? null : email,
          roles: newUserRoles,
          isLocked,
        }),
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

      props.onClose();
      props.onItemUpdated();
      notify("success", t("Common/User") + t("Modal/created"), 4000);
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Fetch user ---
  const fetchUser = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/user-management/fetch/${props.itemId}`,
        {
          headers: {
            "X-User-Language": localStorage.getItem("language") || "sv",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        notify("error", result?.message ?? t("Modal/Unknown error"));
      } else {
        fillUserData(result);
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  const fillUserData = (result: any) => {
    setUsername(result.username ?? "");
    setOriginalUsername(result.username ?? "");

    setFirstName(result.firstName ?? "");
    setOriginalFirstName(result.firstName ?? "");

    setLastName(result.lastName ?? "");
    setOriginalLastName(result.lastName ?? "");

    setPassword("");
    setOriginalPassword("");

    setEmail(result.email ?? "");
    setOriginalEmail(result.email ?? "");

    setNewUserRoles(result.roles ?? []);
    setOriginalNewUserRoles(result.roles ?? []);

    setIsLocked(result.isLocked ?? false);
    setOriginalIsLocked(result.isLocked ?? false);
  };

  // --- Update user ---
  const updateUser = async (event: FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch(
        `${apiUrl}/user-management/update/${props.itemId}`,
        {
          method: "PUT",
          headers: {
            "X-User-Language": localStorage.getItem("language") || "sv",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            username,
            firstName,
            lastName,
            password,
            email: email.trim() === "" ? null : email,
            roles: newUserRoles,
            isLocked,
          }),
        },
      );

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

      props.onClose();
      props.onItemUpdated();
      notify("success", t("Common/User") + t("Modal/updated"), 4000);
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  const handleSaveClick = () => {
    formRef.current?.requestSubmit();
  };

  // --- SET/UNSET IS DIRTY ---
  const areArraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) {
      return false;
    }

    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, index) => val === sortedB[index]);
  };

  useEffect(() => {
    if (props.itemId === null || props.itemId === undefined) {
      const dirty =
        username !== "" ||
        firstName !== "" ||
        lastName !== "" ||
        password !== "" ||
        email !== "" ||
        newUserRoles.length > 0 ||
        isLocked !== false;

      setIsDirty(dirty);
      return;
    }

    const dirty =
      username !== originalUsername ||
      firstName !== originalFirstName ||
      lastName !== originalLastName ||
      password !== originalPassword ||
      email !== originalEmail ||
      !areArraysEqual(newUserRoles, originalNewUserRoles) ||
      isLocked !== originalIsLocked;
    setIsDirty(dirty);
  }, [
    username,
    firstName,
    lastName,
    password,
    email,
    newUserRoles,
    isLocked,
    originalUsername,
    originalFirstName,
    originalLastName,
    originalPassword,
    originalEmail,
    originalNewUserRoles,
    originalIsLocked,
  ]);

  return (
    <>
      {props.isOpen && (
        <form
          ref={formRef}
          onSubmit={(e) => (props.itemId ? updateUser(e) : addUser(e))}
        >
          <ModalBase
            ref={modalRef}
            isOpen={props.isOpen}
            onClose={() => props.onClose()}
            icon={props.itemId ? PencilSquareIcon : PlusIcon}
            label={
              props.itemId
                ? t("Common/Edit") + " " + t("Common/user")
                : t("Common/Add") + " " + t("Common/user")
            }
            confirmOnClose
            isDirty={isDirty}
          >
            <ModalBase.Content>
              <div className="flex items-center gap-2">
                <hr className="w-12 text-[var(--border-tertiary)]" />
                <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                  {t("UserModal/Info1")}
                </h3>
                <hr className="w-full text-[var(--border-tertiary)]" />
              </div>

              <div className="xs:gap-4 xs:grid-cols-2 grid grid-cols-1 gap-6">
                <Input
                  id="username"
                  label={t("Common/Username")}
                  value={username}
                  onChange={(val) => setUsername(String(val))}
                  onModal
                  required
                  autoComplete="new-username"
                  {...userConstraints.username}
                />

                {props.itemId !== null ? (
                  <Input
                    type="password"
                    id="password"
                    label={t("Common/Password")}
                    value={password}
                    placeholder="•••••••••"
                    onChange={(val) => setPassword(String(val))}
                    onModal
                    {...userConstraints.password}
                  />
                ) : (
                  <Input
                    type="password"
                    id="password"
                    label={t("Common/Password")}
                    value={password}
                    onChange={(val) => setPassword(String(val))}
                    onModal
                    required
                    autoComplete="new-password"
                    {...userConstraints.password}
                  />
                )}
              </div>

              <div className="mt-8 flex items-center gap-2">
                <hr className="w-12 text-[var(--border-tertiary)]" />
                <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                  {t("UserModal/Info2")}
                </h3>
                <hr className="w-full text-[var(--border-tertiary)]" />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4">
                <Input
                  id="email"
                  label={t("Users/Email")}
                  value={email}
                  onChange={(val) => setEmail(String(val))}
                  onModal
                  {...userConstraints.email}
                />

                <div className="xs:gap-4 xs:grid-cols-2 grid grid-cols-1 gap-6">
                  <Input
                    id="firstName"
                    label={t("Users/First name")}
                    value={firstName}
                    onChange={(val) => setFirstName(String(val))}
                    onModal
                    {...userConstraints.firstName}
                  />

                  <Input
                    id="lastName"
                    label={t("Users/Last name")}
                    value={lastName}
                    onChange={(val) => setLastName(String(val))}
                    onModal
                    {...userConstraints.lastName}
                  />
                </div>
              </div>

              <div className="mt-8 flex items-center gap-2">
                <hr className="w-12 text-[var(--border-tertiary)]" />
                <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                  {t("UserModal/Info3")}
                </h3>
                <hr className="w-full text-[var(--border-tertiary)]" />
              </div>

              <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-4">
                <MultiDropdown
                  addSpacer
                  scrollContainer={getScrollEl}
                  customSpace={6.5} // <-- 9 = 4 options, 11 = 5 options.
                  label={t("Users/Permissions")}
                  options={[
                    { label: "Admin", value: "Admin" },
                    { label: "Developer", value: "Developer" },
                    { label: "Reporter", value: "Reporter" },
                  ]}
                  value={newUserRoles}
                  onChange={setNewUserRoles}
                  onModal
                  required
                />

                <div className="hidden sm:col-span-1 sm:flex" />

                <div className="flex items-center gap-2 truncate sm:justify-end">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isLocked}
                    className={`${switchClass(isLocked)} `}
                    onClick={() => setIsLocked((prev) => !prev)}
                  >
                    <div className={switchKnobClass(isLocked)} />
                  </button>
                  {t("UserModal/Lock user")}
                </div>
              </div>
            </ModalBase.Content>

            <ModalBase.Footer>
              <button
                type="button"
                onClick={handleSaveClick}
                className={`${buttonPrimaryClass} xs:col-span-2 col-span-3`}
              >
                {props.itemId ? t("Modal/Save") : t("Common/Add")}
              </button>
              <button
                type="button"
                onClick={() => modalRef.current?.requestClose()}
                className={`${buttonSecondaryClass} xs:col-span-1 col-span-3`}
              >
                {t("Modal/Abort")}
              </button>
            </ModalBase.Footer>
          </ModalBase>
        </form>
      )}
    </>
  );
};

export default UserModal;
