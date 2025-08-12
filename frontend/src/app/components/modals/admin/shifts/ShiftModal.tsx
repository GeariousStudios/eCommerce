"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import Input from "../../../common/Input";
import { useToast } from "../../../toast/ToastProvider";
import {
  buttonAddPrimaryClass,
  buttonDeletePrimaryClass,
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
import SingleDropdown from "@/app/components/common/SingleDropdown";

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

type WeeklyTime = {
  teamId: number;
  weekIndex: number;
  dayOfWeek: number;
  start: string;
  end: string;
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
  const [weeklyTimes, setWeeklyTimes] = useState<WeeklyTime[]>([]);
  const [cycleLengthWeeks, setCycleLengthWeeks] = useState(1);
  // const [anchorWeekStart, setAnchorWeekStart] = useState<string>("");
  const [shiftTeamDisplayNames, setShiftTeamDisplayNames] = useState<
    Record<number, string>
  >({});

  const [selectionByTeam, setSelectionByTeam] = useState<
    Record<number, { weekIndex: number; dayOfWeek: number }>
  >({});

  const [originalName, setOriginalName] = useState("");
  const [originalIsHidden, setOriginalIsHidden] = useState(false);
  const [originalShiftTeamIds, setOriginalShiftTeamIds] = useState<number[]>(
    [],
  );
  const [originalWeeklyTimes, setOriginalWeeklyTimes] = useState<WeeklyTime[]>(
    [],
  );
  const [originalCycleLengthWeeks, setOriginalCycleLengthWeeks] = useState(1);
  // const [originalAnchorWeekStart, setOriginalAnchorWeekStart] =
  //   useState<string>("");
  const [originalShiftTeamDisplayNames, setOriginalShiftTeamDisplayNames] =
    useState<Record<number, string>>({});

  const [isDirty, setIsDirty] = useState(false);

  const [isAnyDragging, setIsAnyDragging] = useState(false);

  // --- Other ---
  const token = localStorage.getItem("token");
  const { notify } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const dayOptions = useMemo(
    () => [
      { label: t("Common/Monday"), value: 0 },
      { label: t("Common/Tuesday"), value: 1 },
      { label: t("Common/Wednesday"), value: 2 },
      { label: t("Common/Thursday"), value: 3 },
      { label: t("Common/Friday"), value: 4 },
      { label: t("Common/Saturday"), value: 5 },
      { label: t("Common/Sunday"), value: 6 },
    ],
    [t],
  );

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

      setWeeklyTimes([]);
      setOriginalWeeklyTimes([]);

      setCycleLengthWeeks(1);
      setOriginalCycleLengthWeeks(1);

      // setAnchorWeekStart("");
      // setOriginalAnchorWeekStart("");

      setSelectionByTeam({});

      setShiftTeamDisplayNames({});
      setOriginalShiftTeamDisplayNames({});
    }
  }, [props.isOpen, props.itemId]);

  // --- BACKEND ---
  // --- Add shift ---
  const addShift = async (event: FormEvent) => {
    event.preventDefault();

    // if (hasOverlap()) {
    //   notify("error", t("ShiftModal/TimesOverlap"));
    //   return;
    // }

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
          weeklyTimes,
          shiftTeamDisplayNames: Object.fromEntries(
            Object.entries(shiftTeamDisplayNames).map(([k, v]) => [
              Number(k),
              v && v.trim() !== "" ? v : null,
            ]),
          ),
          cycleLengthWeeks,
          // anchorWeekStart: anchorWeekStart || null,
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

    setWeeklyTimes(result.weeklyTimes ?? []);
    setOriginalWeeklyTimes(result.weeklyTimes ?? []);

    setCycleLengthWeeks(result.cycleLengthWeeks ?? 1);
    setOriginalCycleLengthWeeks(result.cycleLengthWeeks ?? 1);

    // setAnchorWeekStart(result.anchorWeekStart ?? "");
    // setOriginalAnchorWeekStart(result.anchorWeekStart ?? "");

    const ids: number[] = result.shiftTeamIds ?? [];
    const displayMap: Record<number, string> = {};
    ids.forEach((id) => {
      const fromBackend = result.shiftTeamDisplayNames?.[id];
      displayMap[id] = fromBackend ?? "";
    });

    setShiftTeamDisplayNames(displayMap);
    setOriginalShiftTeamDisplayNames(displayMap);

    const sel: Record<number, { weekIndex: number; dayOfWeek: number }> = {};
    ids.forEach((id) => (sel[id] = { weekIndex: 0, dayOfWeek: 0 }));
    setSelectionByTeam(sel);
  };

  // --- Update shift ---
  const updateShift = async (event: FormEvent) => {
    event.preventDefault();

    // if (hasOverlap()) {
    //   notify("error", t("ShiftModal/TimesOverlap"));
    //   return;
    // }

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
          weeklyTimes,
          shiftTeamDisplayNames: Object.fromEntries(
            Object.entries(shiftTeamDisplayNames).map(([k, v]) => [
              Number(k),
              v ?? null,
            ]),
          ),
          cycleLengthWeeks,
          // anchorWeekStart: anchorWeekStart || null,
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
        JSON.stringify(weeklyTimes) !== JSON.stringify([]) ||
        JSON.stringify(shiftTeamDisplayNames) !== JSON.stringify({});

      setIsDirty(dirty);
      return;
    }

    const dirty =
      name !== originalName ||
      isHidden !== originalIsHidden ||
      JSON.stringify(shiftTeamIds) !== JSON.stringify(originalShiftTeamIds) ||
      JSON.stringify(weeklyTimes) !== JSON.stringify(originalWeeklyTimes) ||
      cycleLengthWeeks !== originalCycleLengthWeeks ||
      // anchorWeekStart !== originalAnchorWeekStart ||
      JSON.stringify(shiftTeamDisplayNames) !==
        JSON.stringify(originalShiftTeamDisplayNames);

    setIsDirty(dirty);
  }, [
    props.itemId,
    name,
    isHidden,
    shiftTeamIds,
    weeklyTimes,
    cycleLengthWeeks,
    shiftTeamDisplayNames,
    originalName,
    originalIsHidden,
    originalShiftTeamIds,
    originalWeeklyTimes,
    originalCycleLengthWeeks,
    originalShiftTeamDisplayNames,
  ]);

  // --- HELPERS ---
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  useEffect(() => {
    setSelectionByTeam((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        next[Number(k)].weekIndex = clamp(
          next[Number(k)].weekIndex,
          0,
          Math.max(0, cycleLengthWeeks - 1),
        );
      }
      return next;
    });
    setWeeklyTimes((prev) =>
      prev.filter((wt) => wt.weekIndex < cycleLengthWeeks),
    );
  }, [cycleLengthWeeks]);

  const setSelection = (
    teamId: number,
    patch: Partial<{ weekIndex: number; dayOfWeek: number }>,
  ) => {
    setSelectionByTeam((prev) => ({
      ...prev,
      [teamId]: {
        weekIndex: patch.weekIndex ?? prev[teamId]?.weekIndex ?? 0,
        dayOfWeek: patch.dayOfWeek ?? prev[teamId]?.dayOfWeek ?? 0,
      },
    }));
  };

  const getIndexFor = (teamId: number, weekIndex: number, dayOfWeek: number) =>
    weeklyTimes.findIndex(
      (wt) =>
        wt.teamId === teamId &&
        wt.weekIndex === weekIndex &&
        wt.dayOfWeek === dayOfWeek,
    );

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

            <div className="xs:grid-cols-1 xs:gap-4 mb-8 grid grid-cols-1 gap-6">
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

            <div className="xs:grid-cols-2 xs:gap-4 grid grid-cols-1 gap-6">
              <Input
                type="number"
                label={t("ShiftModal/Cycle length (weeks)")}
                value={String(cycleLengthWeeks)}
                onChange={(v) =>
                  setCycleLengthWeeks(clamp(Number(v || 1), 1, 52))
                }
                onModal
                required
              />

              <MultiDropdown
                label={t("Common/Shift teams")}
                value={shiftTeamIds.map(String)}
                onChange={(vals: string[]) => {
                  const ids = vals.map(Number);
                  setShiftTeamIds(ids);

                  setWeeklyTimes((prev) =>
                    prev.filter((wt) => ids.includes(wt.teamId)),
                  );

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

                  setSelectionByTeam((prev) => {
                    const next: Record<
                      number,
                      { weekIndex: number; dayOfWeek: number }
                    > = {};
                    ids.forEach((id) => {
                      next[id] = prev[id] ?? { weekIndex: 0, dayOfWeek: 0 };
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

            {shiftTeamIds.length > 0 && (
              <div className="flex flex-col gap-4">
                <DragDrop
                  items={shiftTeamIds}
                  getId={(id) => String(id)}
                  onReorder={(newList) => setShiftTeamIds(newList)}
                  onDraggingChange={setIsAnyDragging}
                  containerClassName="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  renderItem={(id, isDragging) => {
                    const team = shiftTeams.find((t) => t.id === id);
                    if (!team) {
                      return null;
                    }
                    const sel = selectionByTeam[id] ?? {
                      weekIndex: 0,
                      dayOfWeek: 0,
                    };
                    const idx = getIndexFor(id, sel.weekIndex, sel.dayOfWeek);
                    const wt = idx >= 0 ? weeklyTimes[idx] : null;

                    const intervals: Array<{ wt: WeeklyTime; i: number }> =
                      weeklyTimes
                        .map((wt, i) => ({ wt, i }))
                        .filter(
                          (x) =>
                            x.wt.teamId === id &&
                            x.wt.weekIndex === sel.weekIndex &&
                            x.wt.dayOfWeek === sel.dayOfWeek,
                        )
                        .sort((a, b) => (a.wt.start > b.wt.start ? 1 : -1));

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
                              setWeeklyTimes((prev) =>
                                prev.filter((wt) => wt.teamId !== id),
                              );
                              setShiftTeamDisplayNames((prev) => {
                                const n = { ...prev };
                                delete n[id];
                                return n;
                              });
                              setSelectionByTeam((prev) => {
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

                        <div className="grid grid-cols-2 gap-6">
                          <SingleDropdown
                            label={t("Common/Week")}
                            value={String(sel.weekIndex)}
                            options={Array.from(
                              { length: cycleLengthWeeks },
                              (_, i) => ({
                                label: String(i + 1),
                                value: String(i),
                              }),
                            )}
                            onChange={(v) =>
                              setSelection(id, {
                                weekIndex: clamp(
                                  Number(v ?? 0),
                                  0,
                                  Math.max(0, cycleLengthWeeks - 1),
                                ),
                              })
                            }
                            inChip
                          />
                          <SingleDropdown
                            label={t("Common/Day")}
                            value={String(sel.dayOfWeek)}
                            options={dayOptions.map((d) => ({
                              label: d.label,
                              value: String(d.value),
                            }))}
                            onChange={(val) =>
                              setSelection(id, { dayOfWeek: Number(val ?? 0) })
                            }
                            inChip
                          />

                          {wt ? (
                            <>
                              <Input
                                type="time"
                                label={t("Common/Start")}
                                value={wt.start}
                                onChange={(val) =>
                                  setWeeklyTimes((prev) =>
                                    prev.map((p, i) =>
                                      i === idx
                                        ? { ...p, start: String(val ?? "") }
                                        : p,
                                    ),
                                  )
                                }
                                inChip
                                required
                              />
                              <div className="flex flex-col gap-4">
                                <Input
                                  type="time"
                                  label={t("Common/Stop")}
                                  value={wt.end}
                                  onChange={(val) =>
                                    setWeeklyTimes((prev) =>
                                      prev.map((p, i) =>
                                        i === idx
                                          ? { ...p, end: String(val ?? "") }
                                          : p,
                                      ),
                                    )
                                  }
                                  inChip
                                  required
                                />
                              </div>

                              <button
                                type="button"
                                className={`${buttonDeletePrimaryClass} col-span-2`}
                                onClick={() =>
                                  setWeeklyTimes((prev) =>
                                    prev.filter((_, i) => i !== idx),
                                  )
                                }
                                aria-label={t("Common/Remove")}
                              >
                                {t("ShiftModal/Deactivate day")}
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className={`${buttonAddPrimaryClass} col-span-2`}
                              onClick={() =>
                                setWeeklyTimes((prev) => [
                                  ...prev,
                                  {
                                    teamId: id,
                                    weekIndex: sel.weekIndex,
                                    dayOfWeek: sel.dayOfWeek,
                                    start: "08:00",
                                    end: "16:00",
                                  },
                                ])
                              }
                            >
                              {t("ShiftModal/Activate day")}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
              </div>
            )}

            <span className="text-sm text-[var(--text-secondary)] italic">
              {t("Modal/Drag and drop2") +
                t("Common/shift team") +
                t("Modal/Drag and drop3")}
            </span>

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
