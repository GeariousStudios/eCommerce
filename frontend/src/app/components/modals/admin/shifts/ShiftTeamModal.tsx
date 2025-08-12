"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import Input from "../../../common/Input";
import { useToast } from "../../../toast/ToastProvider";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  switchClass,
  switchKnobClass,
} from "@/app/styles/buttonClasses";
import ModalBase, { ModalBaseHandle } from "../../ModalBase";
import { useTranslations } from "next-intl";
import { shiftTeamConstraints } from "@/app/helpers/inputConstraints";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  itemId?: number | null;
  onItemUpdated: () => void;
};

const ShiftTeamModal = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- Refs ---
  const formRef = useRef<HTMLFormElement>(null);
  const modalRef = useRef<ModalBaseHandle>(null);
  const getScrollEl = () => modalRef.current?.getScrollEl() ?? null;

  // --- States ---
  const [name, setName] = useState("");
  const [isHidden, setIsHidden] = useState(false);

  const [originalName, setOriginalName] = useState("");
  const [originalIsHidden, setOriginalIsHidden] = useState(false);
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
      fetchShiftTeam();
    } else {
      setName("");
      setOriginalName("");

      setIsHidden(false);
      setOriginalIsHidden(false);
    }
  }, [props.isOpen, props.itemId]);

  // --- BACKEND ---
  // --- Add shift team ---
  const addShiftTeam = async (event: FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/shift-team/create`, {
        method: "POST",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          isHidden,
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
      notify("success", t("Common/Shift team") + t("Modal/created"), 4000);
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Fetch shift team ---
  const fetchShiftTeam = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/shift-team/fetch/${props.itemId}`,
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
        fillShiftTeamData(result);
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  const fillShiftTeamData = (result: any) => {
    setName(result.name ?? "");
    setOriginalName(result.name ?? "");

    setIsHidden(result.isHidden ?? false);
    setOriginalIsHidden(result.isHidden ?? false);
  };

  // --- Update shift team ---
  const updateShiftTeam = async (event: FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch(
        `${apiUrl}/shift-team/update/${props.itemId}`,
        {
          method: "PUT",
          headers: {
            "X-User-Language": localStorage.getItem("language") || "sv",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            isHidden,
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
      notify("success", t("Common/Shift team") + t("Modal/updated"), 4000);
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  const handleSaveClick = () => {
    formRef.current?.requestSubmit();
  };

  // --- SET/UNSET IS DIRTY ---
  useEffect(() => {
    if (props.itemId === null || props.itemId === undefined) {
      const dirty = name !== "" || isHidden !== false;

      setIsDirty(dirty);
      return;
    }

    const dirty = name !== originalName || isHidden !== originalIsHidden;
    setIsDirty(dirty);
  }, [name, isHidden, originalName, originalIsHidden]);

  return (
    <>
      {props.isOpen && (
        <form
          ref={formRef}
          onSubmit={(e) =>
            props.itemId ? updateShiftTeam(e) : addShiftTeam(e)
          }
        >
          <ModalBase
            ref={modalRef}
            isOpen={props.isOpen}
            onClose={() => props.onClose()}
            icon={props.itemId ? PencilSquareIcon : PlusIcon}
            label={
              props.itemId
                ? t("Common/Edit") + " " + t("Common/shift team")
                : t("Common/Add") + " " + t("Common/shift team")
            }
            confirmOnClose
            isDirty={isDirty}
          >
            <ModalBase.Content>
              <div className="flex items-center gap-2">
                <hr className="w-12 text-[var(--border-tertiary)]" />
                <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                  {t("ShiftTeamModal/Info1")}
                </h3>
                <hr className="w-full text-[var(--border-tertiary)]" />
              </div>

              <div className="xs:gap-4 xs:grid-cols-1 mb-8 grid grid-cols-1 gap-6">
                <Input
                  label={t("Common/Name")}
                  value={name}
                  onChange={(val) => {
                    setName(String(val));
                  }}
                  onModal
                  required
                  {...shiftTeamConstraints.name}
                />
              </div>

              <div className="flex items-center gap-2">
                <hr className="w-12 text-[var(--border-tertiary)]" />
                <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                  {t("Common/Status")}
                </h3>
                <hr className="w-full text-[var(--border-tertiary)]" />
              </div>

              <div className="xs:gap-4 xs:grid-cols-2 mb-8 grid grid-cols-1 gap-6">
                <div className="flex items-center gap-2 truncate">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isHidden}
                    className={switchClass(isHidden)}
                    onClick={() => setIsHidden((prev) => !prev)}
                  >
                    <div className={switchKnobClass(isHidden)} />
                  </button>

                  <span className="mb-0.5">
                    {t("ShiftTeamModal/Hide shift team")}
                  </span>
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

export default ShiftTeamModal;
