"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import Input from "../../../common/Input";
import { useToast } from "../../../toast/ToastProvider";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  iconButtonPrimaryClass,
  roundedButtonClass,
  switchClass,
  switchKnobClass,
} from "@/app/styles/buttonClasses";
import ModalBase, { ModalBaseHandle } from "../../ModalBase";
import { useTranslations } from "next-intl";
import {
  shiftConstraints,
  shiftTeamConstraints,
} from "@/app/helpers/inputConstraints";
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
  const [shiftTeamStartTimes, setShiftTeamStartTimes] = useState<
    Record<number, string>
  >({});
  const [shiftTeamEndTimes, setShiftTeamEndTimes] = useState<
    Record<number, string>
  >({});
  const [shiftTeamDisplayNames, setShiftTeamDisplayNames] = useState<
    Record<number, string>
  >({});

  const [originalName, setOriginalName] = useState("");
  const [originalIsHidden, setOriginalIsHidden] = useState(false);
  const [originalShiftTeamIds, setOriginalShiftTeamIds] = useState<number[]>(
    [],
  );
  const [originalShiftTeamStartTimes, setOriginalShiftTeamStartTimes] =
    useState<Record<number, string>>({});
  const [originalShiftTeamEndTimes, setOriginalShiftTeamEndTimes] = useState<
    Record<number, string>
  >({});
  const [originalShiftTeamDisplayNames, setOriginalShiftTeamDisplayNames] =
    useState<Record<number, string>>({});

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

      setShiftTeamStartTimes({});
      setOriginalShiftTeamStartTimes({});

      setShiftTeamEndTimes({});
      setOriginalShiftTeamEndTimes({});

      setShiftTeamDisplayNames({});
      setOriginalShiftTeamDisplayNames({});
    }
  }, [props.isOpen, props.itemId]);

  // --- BACKEND ---
  // --- Add shift ---
  const addShift = async (event: FormEvent) => {
    event.preventDefault();

    if (hasOverlap()) {
      notify("error", t("ShiftModal/TimesOverlap"));
      return;
    }

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
          shiftTeamStartTimes: Object.fromEntries(
            Object.entries(shiftTeamStartTimes).map(([k, v]) => [
              Number(k),
              v ? `${v}:00` : null,
            ]),
          ),
          shiftTeamEndTimes: Object.fromEntries(
            Object.entries(shiftTeamEndTimes).map(([k, v]) => [
              Number(k),
              v ? `${v}:00` : null,
            ]),
          ),
          shiftTeamDisplayNames: Object.fromEntries(
            Object.entries(shiftTeamDisplayNames).map(([k, v]) => [
              Number(k),
              v && v.trim() !== "" ? v : null,
            ]),
          ),
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

    setShiftTeamStartTimes(
      Object.fromEntries(
        Object.entries(result.shiftTeamStartTimes ?? {}).map(([k, v]) => [
          Number(k),
          String(v).slice(0, 5),
        ]),
      ),
    );
    setOriginalShiftTeamStartTimes(
      Object.fromEntries(
        Object.entries(result.shiftTeamStartTimes ?? {}).map(([k, v]) => [
          Number(k),
          String(v).slice(0, 5),
        ]),
      ),
    );

    setShiftTeamEndTimes(
      Object.fromEntries(
        Object.entries(result.shiftTeamEndTimes ?? {}).map(([k, v]) => [
          Number(k),
          String(v).slice(0, 5),
        ]),
      ),
    );
    setOriginalShiftTeamEndTimes(
      Object.fromEntries(
        Object.entries(result.shiftTeamEndTimes ?? {}).map(([k, v]) => [
          Number(k),
          String(v).slice(0, 5),
        ]),
      ),
    );

    const ids: number[] = result.shiftTeamIds ?? [];
    const displayMap: Record<number, string> = {};
    ids.forEach((id) => {
      const fromBackend = result.shiftTeamDisplayNames?.[id];
      displayMap[id] = fromBackend ?? "";
    });

    setShiftTeamDisplayNames(displayMap);
    setOriginalShiftTeamDisplayNames(displayMap);
  };

  // --- Update shift ---
  const updateShift = async (event: FormEvent) => {
    event.preventDefault();

    if (hasOverlap()) {
      notify("error", t("ShiftModal/TimesOverlap"));
      return;
    }

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
          shiftTeamStartTimes: Object.fromEntries(
            Object.entries(shiftTeamStartTimes).map(([k, v]) => [
              Number(k),
              v ? `${v}:00` : null,
            ]),
          ),
          shiftTeamEndTimes: Object.fromEntries(
            Object.entries(shiftTeamEndTimes).map(([k, v]) => [
              Number(k),
              v ? `${v}:00` : null,
            ]),
          ),
          shiftTeamDisplayNames: Object.fromEntries(
            Object.entries(shiftTeamDisplayNames).map(([k, v]) => [
              Number(k),
              v ?? null,
            ]),
          ),
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
        JSON.stringify(shiftTeamIds) !== JSON.stringify([]) ||
        JSON.stringify(shiftTeamStartTimes) !== JSON.stringify({}) ||
        JSON.stringify(shiftTeamEndTimes) !== JSON.stringify({}) ||
        JSON.stringify(shiftTeamDisplayNames) !== JSON.stringify({});

      setIsDirty(dirty);
      return;
    }

    const dirty =
      name !== originalName ||
      isHidden !== originalIsHidden ||
      JSON.stringify(shiftTeamIds) !== JSON.stringify(originalShiftTeamIds) ||
      JSON.stringify(shiftTeamStartTimes) !==
        JSON.stringify(originalShiftTeamStartTimes) ||
      JSON.stringify(shiftTeamEndTimes) !==
        JSON.stringify(originalShiftTeamEndTimes) ||
      JSON.stringify(shiftTeamDisplayNames) !==
        JSON.stringify(originalShiftTeamDisplayNames);

    setIsDirty(dirty);
  }, [
    props.itemId,
    name,
    isHidden,
    shiftTeamIds,
    shiftTeamStartTimes,
    shiftTeamEndTimes,
    shiftTeamDisplayNames,
    originalName,
    originalIsHidden,
    originalShiftTeamIds,
    originalShiftTeamStartTimes,
    originalShiftTeamEndTimes,
    originalShiftTeamDisplayNames,
  ]);

  const hasOverlap = () => {
    const toMinutes = (hhmm: string) => {
      const [h, m] = (hhmm ?? "").split(":").map(Number);
      return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : NaN;
    };

    const intervals = shiftTeamIds.map((id) => {
      const s = toMinutes(shiftTeamStartTimes[id]);
      const e = toMinutes(shiftTeamEndTimes[id]);
      return { id, s, e };
    });

    for (const it of intervals) {
      if (!Number.isFinite(it.s) || !Number.isFinite(it.e)) return true;
      if (it.s >= it.e) return true;
    }

    intervals.sort((a, b) => a.s - b.s);
    for (let i = 1; i < intervals.length; i++) {
      if (intervals[i].s < intervals[i - 1].e) {
        return true;
      }
    }
    return false;
  };

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
                {t("ShiftModal/Info2")}
              </h3>
              <hr className="w-full text-[var(--border-tertiary)]" />
            </div>

            <div className="flex gap-4">
              <MultiDropdown
                label={t("Common/Shift teams")}
                value={shiftTeamIds.map(String)}
                onChange={(vals: string[]) => {
                  const ids = vals.map(Number);
                  setShiftTeamIds(ids);

                  setShiftTeamStartTimes((prev) => {
                    const next = { ...prev };
                    ids.forEach((id) => {
                      if (!(id in next)) next[id] = "08:00";
                    });
                    Object.keys(next).forEach((k) => {
                      if (!ids.includes(Number(k))) delete next[Number(k)];
                    });
                    return next;
                  });
                  setShiftTeamEndTimes((prev) => {
                    const next = { ...prev };
                    ids.forEach((id) => {
                      if (!(id in next)) next[id] = "16:00";
                    });
                    Object.keys(next).forEach((k) => {
                      if (!ids.includes(Number(k))) delete next[Number(k)];
                    });
                    return next;
                  });

                  setShiftTeamDisplayNames((prev) => {
                    const next = { ...prev };
                    ids.forEach((id) => {
                      if (!(id in next)) next[id] = "";
                    });
                    Object.keys(next).forEach((k) => {
                      if (!ids.includes(Number(k))) delete next[Number(k)];
                    });
                    return next;
                  });
                }}
                options={shiftTeams.map((t) => ({
                  label: t.name,
                  value: String(t.id),
                }))}
                onModal
              />
            </div>

            {/* --- Shift Teams --- */}
            {shiftTeamIds.length > 0 && (
              <div className="flex flex-col gap-4">
                <DragDrop
                  items={shiftTeamIds}
                  getId={(id) => String(id)}
                  onReorder={(newList) => setShiftTeamIds(newList)}
                  onDraggingChange={setIsAnyDragging}
                  containerClassName="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
                  renderItem={(id, isDragging) => {
                    const team = shiftTeams.find((t) => t.id === id);
                    if (!team) {
                      return null;
                    }

                    return (
                      <div
                        key={id}
                        className="flex flex-col gap-8 rounded-2xl bg-[var(--bg-navbar)] p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-semibold">{team.name}</span>
                          <button
                            type="button"
                            disabled={isDragging}
                            className={`${iconButtonPrimaryClass}`}
                            onClick={() => {
                              setShiftTeamIds((prev) =>
                                prev.filter((v) => v !== id),
                              );
                              setShiftTeamStartTimes((prev) => {
                                const n = { ...prev };
                                delete n[id];
                                return n;
                              });
                              setShiftTeamEndTimes((prev) => {
                                const n = { ...prev };
                                delete n[id];
                                return n;
                              });
                              setShiftTeamDisplayNames((prev) => {
                                const n = { ...prev };
                                delete n[id];
                                return n;
                              });
                            }}
                            aria-label={t("Common/Remove") + " " + team.name}
                          >
                            <XMarkIcon className="h-6 min-h-6 w-6 min-w-6" />
                          </button>
                        </div>

                        {/* --- Times --- */}
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            type="time"
                            label={t("Common/Start")}
                            value={shiftTeamStartTimes[id] ?? ""}
                            onChange={(val) =>
                              setShiftTeamStartTimes((p) => ({
                                ...p,
                                [id]: String(val ?? ""),
                              }))
                            }
                            aria-label={`${team.name} start`}
                            inChip
                            required
                          />
                          <Input
                            type="time"
                            label={t("Common/Stop")}
                            value={shiftTeamEndTimes[id] ?? ""}
                            onChange={(val) =>
                              setShiftTeamEndTimes((p) => ({
                                ...p,
                                [id]: String(val ?? ""),
                              }))
                            }
                            aria-label={`${team.name} stop`}
                            inChip
                            required
                          />
                        </div>

                        <Input
                          type="text"
                          label={t("ShiftModal/Display name")}
                          value={shiftTeamDisplayNames[id] ?? ""}
                          onChange={(val) =>
                            setShiftTeamDisplayNames((p) => ({
                              ...p,
                              [id]: String(val ?? ""),
                            }))
                          }
                          aria-label={`${team.name} display name`}
                          inChip
                          {...shiftTeamConstraints.name}
                        />
                      </div>
                    );
                  }}
                />

                <span className="text-sm text-[var(--text-secondary)] italic">
                  {t("Modal/Drag and drop2") +
                    t("Common/shift team") +
                    t("Modal/Drag and drop3")}
                </span>
              </div>
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
