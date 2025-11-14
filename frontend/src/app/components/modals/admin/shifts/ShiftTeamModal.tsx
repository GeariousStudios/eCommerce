"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import * as Outline from "@heroicons/react/24/outline";
import * as Solid from "@heroicons/react/24/solid";
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
import LoadingSpinner from "@/app/components/common/LoadingSpinner";
import CustomTooltip from "@/app/components/common/CustomTooltip";
import HoverIcon from "@/app/components/common/HoverIcon";

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
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [isHidden, setIsHidden] = useState(false);
  const [lightColorHex, setLightColorHex] = useState("#212121");
  const [darkColorHex, setDarkColorHex] = useState("#e0e0e0");
  const [reverseColor, setReverseColor] = useState(false);

  const [originalName, setOriginalName] = useState("");
  const [originalIsHidden, setOriginalIsHidden] = useState(false);
  const [originalLightColorHex, setOriginalLightColorHex] = useState("#212121");
  const [originalDarkColorHex, setOriginalDarkColorHex] = useState("#e0e0e0");
  const [originalReverseColor, setOriginalReverseColor] = useState(false);
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

      setLightColorHex("#212121");
      setOriginalLightColorHex("#212121");

      setDarkColorHex("#e0e0e0");
      setOriginalDarkColorHex("#e0e0e0");

      setReverseColor(false);
      setOriginalReverseColor(false);
    }
  }, [props.isOpen, props.itemId]);

  // --- BACKEND ---
  // --- Create shift team ---
  const createShiftTeam = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

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
          lightColorHex,
          darkColorHex,
          reverseColor,
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
      notify("success", t("Common/Shift team") + t("Modal/created2"), 4000);
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    } finally {
      setIsSaving(false);
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

    setLightColorHex(result.lightColorHex ?? "#212121");
    setOriginalLightColorHex(result.lightColorHex ?? "#212121");

    setDarkColorHex(result.darkColorHex ?? "#e0e0e0");
    setOriginalDarkColorHex(result.darkColorHex ?? "#e0e0e0");

    setReverseColor(result.reverseColor ?? false);
    setOriginalReverseColor(result.reverseColor ?? false);
  };

  // --- Update shift team ---
  const updateShiftTeam = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

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
            lightColorHex,
            darkColorHex,
            reverseColor,
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
      notify("success", t("Common/Shift team") + t("Modal/updated2"), 4000);
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClick = () => {
    formRef.current?.requestSubmit();
  };

  // --- SET/UNSET IS DIRTY ---
  useEffect(() => {
    if (props.itemId === null || props.itemId === undefined) {
      const dirty =
        name !== "" ||
        isHidden !== false ||
        lightColorHex !== "" ||
        darkColorHex !== "" ||
        reverseColor !== false;

      setIsDirty(dirty);
      return;
    }

    const dirty =
      name !== originalName ||
      isHidden !== originalIsHidden ||
      lightColorHex !== originalLightColorHex ||
      darkColorHex !== originalDarkColorHex ||
      reverseColor !== originalReverseColor;
    setIsDirty(dirty);
  }, [
    name,
    isHidden,
    lightColorHex,
    darkColorHex,
    reverseColor,
    originalName,
    originalIsHidden,
    originalLightColorHex,
    originalDarkColorHex,
    originalReverseColor,
  ]);

  return (
    <>
      {props.isOpen && (
        <form
          ref={formRef}
          onSubmit={(e) =>
            props.itemId ? updateShiftTeam(e) : createShiftTeam(e)
          }
        >
          <ModalBase
            ref={modalRef}
            isOpen={props.isOpen}
            onClose={() => props.onClose()}
            icon={props.itemId ? Outline.PencilSquareIcon : Outline.PlusIcon}
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
                <hr className="w-12 text-(--border-tertiary)" />
                <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                  {t("ShiftTeamModal/Info1")}
                </h3>
                <hr className="w-full text-(--border-tertiary)" />
              </div>

              <div className="xs:grid-cols-2 mb-8 grid grid-cols-1 gap-6">
                <div className="xs:col-span-2">
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

                <Input
                  label={t("Common/Light color")}
                  type="color"
                  value={lightColorHex}
                  onChange={(val) => setLightColorHex(String(val))}
                  pattern="^#([0-9A-Fa-f]{6})$"
                  onModal
                />

                <Input
                  label={t("Common/Dark color")}
                  type="color"
                  value={darkColorHex}
                  onChange={(val) => setDarkColorHex(String(val))}
                  pattern="^#([0-9A-Fa-f]{6})$"
                  onModal
                />

                <div className="flex items-center gap-2 truncate">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={reverseColor}
                    className={switchClass(reverseColor)}
                    onClick={() => setReverseColor((prev) => !prev)}
                  >
                    <div className={switchKnobClass(reverseColor)} />
                  </button>
                  {t("Modal/Reverse color")}
                  <CustomTooltip
                    content={t("Modal/Tooltip reverse color")}
                    showOnTouch
                  >
                    <span className="group min-h-4 min-w-4 cursor-help">
                      <HoverIcon
                        outline={Outline.InformationCircleIcon}
                        solid={Solid.InformationCircleIcon}
                        className="flex"
                      />
                    </span>
                  </CustomTooltip>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <hr className="w-12 text-(--border-tertiary)" />
                <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                  {t("Common/Status")}
                </h3>
                <hr className="w-full text-(--border-tertiary)" />
              </div>

              <div className="xs:grid-cols-2 mb-8 grid grid-cols-1 gap-6">
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
                disabled={isSaving}
              >
                {isSaving ? (
                  props.itemId ? (
                    <div className="flex items-center justify-center gap-2">
                      <LoadingSpinner /> {t("Modal/Saving")}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <LoadingSpinner /> {t("Common/Adding")}
                    </div>
                  )
                ) : props.itemId ? (
                  t("Modal/Save")
                ) : (
                  t("Common/Add")
                )}
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
