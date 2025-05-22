"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { FocusTrap } from "focus-trap-react";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import Input from "../input/Input";
import { useToast } from "../toast/ToastProvider";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  switchClass,
  switchKnobClass,
} from "@/app/styles/buttonClasses";
import MultiDropdown from "../dropdowns/MultiDropdown";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userId?: number | null;
  onUserUpdated: () => void;
};

const UserModal = (props: Props) => {
  // --- VARIABLES ---
  // --- Refs ---
  const formRef = useRef<HTMLFormElement>(null);

  // --- States ---
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [newUserRoles, setNewUserRoles] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(false);

  // --- Other ---
  const token = localStorage.getItem("token");
  const { notify } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!props.isOpen) {
      return;
    }

    if (props.userId !== null && props.userId !== undefined) {
      fetchUser();
    } else {
      setUsername("");
      setFirstName("");
      setLastName("");
      setPassword("");
      setEmail("");
      setNewUserRoles([]);
      setIsLocked(false);
    }
  }, [props.isOpen, props.userId]);

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
      props.onUserUpdated();
      notify("success", "Användare skapad!", 4000);
    } catch (err) {
      notify("error", String(err));
    }
  };

  // --- Fetch user ---
  const fetchUser = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/user-management/fetch/${props.userId}`,
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
    setFirstName(result.firstName ?? "");
    setLastName(result.lastName ?? "");
    setPassword("");
    setEmail(result.email ?? "");
    setNewUserRoles(result.roles ?? []);
    setIsLocked(result.isLocked ?? false);
  };

  // --- Update user ---
  const updateUser = async (event: FormEvent, id: number) => {
    event.preventDefault();

    try {
      const response = await fetch(
        `${apiUrl}/user-management/update/${props.userId}`,
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
      props.onUserUpdated();
      notify("success", "Användare uppdaterad!", 4000);
    } catch (err) {
      notify("error", String(err));
    }
  };

  const handleSaveClick = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <>
      {props.isOpen && (
        <div className="fixed inset-0 z-[var(--z-overlay)] h-svh w-screen bg-black/50">
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              allowOutsideClick: true,
              escapeDeactivates: false,
            }}
          >
            <div className="relative top-1/2">
              <div id="portal-root" />
              <form
                ref={formRef}
                className="relative left-1/2 z-[var(--z-modal)] flex max-h-[90svh] w-[90vw] max-w-3xl -translate-1/2 flex-col gap-4 overflow-y-auto rounded border-1 border-[var(--border-main)] bg-[var(--bg-modal)] p-4"
                onSubmit={(e) =>
                  props.userId ? updateUser(e, props.userId) : addUser(e)
                }
              >
                <h2 className="mb-4 flex items-center text-2xl font-semibold">
                  <span className="mr-2 h-6 w-6 text-[var(--accent-color)]">
                    {props.userId ? <PencilSquareIcon /> : <PlusIcon />}
                  </span>
                  <span>
                    {props.userId
                      ? "Redigera användare"
                      : "Lägg till ny användare"}
                  </span>
                </h2>

                <div className="flex items-center gap-2">
                  <hr className="w-12 whitespace-nowrap text-[var(--border-main)]" />
                  <h3 className="flex text-sm text-[var(--text-secondary)]">
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
                  />

                  {props.userId !== null ? (
                    <Input
                      id="password"
                      label={"Lösenord"}
                      value={password}
                      placeholder="*********"
                      onChange={(val) => setPassword(String(val))}
                      onModal={true}
                    />
                  ) : (
                    <Input
                      id="password"
                      label={"Lösenord"}
                      value={password}
                      onChange={(val) => setPassword(String(val))}
                      onModal={true}
                      required
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

                <div className="flex justify-between gap-4">
                  <button
                    type="button"
                    onClick={props.onClose}
                    className={`${buttonSecondaryClass} grow`}
                  >
                    Ångra
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveClick}
                    className={`${buttonPrimaryClass} grow-2`}
                  >
                    {props.userId ? "Uppdatera" : "Lägg till"}
                  </button>
                </div>
              </form>
            </div>
          </FocusTrap>
        </div>
      )}
    </>
  );
};

export default UserModal;
