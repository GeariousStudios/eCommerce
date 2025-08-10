"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import Input from "../../../common/Input";
import { useToast } from "../../../toast/ToastProvider";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  roundedButtonClass,
  switchClass,
  switchKnobClass,
} from "@/app/styles/buttonClasses";
import ModalBase, { ModalBaseHandle } from "../../ModalBase";
import { useTranslations } from "next-intl";
import { shiftConstraints } from "@/app/helpers/inputConstraints";
import { XMarkIcon } from "@heroicons/react/20/solid";
import MultiDropdown from "@/app/components/common/MultiDropdown";
import DragDrop from "@/app/components/common/DragDrop";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  itemId?: number | null;
  onItemUpdated: () => void;
};

type ShiftTeamOptions = {
  id: number;
  name: string;
  displayName: string;
  startTime: string;
  endTime: string;
};

const ShiftModal = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- Refs ---
  const formRef = useRef<HTMLFormElement>(null);
  const modalRef = useRef<ModalBaseHandle>(null);

  // --- States ---
  const [name, setName] = useState("");
  const [isHidden, setIsHidden] = useState(false);
  const [shiftTeamIds, setShiftTeamIds] = useState<number[]>([]);
  const [shiftTeams, setShiftTeams] = useState<ShiftTeamOptions[]>([]);

  const [originalName, setOriginalName] = useState("");
  const [originalIsHidden, setOriginalIsHidden] = useState(false);
  const [originalShiftTeamIds, setOriginalShiftTeamIds] = useState<number[]>(
    [],
  );
  const [isDirty, setIsDirty] = useState(false);

  const [isAnyDragging, setIsAnyDragging] = useState(false);

  // --- Other ---
  const token = localStorage.getItem("token");
  const { notify } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!props.isOpen) {
      return;
    }

    fetchShiftTeams();

    if (props.itemId !== null && props.itemId !== undefined) {
      fetchShift();
    } else {
      setName("");
      setOriginalName("");

      setIsHidden(false);
      setOriginalIsHidden(false);

      setShiftTeamIds([]);
      setOriginalShiftTeamIds([]);
    }
  }, [props.isOpen, props.itemId]);

  // --- BACKEND ---
  // --- Add shift ---
  const addShift = async (event: FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/shift/create`, {
        method: "POST",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          isHidden,
          shiftTeamIds,
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
      notify("success", t("Common/Shift") + t("Modal/created"), 4000);
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Fetch shift teams ---
  const fetchShiftTeams = async () => {
    try {
      const response = await fetch(`${apiUrl}/shift-team`, {
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        notify("error", result?.message ?? t("Modal/Unknown error"));
      } else {
        setShiftTeams(result.items);
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Fetch shift ---
  const fetchShift = async () => {
    try {
      const response = await fetch(`${apiUrl}/shift/fetch/${props.itemId}`, {
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        notify("error", result?.message ?? t("Modal/Unknown error"));
      } else {
        fillShiftData(result);
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  const fillShiftData = (result: any) => {
    setName(result.name ?? "");
    setOriginalName(result.name ?? "");

    setIsHidden(result.isHidden ?? false);
    setOriginalIsHidden(result.isHidden ?? false);

    setShiftTeamIds(result.shiftTeamIds ?? []);
    setOriginalShiftTeamIds(result.shiftTeamIds ?? []);
  };

  // --- Update shift ---
  const updateShift = async (event: FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/shift/update/${props.itemId}`, {
        method: "PUT",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          isHidden,
          shiftTeamIds,
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
      notify("success", t("Common/Shift") + t("Modal/updated"), 4000);
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  const handleSaveClick = () => {
    formRef.current?.requestSubmit();
  };

  // --- COMPONENTS ---
  // --- DragChip ---
  const DragChip = ({
    label,
    onDelete,
    isDragging = false,
    dragging = false,
  }: {
    label: string;
    onDelete: () => void;
    isDragging?: boolean;
    dragging?: boolean;
  }) => {
    const disableHover = dragging && !isDragging;

    return (
      <>
        <button
          disabled={isDragging}
          className={`${roundedButtonClass} group w-auto gap-2 !bg-[var(--bg-modal-link)] px-4`}
          onClick={onDelete}
        >
          <span
            className={`${disableHover ? "" : !isDragging && "group-hover:text-[var(--accent-color)]"} truncate font-semibold transition-colors duration-[var(--fast)]`}
          >
            {label}
          </span>
          <XMarkIcon
            className={`${disableHover ? "" : !isDragging && "group-hover:text-[var(--accent-color)]"} h-6 w-6 transition-[color,rotate] duration-[var(--fast)]`}
          />
        </button>
      </>
    );
  };

  // --- SET/UNSET IS DIRTY ---
  useEffect(() => {
    if (props.itemId === null || props.itemId === undefined) {
      const dirty =
        name !== "" ||
        isHidden !== false ||
        JSON.stringify(shiftTeamIds) !== JSON.stringify(originalShiftTeamIds);

      setIsDirty(dirty);
      return;
    }

    const dirty = name !== originalName || isHidden !== originalIsHidden;
    setIsDirty(dirty);
  }, [
    name,
    isHidden,
    shiftTeamIds,
    originalName,
    originalIsHidden,
    originalShiftTeamIds,
  ]);

  return (
    <>
      {props.isOpen && (
        <ModalBase
          ref={modalRef}
          isOpen={props.isOpen}
          onClose={() => props.onClose()}
          icon={props.itemId ? PencilSquareIcon : PlusIcon}
          label={
            props.itemId
              ? t("Common/Edit") + " " + t("Common/shift")
              : t("Common/Add") + " " + t("Common/shift")
          }
          confirmOnClose
          isDirty={isDirty}
        >
          <form
            ref={formRef}
            className="relative flex flex-col gap-4"
            onSubmit={(e) => (props.itemId ? updateShift(e) : addShift(e))}
          >
            <div className="flex items-center gap-2">
              <hr className="w-12 text-[var(--border-tertiary)]" />
              <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                {t("ShiftModal/Info1")}
              </h3>
              <hr className="w-full text-[var(--border-tertiary)]" />
            </div>

            <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:gap-4">
              <Input
                label={t("Common/Name")}
                value={name}
                onChange={(val) => {
                  setName(String(val));
                }}
                onModal
                required
                {...shiftConstraints.name}
              />
            </div>

            <div className="flex items-center gap-2">
              <hr className="w-12 text-[var(--border-tertiary)]" />
              <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                {t("UnitModal/Info2")}
              </h3>
              <hr className="w-full text-[var(--border-tertiary)]" />
            </div>

            <div className="flex gap-4">
              <MultiDropdown
                label={t("Common/Shift teams")}
                value={shiftTeamIds.map(String)}
                onChange={(val: string[]) => setShiftTeamIds(val.map(Number))}
                options={shiftTeams.map((t) => ({
                  label: t.name,
                  value: String(t.id),
                }))}
                onModal
              />
            </div>

            {shiftTeamIds.length > 0 && (
              <>
                <DragDrop
                  items={shiftTeamIds}
                  getId={(id) => String(id)}
                  onReorder={(newList) => setShiftTeamIds(newList)}
                  onDraggingChange={setIsAnyDragging}
                  renderItem={(id, isDragging) => {
                    const col = shiftTeams.find((c) => c.id === id);
                    if (!col) {
                      return null;
                    }

                    return (
                      <DragChip
                        label={col.name}
                        isDragging={isDragging}
                        dragging={isAnyDragging}
                        onDelete={() =>
                          setShiftTeamIds((prev) =>
                            prev.filter((v) => v !== id),
                          )
                        }
                      />
                    );
                  }}
                />
                <span className="text-sm text-[var(--text-secondary)] italic">
                  {t("Modal/Drag and drop2") +
                    t("Common/shift team") +
                    t("Modal/Drag and drop3")}
                </span>
              </>
            )}

            <div className="mt-8 flex items-center gap-2">
              <hr className="w-12 text-[var(--border-tertiary)]" />
              <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                {t("Common/Status")}
              </h3>
              <hr className="w-full text-[var(--border-tertiary)]" />
            </div>

            <div className="mb-8 flex justify-between gap-4">
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
                <span className="mb-0.5">{t("ShiftModal/Hide shift")}</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={handleSaveClick}
                className={`${buttonPrimaryClass} w-full grow-2 sm:w-auto`}
              >
                {props.itemId ? t("Modal/Save") : t("Common/Add")}
              </button>
              <button
                type="button"
                onClick={() => modalRef.current?.requestClose()}
                className={`${buttonSecondaryClass} w-full grow sm:w-auto`}
              >
                {t("Modal/Abort")}
              </button>
            </div>
          </form>
        </ModalBase>
      )}
    </>
  );
};

export default ShiftModal;
