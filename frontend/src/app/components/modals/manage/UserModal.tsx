"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import Input from "../../input/Input";
import { useToast } from "../../toast/ToastProvider";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  switchClass,
  switchKnobClass,
} from "@/app/styles/buttonClasses";
import MultiDropdown from "../../dropdowns/MultiDropdown";
import ModalBase, { ModalBaseHandle } from "../ModalBase";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  itemId?: number | null;
  onItemUpdated: () => void;
};

const UserModal = (props: Props) => {
  // --- VARIABLES ---
  // --- Refs ---
  const formRef = useRef<HTMLFormElement>(null);
  const modalRef = useRef<ModalBaseHandle>(null);

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

        notify("error", "Ett okänt fel inträffade");
        return;
      }

      props.onClose();
      props.onItemUpdated();
      notify("success", "Användare skapad!", 4000);
    } catch (err) {
      notify("error", String(err));
    }
  };

  // --- Fetch user ---
  const fetchUser = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/user-management/fetch/${props.itemId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        notify("error", result.message);
      } else {
        fillUserData(result);
      }
    } catch (err) {
      notify("error", String(err));
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

        notify("error", "Ett okänt fel inträffade");
        return;
      }

      props.onClose();
      props.onItemUpdated();
      notify("success", "Användare uppdaterad!", 4000);
    } catch (err) {
      notify("error", String(err));
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
        <ModalBase
          ref={modalRef}
          isOpen={props.isOpen}
          onClose={() => props.onClose()}
          icon={props.itemId ? PencilSquareIcon : PlusIcon}
          label={props.itemId ? "Redigera användare" : "Lägg till ny användare"}
          confirmOnClose
          isDirty={isDirty}
        >
          <form
            ref={formRef}
            className="relative flex flex-col gap-4"
            onSubmit={(e) => (props.itemId ? updateUser(e) : addUser(e))}
          >
            <div className="flex items-center gap-2">
              <hr className="w-12 text-[var(--border-main)]" />
              <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                Inloggningsuppgifter
              </h3>
              <hr className="w-full text-[var(--border-main)]" />
            </div>

            <div className="flex flex-col gap-6 sm:flex-row sm:gap-4">
              <Input
                id="username"
                label={"Användarnamn"}
                value={username}
                onChange={(val) => setUsername(String(val))}
                onModal={true}
                required
                autoComplete="new-username"
              />

              {props.itemId !== null ? (
                <Input
                  type="password"
                  id="password"
                  label={"Lösenord"}
                  value={password}
                  placeholder="•••••••••"
                  onChange={(val) => setPassword(String(val))}
                  onModal={true}
                />
              ) : (
                <Input
                  type="password"
                  id="password"
                  label={"Lösenord"}
                  value={password}
                  onChange={(val) => setPassword(String(val))}
                  onModal={true}
                  required
                  autoComplete="new-password"
                />
              )}
            </div>

            <div className="mt-8 flex items-center gap-2">
              <hr className="w-12 text-[var(--border-main)]" />
              <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                Användardetaljer
              </h3>
              <hr className="w-full text-[var(--border-main)]" />
            </div>

            <div className="flex flex-col gap-6 sm:flex-row sm:gap-4">
              <Input
                id="email"
                label={"Mejladress"}
                value={email}
                onChange={(val) => setEmail(String(val))}
                onModal={true}
              />

              <div className="flex w-full gap-6 sm:gap-4">
                <Input
                  id="firstName"
                  label={"Förnamn"}
                  value={firstName}
                  onChange={(val) => setFirstName(String(val))}
                  onModal={true}
                />

                <Input
                  id="lastName"
                  label={"Efternamn"}
                  value={lastName}
                  onChange={(val) => setLastName(String(val))}
                  onModal={true}
                />
              </div>
            </div>

            <div className="mt-8 flex items-center gap-2">
              <hr className="w-12 text-[var(--border-main)]" />
              <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                Behörigheter och status
              </h3>
              <hr className="w-full text-[var(--border-main)]" />
            </div>

            <div className="mb-8 flex justify-between gap-4">
              <div className="flex w-[calc(50%-0.375rem)] min-w-36">
                <MultiDropdown
                  label="Behörigheter"
                  options={[
                    { label: "Admin", value: "Admin" },
                    { label: "Developer", value: "Developer" },
                  ]}
                  value={newUserRoles}
                  onChange={setNewUserRoles}
                  onModal={true}
                  required
                />
              </div>

              <div className="flex items-center gap-2 truncate">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isLocked}
                  className={switchClass(isLocked)}
                  onClick={() => setIsLocked((prev) => !prev)}
                >
                  <div className={switchKnobClass(isLocked)} />
                </button>
                <span className="mb-0.5">Lås konto</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={handleSaveClick}
                className={`${buttonPrimaryClass} w-full grow-2 sm:w-auto`}
              >
                {props.itemId ? "Uppdatera" : "Lägg till"}
              </button>
              <button
                type="button"
                onClick={() => modalRef.current?.requestClose()}
                className={`${buttonSecondaryClass} w-full grow sm:w-auto`}
              >
                Ångra
              </button>
            </div>
          </form>
        </ModalBase>
      )}
    </>
  );
};

export default UserModal;
