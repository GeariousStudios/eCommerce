"use client";

import { useEffect, useRef, useState } from "react";
import {
  buttonDeletePrimaryClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
  iconButtonPrimaryClass,
  roundedButtonClass,
} from "../../styles/buttonClasses";
import Message from "../../components/common/Message";
import CustomTooltip from "../../components/common/CustomTooltip";
import { useToast } from "../../components/toast/ToastProvider";
import {
  useParams,
  useSearchParams,
  useRouter,
  notFound,
} from "next/navigation";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from "@heroicons/react/20/solid";
import React from "react";
import * as Outline from "@heroicons/react/24/outline";
import * as Solid from "@heroicons/react/24/solid";
import HoverIcon from "@/app/components/common/HoverIcon";
import Input from "@/app/components/common/Input";
import ReportModal from "@/app/components/modals/report/ReportModal";
import UnitCellModal from "@/app/components/modals/report/UnitCellModal";
import {
  toLocalDateString,
  utcIsoToLocalDateTime,
} from "@/app/helpers/timeUtils";
import DeleteModal from "@/app/components/modals/DeleteModal";
import { useTranslations } from "next-intl";
import MenuDropdown from "@/app/components/common/MenuDropdown/MenuDropdown";
import MenuDropdownAnchor from "@/app/components/common/MenuDropdown/MenuDropdownAnchor";
import { badgeClass } from "@/app/components/manage/ManageClasses";

type Props = {
  isAuthReady: boolean | null;
  isLoggedIn: boolean | null;
  isConnected: boolean | null;
  isReporter: boolean | null;
};

type Shift = {
  id: number;
  name: string;
  systemKey?: string;
  teamSpans?: ShiftTeamSpan[];
};

type ShiftTeamSpan = {
  id: number;
  name: string;
  label: string;
  start: string;
  end: string;
  colorHex: string;
  textColorHex: string;
};

type ShiftChange = {
  id: number;
  hour: number;
  minute?: number;
  oldShiftId: number;
  newShiftId: number;
};

// --- CLASSES ---
export const thClass =
  "px-4 py-2 h-[40px] text-left border-b-1 border-b-[var(--border-main)] border-r-1 border-r-[var(--border-secondary)] flex-inline items-center justify-center";

export const tdClass =
  "px-4 py-2 h-[40px] text-left break-all border-1 border-[var(--border-secondary)] flex-inline items-center justify-center";

export const tdClassSpecial =
  "px-4 py-2 h-[40px] text-left break-all flex-inline items-center justify-center";

export const shiftsClass =
  "truncate font-semibold transition-colors duration-[var(--fast)] group-hover:text-[var(--accent-color)]";

export const shiftsIconClass =
  "h-6 w-6 transition-[color,rotate] duration-[var(--fast)] group-hover:text-[var(--accent-color)]";

const UnitClient = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- Other ---
  // const params = useParams();
  // const unitId = params?.id;
  const { groupId, unitId } = useParams() as {
    groupId?: string;
    unitId?: string;
  };
  const parsedGroupId = groupId ? Number(groupId) : undefined;
  const parsedUnitId = unitId ? Number(unitId) : undefined;

  const searchParams = useSearchParams();
  const router = useRouter();
  const dateParam = searchParams.get("date");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");
  const { notify } = useToast();

  // --- Refs ---
  const shiftsRef = useRef<HTMLButtonElement | null>(null);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);

  // --- States: Shift ---
  const [shiftsOpen, setShiftsOpen] = useState(false);
  const [shiftNames, setShiftNames] = useState<Shift[]>([]);
  const [shiftOptions, setShiftOptions] = useState<Shift[]>([]);
  const [currentActiveShiftId, setCurrentActiveShiftId] = useState<
    number | null
  >(null);
  const [shiftVisibility, setShiftVisibility] = useState<
    Record<number, boolean>
  >({});
  const dropdownShifts = shiftOptions.map((s) => ({
    id: s.id,
    label: s.systemKey ? t(`Shifts/${s.systemKey}`) : s.name,
  }));
  const [shiftChanges, setShiftChanges] = useState<ShiftChange[]>([]);
  const [openChangeMenuId, setOpenChangeMenuId] = useState<number | null>(null);
  const [editChangeDate, setEditChangeDate] = useState<string>("");
  const [editChangeTime, setEditChangeTime] = useState<string>("");

  // --- States: Unit ---
  const [unitName, setUnitName] = useState("");
  const [unitGroupId, setUnitGroupId] = useState("");
  const [isHidden, setIsHidden] = useState(false);
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [activeShiftId, setActiveShiftId] = useState<number | null>(null);
  const [pendingShiftId, setPendingShiftId] = useState<number | null>(null);
  const [baseShiftId, setBaseShiftId] = useState<number | null>(null);
  const [unitCreationDate, setUnitCreationDate] = useState<string>("");

  // --- States: UnitGroup ---
  const [unitGroupName, setUnitGroupName] = useState("");

  // --- States: UnitColumn ---
  const [unitColumnIds, setUnitColumnIds] = useState<number[]>([]);
  const [unitColumnNames, setUnitColumnNames] = useState<string[]>([]);
  const [unitColumnDataTypes, setUnitColumnDataTypes] = useState<string[]>([]);
  const [unitColumnCompareFlags, setUnitColumnCompareFlags] = useState<
    boolean[]
  >([]);
  const [unitColumnComparisonTexts, setUnitColumnComparisonTexts] = useState<
    string[]
  >([]);

  // --- States: UnitCell & Report ---
  const [unitCells, setUnitCells] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  // --- States: This ---
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [allExpanded, setAllExpanded] = useState(false);

  const [isUnitCellModalOpen, setIsUnitCellModalOpen] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportId, setReportId] = useState<string | undefined>();

  const [deleteType, setDeleteType] = useState<"report" | "shiftChange" | null>(
    null,
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | undefined>();

  const [refetchData, setRefetchData] = useState(true);

  // --- States: Other ---
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  const [isLoadingColumns, setIsLoadingColumns] = useState(true);
  const [isLoadingShifts, setIsLoadingShifts] = useState(true);

  const [isManualRefresh, setIsManualRefresh] = useState(true);

  const [isInvalid, setIsInvalid] = useState(false);
  const [isUnitValid, setIsUnitValid] = useState(false);

  const [selectedDate, setSelectedDate] = useState(() => {
    return dateParam || new Date().toISOString().split("T")[0];
  });

  const [reportDate, setReportDate] = useState<string>("");
  const [reportHour, setReportHour] = useState<string>("");

  const [pendingShiftDate, setPendingShiftDate] =
    useState<string>(selectedDate);
  const [pendingShiftTime, setPendingShiftTime] = useState<string>("");
  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  const isBootstrapping = isLoadingUnits || isLoadingColumns || isLoadingShifts;
  const canShowLock = !isBootstrapping && isHidden && !isInvalid;
  const canShowInvalid = !isBootstrapping && isInvalid && !isHidden;
  // const isReady = !isBootstrapping && !isHidden && !isInvalid;
  const isReady = !isHidden && !isInvalid;

  // --- HELPERS ---
  const overlaps = (
    aStart: number,
    aEnd: number,
    bStart: number,
    bEnd: number,
  ) => {
    const overlapLinear = (x1: number, x2: number, y1: number, y2: number) =>
      Math.max(x1, y1) < Math.min(x2, y2);

    if (bEnd > bStart) {
      return overlapLinear(aStart, aEnd, bStart, bEnd);
    }
    return (
      overlapLinear(aStart, aEnd, bStart, 1440) ||
      overlapLinear(aStart, aEnd, 0, bEnd)
    );
  };

  const toMinutes = (s: string) => {
    if (!s) {
      return NaN;
    }

    const clean = s.trim().replace(".", ":");
    const [hStr, mStr = "0"] = clean.split(":");
    const hh = Number(hStr);
    const mm = Number(mStr);

    if (Number.isNaN(hh) || Number.isNaN(mm)) {
      return NaN;
    }

    return hh * 60 + mm;
  };

  const getShiftLabel = (shiftId: number) => {
    const s = shiftNames.find((x) => x.id === shiftId);
    if (!s) {
      return t("Common/Unknown");
    }

    if (s.systemKey) {
      const key = `Shifts/${s.systemKey}`;
      const tr = t(key);
      return tr !== key ? tr : s.name;
    }

    return s.name;
  };

  const getTeamSpanForHour = (
    shiftId: number | null,
    hour: number,
  ): ShiftTeamSpan | undefined => {
    if (shiftId == null) {
      return undefined;
    }

    const s = shiftNames.find((x) => x.id === shiftId);
    const spans = s?.teamSpans ?? [];
    const startM = hour * 60;
    const endM = (hour + 1) * 60;

    return spans.find((ts) => {
      const st = toMinutes(ts.start);
      const en = toMinutes(ts.end);
      if (Number.isNaN(st) || Number.isNaN(en)) {
        return false;
      }

      return overlaps(startM, endM, st, en);
    });
  };

  const getSortedChanges = () =>
    [...shiftChanges].sort(
      (a, b) => a.hour - b.hour || (a.minute ?? 0) - (b.minute ?? 0),
    );

  const resolveShiftIdForTime = (
    hour: number,
    minute: number = 0,
  ): number | null => {
    const changes = getSortedChanges();
    let sid = baseShiftId ?? activeShiftId ?? null;

    for (const c of changes) {
      const m = c.minute ?? 0;
      if (c.hour < hour || (c.hour === hour && m <= minute)) {
        sid = c.newShiftId;
      }
    }
    return sid;
  };

  const toHm = (hour: number, minute?: number) =>
    `${String(hour).padStart(2, "0")}:${String(minute ?? 0).padStart(2, "0")}`;

  const isSameDate = (yyyyMmDd: string, d: Date) => {
    const a = new Date(yyyyMmDd + "T00:00:00");
    return (
      a.getFullYear() === d.getFullYear() &&
      a.getMonth() === d.getMonth() &&
      a.getDate() === d.getDate()
    );
  };

  const now = new Date(nowTs);
  const isToday = isSameDate(selectedDate, now);
  const currentHour = isToday ? now.getHours() : 0;
  const currentMinute = isToday ? now.getMinutes() : 0;

  const isCreationMidnight = (date?: string, time?: string) => {
    if (!date || !time || !unitCreationDate) {
      return false;
    }

    return date === unitCreationDate && toMinutes(time) === 0;
  };

  const getNumericCellValue = (cell: any) => {
    if (cell == null) {
      return undefined;
    }

    if (typeof cell.intValue === "number") {
      return cell.intValue;
    }

    const n = Number(cell.value);
    return Number.isFinite(n) ? n : undefined;
  };

  const compareColsCount = unitColumnNames.reduce((acc, _, i) => {
    return (
      acc +
      (unitColumnDataTypes[i] === "Number" && unitColumnCompareFlags[i] ? 1 : 0)
    );
  }, 0);

  // --- BACKEND ---
  // --- Fetch unit ---
  useEffect(() => {
    if (!unitId) {
      return;
    }

    const fetchUnit = async () => {
      try {
        setIsUnitValid(false);
        setIsLoadingUnits(true);
        const response = await fetch(`${apiUrl}/unit/fetch/${unitId}`, {
          headers: {
            "X-User-Language": localStorage.getItem("language") || "sv",
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (
          parsedGroupId !== undefined &&
          result?.unitGroupId !== parsedGroupId
        ) {
          setIsInvalid(true);
          return;
        }

        if (!response.ok) {
          notify("error", result?.message ?? t("Modal/Unknown error"));
        } else {
          fillUnitData(result);
          setIsUnitValid(true);
        }
      } catch (err) {
        notify("error", t("Modal/Unknown error"));
      } finally {
        setIsLoadingUnits(false);
      }
    };

    const fillUnitData = (result: any) => {
      setUnitName(result.name ?? "");
      setUnitGroupId(String(result.unitGroupId ?? ""));
      setIsHidden(result.isHidden ?? false);
      setCategoryIds(result.categoryIds ?? []);
      setActiveShiftId(result.activeShiftId ?? null);
      setCurrentActiveShiftId(result.activeShiftId ?? null);
      setPendingShiftId(result.activeShiftId ?? null);

      const createdLocal = result?.creationDate
        ? toLocalDateString(new Date(result.creationDate))
        : "";
      setUnitCreationDate(createdLocal);

      if (createdLocal) {
        const initial = selectedDate || new Date().toISOString().split("T")[0];
        const clamped = initial < createdLocal ? createdLocal : initial;
        if (clamped !== selectedDate) {
          setSelectedDate(clamped);
          const current = new URLSearchParams(searchParams.toString());
          current.set("date", clamped);
          router.replace(`?${current.toString()}`);
        }
      }
    };

    fetchUnit();
  }, [unitId]);

  // --- Fetch unit group ---
  useEffect(() => {
    if (!unitGroupId) {
      return;
    }

    const fetchUnitGroup = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/unit-group/fetch/${unitGroupId}`,
          {
            headers: {
              "X-User-Language": localStorage.getItem("language") || "sv",
              "Content-Type": "application/json",
            },
          },
        );

        const result = await response.json();

        if (!response.ok) {
          notify("error", result?.message ?? t("Modal/Unknown error"));
        } else {
          fillUnitGroupData(result);
        }
      } catch (err) {
        notify("error", t("Modal/Unknown error"));
      }
    };

    const fillUnitGroupData = (result: any) => {
      setUnitGroupName(result.name ?? "");
    };

    fetchUnitGroup();
  }, [unitGroupId]);

  // --- Fetch unit columns ---
  useEffect(() => {
    if (!unitId || !isUnitValid) {
      return;
    }

    const fetchUnitColumns = async () => {
      try {
        setIsLoadingColumns(true);
        const response = await fetch(`${apiUrl}/unit-column/unit/${unitId}`, {
          headers: {
            "X-User-Language": localStorage.getItem("language") || "sv",
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (!response.ok) {
          notify("error", result?.message ?? t("Modal/Unknown error"));
        } else {
          fillUnitColumnData(result);
        }
      } catch (err) {
        notify("error", t("Modal/Unknown error"));
      } finally {
        setIsLoadingColumns(false);
      }
    };

    const fillUnitColumnData = (result: any) => {
      setUnitColumnIds(result.map((c: any) => c.id));
      setUnitColumnNames(result.map((c: any) => c.name));
      setUnitColumnDataTypes(result.map((c: any) => c.dataType));
      setUnitColumnCompareFlags(result.map((c: any) => Boolean(c.compare)));
      setUnitColumnComparisonTexts(
        result.map((c: any) => c.comparisonText ?? ""),
      );
    };

    fetchUnitColumns();
  }, [unitId, isUnitValid]);

  // --- Fetch shifts ---
  useEffect(() => {
    if (!unitId || !isUnitValid) {
      return;
    }

    const fetchShifts = async () => {
      try {
        setIsLoadingShifts(true);
        const response = await fetch(
          `${apiUrl}/shift/unit/${unitId}?date=${selectedDate}`,
          {
            headers: {
              "X-User-Language": localStorage.getItem("language") || "sv",
              "Content-Type": "application/json",
            },
          },
        );

        const result = await response.json();

        if (!response.ok) {
          notify("error", result?.message ?? t("Modal/Unknown error"));
        } else {
          fillShiftData(result);
        }
      } catch (err) {
        notify("error", t("Modal/Unknown error"));
      } finally {
        setIsLoadingShifts(false);
      }
    };

    const fillShiftData = (result: any) => {
      const list = Array.isArray(result) ? result : [];
      const mapped = list.map((s: any) => ({
        id: s.id,
        name: s.name,
        systemKey: s.systemKey ?? null,
        teamSpans: (s.shiftTeamSpans ?? []).map((ts: any) => ({
          id: ts.teamId,
          name: ts.name,
          label: ts.label,
          start: ts.start,
          end: ts.end,
          colorHex: ts.colorHex,
          textColorHex: ts.textColorHex,
        })),
        isHidden: s.isHidden ?? false,
      }));

      const visibleShifts = mapped.filter((s) => !s.isHidden);
      setShiftNames(mapped);
      if (visibleShifts.length > 0) {
        setShiftOptions(visibleShifts);
      }
    };

    fetchShifts();
  }, [unitId, isUnitValid, selectedDate]);

  // --- Fetch shift changes ---
  useEffect(() => {
    if (!unitId || !isUnitValid || !selectedDate) {
      return;
    }

    fetchShiftChanges(selectedDate);
  }, [unitId, isUnitValid, selectedDate]);

  const fetchShiftChanges = async (date: string) => {
    const response = await fetch(
      `${apiUrl}/unit/${unitId}/shift-changes?date=${date}`,
      {
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    setBaseShiftId(data.baseShiftId ?? null);
    setShiftChanges(Array.isArray(data?.changes) ? data.changes : []);
    return Array.isArray(data?.changes) ? (data.changes as ShiftChange[]) : [];
  };

  // --- Update shift change ---
  const updateShiftChange = async (
    changeId: number,
    date: string,
    hour: number,
    minute: number,
    newShiftId?: number,
  ) => {
    try {
      const response = await fetch(
        `${apiUrl}/unit/${unitId}/shift-change/${changeId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-User-Language": localStorage.getItem("language") || "sv",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ date, hour, minute, newShiftId }),
        },
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      if (!response.ok) {
        const txt = await response.text();
        const err = txt ? JSON.parse(txt) : null;
        notify("error", err?.message || t("Modal/Unknown error"));
        return;
      }

      notify("success", t("Unit/Shift change") + t("Modal/updated"));
      await fetchShiftChanges(date);
      await refreshUnitActive();
    } catch {
      notify("error", t("Modal/Unknown error"));
    }
  };

  const handleEditShiftChange = async (
    change: ShiftChange,
    opts?: { date?: string; time?: string; usePendingShift?: boolean },
  ) => {
    let date = opts?.date ?? selectedDate;
    let time = opts?.time;

    if (!time) {
      const nt = prompt(
        "HH:mm",
        `${String(change.hour).padStart(2, "0")}:${String(change.minute ?? 0).padStart(2, "0")}`,
      );

      if (!nt) {
        return;
      }

      time = nt;
    }

    const [hhStr, mmStr = "0"] = time.split(":");
    const hh = Number(hhStr);
    const mm = Number(mmStr);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) {
      notify("error", t("Modal/Unknown error"));
      return;
    }

    const newShiftId =
      opts?.usePendingShift && pendingShiftId !== change.newShiftId
        ? (pendingShiftId ?? undefined)
        : undefined;

    await updateShiftChange(change.id, date, hh, mm, newShiftId);
  };

  // --- Delete shift change ---
  const deleteShiftChange = async (id: string) => {
    try {
      const response = await fetch(
        `${apiUrl}/unit/${unitId}/shift-change/${Number(id)}`,
        {
          method: "DELETE",
          headers: {
            "X-User-Language": localStorage.getItem("language") || "sv",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      if (!response.ok) {
        const txt = await response.text();
        const err = txt ? JSON.parse(txt) : null;
        notify("error", err?.message || t("Modal/Unknown error"));
        return;
      }

      setShiftChanges((prev) => prev.filter((c) => c.id !== Number(id)));
      await fetchShiftChanges(selectedDate);
      notify("success", t("Unit/Shift change") + t("Manage/deleted1"));
    } catch {
      notify("error", t("Modal/Unknown error"));
    }
  };

  useEffect(() => {
    const isToday = isSameDate(selectedDate, new Date());
    if (!isToday) {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = () => {
      setNowTs(Date.now());
      const msToNextMinute = 60000 - (Date.now() % 60000) + 25;
      timer = setTimeout(tick, msToNextMinute);
    };

    tick();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [selectedDate]);

  useEffect(() => {
    if (!shiftsOpen) {
      return;
    }
    if (pendingShiftTime) {
      return;
    }
    if (!isToday) {
      return;
    }
    setPendingShiftId(resolveShiftIdForTime(currentHour, currentMinute));
  }, [
    nowTs,
    shiftsOpen,
    pendingShiftTime,
    isToday,
    currentHour,
    currentMinute,
  ]);

  // --- Delete report ---
  const deleteReport = async (id: string) => {
    try {
      const response = await fetch(`${apiUrl}/report/delete/${id}`, {
        method: "DELETE",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      if (!response.ok) {
        notify("error", result?.message ?? t("Modal/Unknown error"));
        return;
      }

      setReports((prev) => prev.filter((r) => r.id !== id));
      notify(
        "success",
        t("ReportModal/Disruption report") + t("Manage/deleted1"),
      );
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- UI HANDLERS ---
  const toggleRow = (index: number) => {
    setExpandedRows((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const toggleAllRows = () => {
    if (allExpanded) {
      setExpandedRows([]);
    } else {
      setExpandedRows(Array.from({ length: 24 }, (_, i) => i));
    }
    setAllExpanded(!allExpanded);
  };

  const toggleUnitCellModal = (hour?: number) => {
    if (hour !== undefined) {
      setReportHour(hour.toString());
    } else {
      setReportHour("");
    }

    setIsUnitCellModalOpen((prev) => !prev);
  };

  // --- TOGGLE MODALS ---
  // --- Report ---
  const toggleReportModal = (id?: string, hour?: number, date?: string) => {
    setReportId(id);

    if (date) {
      setReportDate(date);
    } else {
      setReportDate(selectedDate);
    }

    if (hour !== undefined) {
      setReportHour(hour.toString());
    } else {
      setReportHour("");
    }

    setIsReportModalOpen((prev) => !prev);
  };

  // --- Delete ---
  const toggleDeleteItemModal = (
    id?: string,
    type: "report" | "shiftChange" = "report",
  ) => {
    if (id) {
      setDeletingItemId(id);
      setDeleteType(type);
      setIsDeleteModalOpen(true);
    } else {
      setIsDeleteModalOpen(false);
      setDeletingItemId(undefined);
      setDeleteType(null);
    }
  };
  // --- DATE SELECTOR ---
  const goToPreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    updateDate(date.toISOString().split("T")[0]);
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    updateDate(date.toISOString().split("T")[0]);
  };

  const updateDate = (newDate: string) => {
    let clamped = newDate;
    if (unitCreationDate && newDate < unitCreationDate) {
      clamped = unitCreationDate;
    }

    setSelectedDate(clamped);
    setRefetchData(true);
    setExpandedRows([]);

    const current = new URLSearchParams(searchParams.toString());
    current.set("date", clamped);

    router.replace(`?${current.toString()}`);
  };

  useEffect(() => {
    if (!unitId || !selectedDate || !refetchData || isInvalid) {
      return;
    }

    if (isBootstrapping) {
      return;
    }

    const fetchCells = async () => {
      const response = await fetch(
        `${apiUrl}/unit-cell/${unitId}/${selectedDate}`,
        {
          headers: {
            "X-User-Language": localStorage.getItem("language") || "sv",
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      return result;
    };

    const fetchReports = async () => {
      const dayStart = new Date(`${selectedDate}T00:00:00`);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const response = await fetch(
        `${apiUrl}/report/range/${unitId}?start=${dayStart.toISOString()}&end=${dayEnd.toISOString()}`,
        {
          headers: {
            "X-User-Language": localStorage.getItem("language") || "sv",
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      return result;
    };

    const fetchOngoingReports = async () => {
      const response = await fetch(`${apiUrl}/report/ongoing/${unitId}`, {
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      return result;
    };

    Promise.all([fetchCells(), fetchReports(), fetchOngoingReports()])
      .then(([cells, finishedReports, ongoingReports]) => {
        setUnitCells(cells);

        const combined = [...finishedReports, ...ongoingReports];
        const uniqueReports = Array.from(
          new Map(combined.map((r) => [r.id, r])).values(),
        );
        setReports(uniqueReports);
      })
      .catch((err) => {
        notify("error", t("Modal/Unknown error"));
      })
      .finally(() => {
        setRefetchData(false);
        setIsManualRefresh(false);
      });
  }, [unitId, selectedDate, refetchData, isInvalid, isBootstrapping]);

  // --- CHANGE SHIFT ---
  const changeShift = async () => {
    try {
      if (pendingShiftId == null) {
        return;
      }

      if (isCreationMidnight(pendingShiftDate, pendingShiftTime)) {
        notify("error", t("Unit/Shift change already exists"));
        return;
      }

      const body: any = { activeShiftId: pendingShiftId };
      if (pendingShiftDate && pendingShiftTime) {
        const [hh, mm] = String(pendingShiftTime).split(":").map(Number);
        body.date = pendingShiftDate;
        body.hour = Number.isFinite(hh) ? hh : 0;
        body.minute = Number.isFinite(mm) ? mm : 0;
      }

      const response = await fetch(`${apiUrl}/unit/${unitId}/active-shift`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-User-Language": localStorage.getItem("language") || "sv",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      if (response.status === 204) {
        const s = shiftNames.find((x) => x.id === pendingShiftId);
        const key = s?.systemKey
          ? `Shifts/${String(s.systemKey).trim()}`
          : null;
        const label = key
          ? t(key) !== key
            ? t(key)
            : (s?.name ?? "")
          : (s?.name ?? "");

        const isNowOrPast = (() => {
          if (!pendingShiftDate || !pendingShiftTime) {
            return true;
          }

          const [hh, mm = "0"] = String(pendingShiftTime).split(":");
          const local = new Date(
            `${pendingShiftDate}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`,
          );
          return local <= new Date();
        })();

        if (isNowOrPast) {
          setActiveShiftId(pendingShiftId);
          setCurrentActiveShiftId(pendingShiftId);
        }

        setShiftsOpen(false);
        await fetchShiftChanges(selectedDate);
        await refreshUnitActive();

        notify("info", `${t("Unit/Shift changed")} ${label}`);
        return;
      }

      let result: any = null;
      const text = await response.text();
      if (text) result = JSON.parse(text);

      if (!response.ok) {
        notify("error", result?.message || t("Modal/Unknown error"));
        return;
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  const refreshUnitActive = async () => {
    const res = await fetch(`${apiUrl}/unit/fetch/${unitId}`, {
      headers: {
        "X-User-Language": localStorage.getItem("language") || "sv",
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return;
    const u = await res.json();
    setActiveShiftId(u.activeShiftId ?? null);
    setCurrentActiveShiftId(u.activeShiftId ?? null);
  };

  useEffect(() => {
    if (shiftNames.length && pendingShiftId != null) {
      setShiftVisibility(
        shiftNames.reduce(
          (acc, s) => ({ ...acc, [s.id]: s.id === pendingShiftId }),
          {},
        ),
      );
    }
  }, [shiftNames, pendingShiftId]);

  useEffect(() => {
    if (currentActiveShiftId != null && !shiftsOpen) {
      setPendingShiftId(currentActiveShiftId);
    }
  }, [currentActiveShiftId, shiftsOpen]);

  // if (isBootstrapping) {
  //   return <Message icon="loading" content="content" fullscreen />;
  // }
  if (canShowLock) {
    return <Message icon="lock" content="lock" fullscreen />;
  }
  if (canShowInvalid) {
    return <Message content="invalid" fullscreen />;
  }
  if (isReady) {
    return (
      <>
        {/* --- MODALS --- */}
        <UnitCellModal
          isOpen={isUnitCellModalOpen}
          onClose={toggleUnitCellModal}
          onItemUpdated={() => {
            setRefetchData(true);
          }}
          unitId={parsedUnitId}
          selectedDate={selectedDate}
          selectedHour={reportHour}
        />

        <ReportModal
          isOpen={isReportModalOpen}
          onClose={toggleReportModal}
          onItemUpdated={() => {
            setRefetchData(true);
          }}
          unitId={parsedUnitId}
          categoryIds={categoryIds}
          reportId={Number(reportId)}
          selectedDate={reportDate}
          selectedHour={reportHour}
        />

        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => toggleDeleteItemModal()}
          onConfirm={async () => {
            if (!deletingItemId || !deleteType) {
              return;
            }

            if (deleteType === "report") {
              await deleteReport(deletingItemId);
              setReports((prev) =>
                prev.filter((r) => String(r.id) !== deletingItemId),
              );
            } else if (deleteType === "shiftChange") {
              await deleteShiftChange(deletingItemId);
              setShiftChanges((prev) =>
                prev.filter((c) => String(c.id) !== deletingItemId),
              );
            }

            toggleDeleteItemModal();
          }}
          customDeleteMessage={
            deleteType === "shiftChange"
              ? t("Unit/Remove post message")
              : undefined
          }
        />

        {/* --- CONTENT --- */}
        <div className="flex flex-col gap-4">
          <div className="flex w-full flex-wrap gap-4">
            <div className="flex gap-4">
              {/* --- Report data top --- */}
              <CustomTooltip
                content={`${!props.isReporter ? t("Common/No access") : unitColumnNames.length > 0 ? t("Unit/Tooltip report data") : t("Unit/No columns")}`}
                veryLongDelay={
                  props.isReporter == true && unitColumnNames.length > 0
                }
              >
                <button
                  className={`${buttonSecondaryClass} group lg:w-max lg:px-4`}
                  onClick={() => toggleUnitCellModal()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleUnitCellModal();
                    }
                  }}
                  tabIndex={0}
                  disabled={!props.isReporter || unitColumnNames.length === 0}
                >
                  <div className="flex items-center justify-center gap-2 truncate">
                    <HoverIcon
                      outline={Outline.DocumentTextIcon}
                      solid={Solid.DocumentTextIcon}
                      className="h-6 min-h-6 w-6 min-w-6"
                    />
                    <span className="hidden lg:block">
                      {t("Unit/Report data")}
                    </span>
                  </div>
                </button>
              </CustomTooltip>

              <CustomTooltip
                content={`${!props.isReporter ? t("Common/No access") : t("Unit/Tooltip report disruptions")}`}
                veryLongDelay={props.isReporter == true}
              >
                <button
                  className={`${buttonSecondaryClass} group lg:w-max lg:px-4`}
                  onClick={() => toggleReportModal()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleReportModal();
                    }
                  }}
                  tabIndex={0}
                  disabled={!props.isReporter}
                >
                  <div className="flex items-center justify-center gap-2 truncate">
                    <HoverIcon
                      outline={Outline.ExclamationTriangleIcon}
                      solid={Solid.ExclamationTriangleIcon}
                      className="h-6 min-h-6 w-6 min-w-6"
                    />
                    <span className="hidden lg:block">
                      {t("Unit/Report disruptions")}
                    </span>
                  </div>
                </button>
              </CustomTooltip>
            </div>

            <div className="ml-auto flex max-w-max flex-wrap items-center gap-4">
              <CustomTooltip
                content={`${refetchData && isManualRefresh ? t("Common/Updating") : t("Unit/Update page")}`}
                veryLongDelay
              >
                <button
                  className={`${buttonSecondaryClass} group flex items-center justify-center`}
                  onClick={() => {
                    setIsManualRefresh(true);
                    setRefetchData(true);
                  }}
                  aria-label={t("Unit/Update page")}
                  disabled={isManualRefresh && refetchData}
                >
                  <Outline.ArrowPathIcon
                    className={`${refetchData && isManualRefresh ? "motion-safe:animate-[spin_1s_linear_infinite]" : ""} min-h-full min-w-full`}
                  />
                </button>
              </CustomTooltip>
              <div className="flex">
                <button
                  className={`${buttonSecondaryClass} rounded-r-none`}
                  onClick={goToPreviousDay}
                  aria-label={t("Unit/Previous day")}
                  disabled={
                    !!unitCreationDate && selectedDate <= unitCreationDate
                  }
                >
                  <ChevronLeftIcon className="min-h-full min-w-full" />
                </button>
                <div className="flex max-w-40 min-w-40">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(val) => {
                      updateDate(String(val));
                    }}
                    notRounded
                    min={unitCreationDate}
                  />
                </div>
                <button
                  className={`${buttonSecondaryClass} rounded-l-none`}
                  onClick={goToNextDay}
                  aria-label={t("Unit/Next day")}
                >
                  <ChevronRightIcon className="min-h-full min-w-full" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-4">
            <div className="relative ml-auto flex items-center gap-4">
              <CustomTooltip
                content={`${!props.isReporter ? t("Common/No access") : ""}`}
                veryLongDelay={props.isReporter == true}
              >
                <button
                  ref={shiftsRef}
                  className={`${roundedButtonClass} ${!props.isReporter ? "!cursor-not-allowed opacity-50" : ""} group w-auto gap-2 px-4`}
                  onClick={async () => {
                    setPendingShiftId(null);
                    setPendingShiftId(currentActiveShiftId ?? null);
                    setPendingShiftDate(selectedDate);
                    setPendingShiftTime("");
                    setShiftsOpen((prev) => !prev);
                  }}
                  aria-haspopup="menu"
                  aria-expanded={shiftsOpen}
                  disabled={!props.isReporter}
                >
                  <span
                    className={`${shiftsClass} ${shiftsOpen ? "text-[var(--accent-color)]" : ""}`}
                  >
                    {(() => {
                      const sid = currentActiveShiftId;

                      if (sid == null) {
                        return t("Unit/Change shift");
                      }

                      const shift = shiftNames.find((s) => s.id === sid);
                      if (!shift) {
                        return t("Unit/Change shift");
                      }

                      if (shift.systemKey) {
                        const key = `Shifts/${shift.systemKey}`;
                        const tr = t(key);
                        // return tr !== key ? tr : shift.name;
                        return t("Unit/Change shift");
                      }

                      // return shift.name;
                      return t("Unit/Change shift");
                    })()}
                  </span>
                  <ChevronDownIcon
                    className={`${shiftsIconClass} ${shiftsOpen ? "rotate-180 text-[var(--accent-color)]" : ""}`}
                  />
                </button>
              </CustomTooltip>
              <MenuDropdown
                triggerRef={shiftsRef}
                isOpen={shiftsOpen}
                onClose={() => {
                  setShiftsOpen(false);
                  setPendingShiftId(null);
                }}
              >
                <div className="flex w-full flex-col gap-4">
                  {dropdownShifts.map((item) => {
                    const effectivePendingId =
                      pendingShiftId ?? currentActiveShiftId;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setPendingShiftId(item.id)}
                        role="menuitemradio"
                        aria-checked={pendingShiftId === item.id}
                        className="group flex cursor-pointer items-center justify-between gap-4"
                      >
                        <Input
                          type="radio"
                          name={`shift-selection-${item.id}`}
                          checked={effectivePendingId === item.id}
                          label={item.label}
                          readOnly
                        />
                      </div>
                    );
                  })}

                  <div className="mt-4 flex flex-col gap-6">
                    <Input
                      type="date"
                      value={pendingShiftDate}
                      onChange={(v) => setPendingShiftDate(String(v))}
                      label={t("Common/Date")}
                      onModal
                      required
                    />
                    <Input
                      type="time"
                      value={pendingShiftTime}
                      onChange={(v) => setPendingShiftTime(String(v))}
                      label={t("Common/Time")}
                      onModal
                      required
                    />
                  </div>
                </div>

                <button
                  className={`${buttonPrimaryClass} !min-h-[32px] w-full rounded-full`}
                  onClick={changeShift}
                  disabled={
                    !pendingShiftId ||
                    !pendingShiftDate ||
                    !pendingShiftTime ||
                    !props.isReporter
                  }
                >
                  {t("Unit/Change to shift")}
                </button>
              </MenuDropdown>
            </div>
          </div>
          <div className="w-full overflow-x-auto rounded border-1 border-[var(--border-main)]">
            <table className="w-full max-w-full min-w-fit border-collapse overflow-x-auto">
              <thead className="bg-[var(--bg-grid-header)]">
                {refetchData ? (
                  <tr>
                    <th
                      colSpan={unitColumnNames.length + compareColsCount + 4}
                      className={`${thClass}`}
                    />
                  </tr>
                ) : (
                  <tr>
                    {/* --- Standard <th>s --- */}
                    <th
                      className={`${thClass} sticky left-0 w-[52.5px] cursor-pointer bg-[var(--bg-grid-header)] whitespace-nowrap transition-[background] duration-[var(--fast)] hover:bg-[var(--bg-grid-header-hover)]`}
                      onClick={toggleAllRows}
                      role="button"
                      aria-label={t("Unit/Open or collapse")}
                    >
                      <div className={iconButtonPrimaryClass}>
                        {allExpanded ? <ChevronDownIcon /> : <ChevronUpIcon />}
                      </div>
                    </th>
                    <th
                      className={`${thClass} sticky left-[52.5px] w-[72px] bg-[var(--bg-grid-header)] whitespace-nowrap`}
                    >
                      {t("Common/Time")}
                    </th>
                    <th
                      className={`${thClass} sticky left-[52.5px] w-[72px] bg-[var(--bg-grid-header)] whitespace-nowrap`}
                    >
                      {t("Common/Shift")}
                    </th>
                    <th
                      className={`${thClass} ${unitColumnNames.length > 0 ? "w-0" : ""} whitespace-nowrap`}
                    >
                      {t("Unit/Disruptions")}
                    </th>

                    {unitColumnNames.map((col, i, arr) => (
                      <React.Fragment key={`head-${i}`}>
                        {unitColumnDataTypes[i] === "Number" &&
                          unitColumnCompareFlags[i] && (
                            <th
                              className={`${thClass} w-0 min-w-[10ch] whitespace-nowrap`}
                            >
                              {unitColumnComparisonTexts[i]}
                            </th>
                          )}

                        <th
                          className={`${thClass} ${i !== arr.length - 1 && unitColumnCompareFlags[i] && unitColumnDataTypes[i] === "Number" ? "w-0 min-w-[10ch]" : ""} whitespace-nowrap`}
                        >
                          {col}
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>
                )}
              </thead>
              <tbody>
                {refetchData ? (
                  <tr>
                    {/* 960px = h-[tdClass] * 24 */}
                    <td
                      colSpan={unitColumnNames.length + compareColsCount + 4}
                      className={`${tdClass} h-[960px]`}
                    >
                      <Message icon="loading" content="content" />
                    </td>
                  </tr>
                ) : (
                  <>
                    {Array.from({ length: 24 }, (_, hour) => {
                      const isExpanded = expandedRows.includes(hour);

                      const hasMidnightChange = shiftChanges.some(
                        (c) => c.hour === 0 && (c.minute ?? 0) === 0,
                      );

                      const isCreationDay =
                        Boolean(unitCreationDate) &&
                        selectedDate === unitCreationDate;

                      const baseSynthetic =
                        hour === 0 &&
                        baseShiftId != null &&
                        !hasMidnightChange &&
                        isCreationDay
                          ? [
                              {
                                id: -1,
                                hour: 0,
                                minute: 0,
                                oldShiftId: baseShiftId,
                                newShiftId: baseShiftId,
                              } as ShiftChange,
                            ]
                          : [];

                      const changesThisHour = [
                        ...baseSynthetic,
                        ...shiftChanges.filter((c) => c.hour === hour),
                      ].sort(
                        (a, b) =>
                          a.hour - b.hour || (a.minute ?? 0) - (b.minute ?? 0),
                      );

                      return (
                        <React.Fragment key={hour}>
                          <tr
                            role="button"
                            onClick={() => toggleRow(hour)}
                            aria-label="Öppna/stäng"
                            className={`${hour % 2 === 0 ? "bg-[var(--bg-grid)]" : "bg-[var(--bg-grid-zebra)]"} group/row cursor-pointer transition-[background] duration-[var(--fast)] hover:bg-[var(--bg-grid-header-hover)]`}
                          >
                            {/* --- Standard <td>s --- */}
                            {/* --- Expand <td> --- */}
                            <td
                              className={`${tdClass} ${hour === 23 ? "border-b-0" : ""} ${hour % 2 === 0 ? "bg-[var(--bg-grid)] group-hover/row:bg-[var(--bg-grid-header-hover)]" : "bg-[var(--bg-grid-zebra)] group-hover/row:bg-[var(--bg-grid-header-hover)]"} sticky left-0 w-[52.5px] border-l-0 whitespace-nowrap transition-[background] duration-[var(--fast)]`}
                            >
                              <div className={iconButtonPrimaryClass}>
                                {isExpanded ? (
                                  <ChevronDownIcon />
                                ) : (
                                  <ChevronUpIcon />
                                )}
                              </div>
                            </td>

                            {/* --- Time <td> --- */}
                            <td
                              className={`${tdClass} ${hour === 23 ? "border-b-0" : ""} ${hour % 2 === 0 ? "bg-[var(--bg-grid)] group-hover/row:bg-[var(--bg-grid-header-hover)]" : "bg-[var(--bg-grid-zebra)] group-hover/row:bg-[var(--bg-grid-header-hover)]"} sticky left-[52.5px] w-[72px] whitespace-nowrap transition-[background] duration-[var(--fast)]`}
                            >
                              {hour.toString().padStart(2, "0")}:00
                            </td>

                            {/* --- Shift <td> --- */}
                            <td
                              className={`${tdClass} ${hour === 23 ? "border-b-0" : ""} whitespace-nowrap`}
                            >
                              {(() => {
                                const sid = resolveShiftIdForTime(hour, 0);

                                if (sid == null) {
                                  return "?";
                                }

                                const shift = shiftNames.find(
                                  (s) => s.id === sid,
                                );
                                if (!shift) {
                                  return "?";
                                }

                                const span = getTeamSpanForHour(sid, hour);
                                if (!span) {
                                  return "-";
                                }

                                return (
                                  <span
                                    className={`${badgeClass}`}
                                    style={{
                                      backgroundColor: span.colorHex,
                                      color: span.textColorHex,
                                    }}
                                  >
                                    {span.label}
                                  </span>
                                );
                              })()}
                            </td>

                            {/* --- Disruptions <td> --- */}
                            <td
                              className={`${tdClass} ${hour === 23 ? "border-b-0" : ""} ${unitColumnNames.length > 0 ? "w-0" : "border-r-0"} whitespace-nowrap`}
                            >
                              {(() => {
                                const dayStart = new Date(
                                  `${selectedDate}T00:00:00`,
                                );
                                const hourStart = new Date(dayStart);
                                hourStart.setHours(hour, 0, 0, 0);
                                const hourEnd = new Date(dayStart);
                                hourEnd.setHours(hour + 1, 0, 0, 0);

                                const filteredReports = reports.filter(
                                  (report) => {
                                    if (!report.startTime) {
                                      return false;
                                    }

                                    const start = new Date(report.startTime);
                                    const stop = report.stopTime
                                      ? new Date(report.stopTime)
                                      : null;

                                    return (
                                      start < hourEnd &&
                                      (!stop || stop > hourStart)
                                    );
                                  },
                                );

                                const hasOngoing = filteredReports.some(
                                  (r) => !r.stopTime,
                                );

                                return (
                                  <>
                                    {filteredReports.length}{" "}
                                    {hasOngoing && (
                                      <CustomTooltip
                                        content={t("Unit/Ongoing disruption")}
                                        mediumDelay
                                      >
                                        <span className="ml-1 cursor-help text-[var(--note-error)]">
                                          &#x26A0;
                                        </span>
                                      </CustomTooltip>
                                    )}
                                  </>
                                );
                              })()}
                            </td>

                            {/* --- Unit Columns <td>s --- */}
                            {unitColumnNames.map((_, colIdx) => {
                              const columnName = unitColumnNames[colIdx];
                              const dataType = unitColumnDataTypes[colIdx];
                              const hasCompare = unitColumnCompareFlags[colIdx];
                              const compareLabel =
                                unitColumnComparisonTexts[colIdx];

                              const cell = unitCells.find(
                                (c) =>
                                  c.hour === hour &&
                                  c.columnName === columnName,
                              );

                              const displayValue =
                                dataType === "Boolean"
                                  ? cell?.value === true
                                    ? t("Common/Yes")
                                    : cell?.value === "false"
                                      ? t("Common/No")
                                      : ""
                                  : (cell?.intValue ?? cell?.value ?? "");

                              const numericCurrent =
                                dataType === "Number"
                                  ? getNumericCellValue(cell)
                                  : undefined;

                              const prevCell =
                                dataType === "Number"
                                  ? unitCells.find(
                                      (c) =>
                                        c.hour === hour - 1 &&
                                        c.columnName === columnName,
                                    )
                                  : undefined;

                              const numericPrev =
                                dataType === "Number"
                                  ? getNumericCellValue(prevCell)
                                  : undefined;

                              const diff =
                                numericCurrent != null && numericPrev != null
                                  ? numericCurrent - numericPrev
                                  : undefined;

                              return (
                                <React.Fragment key={`col-${hour}-${colIdx}`}>
                                  {dataType === "Number" && hasCompare && (
                                    <td
                                      className={`${tdClass} ${hour === 23 ? "border-b-0" : ""} ${colIdx === unitColumnNames.length - 1 ? "border-r-0" : ""} ${dataType === "Number" ? "max-w-max" : "min-w-32"}`}
                                    >
                                      {numericPrev == null
                                        ? "0"
                                        : diff! >= 0
                                          ? `${diff}`
                                          : `0`}
                                    </td>
                                  )}

                                  <td
                                    className={`${tdClass} ${
                                      hour === 23 ? "border-b-0" : ""
                                    } ${hasCompare && dataType === "Number" ? "" : colIdx === unitColumnNames.length - 1 ? "border-r-0" : ""} group/cell`}
                                  >
                                    <div className="flex gap-4">
                                      {displayValue}

                                      <CustomTooltip
                                        content={`${!props.isReporter ? t("Common/No access") : unitColumnNames.length > 0 ? t("Unit/Tooltip report data") + t("Unit/Tooltip this hour") : t("Unit/No columns")}`}
                                        veryLongDelay={
                                          props.isReporter == true &&
                                          unitColumnNames.length > 0
                                        }
                                      >
                                        <button
                                          type="button"
                                          className={`${iconButtonPrimaryClass} group invisible ml-auto group-hover/cell:visible`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleUnitCellModal(hour);
                                          }}
                                          disabled={
                                            !props.isReporter ||
                                            unitColumnNames.length === 0
                                          }
                                        >
                                          <HoverIcon
                                            outline={Outline.PencilSquareIcon}
                                            solid={Solid.PencilSquareIcon}
                                            className="h-6 min-h-6 w-6 min-w-6"
                                          />
                                        </button>
                                      </CustomTooltip>
                                    </div>
                                  </td>
                                </React.Fragment>
                              );
                            })}
                          </tr>

                          {/* --- Shift changes --- */}
                          {changesThisHour.map((change) => {
                            const isSynthetic = change.id < 0;

                            return (
                              <tr
                                key={`change-${hour}-${change.id}`}
                                className="bg-[var(--bg-grid-note)]"
                              >
                                <td
                                  className={`${tdClassSpecial} sticky left-0 w-[52.5px] bg-[var(--bg-grid-note)]`}
                                />
                                <td
                                  className={`${tdClassSpecial} sticky left-[52.5px] w-[72px] bg-[var(--bg-grid-note)]`}
                                >
                                  {toHm(change.hour, change.minute)}
                                </td>
                                <td
                                  colSpan={
                                    unitColumnNames.length +
                                    compareColsCount +
                                    4
                                  }
                                >
                                  <div className="flex items-center justify-center">
                                    <div className="flex w-full items-center justify-center">
                                      <>
                                        {!isSynthetic
                                          ? t("Unit/Shift changed") +
                                            getShiftLabel(change.newShiftId)
                                          : t("Unit/New unit shift changed") +
                                            getShiftLabel(change.newShiftId)}
                                      </>
                                    </div>
                                    <CustomTooltip
                                      content={`${!props.isReporter ? t("Common/No access") : isSynthetic ? t("Unit/Cannot be edited") : t("Unit/Update post")}`}
                                      veryLongDelay={
                                        props.isReporter == true && !isSynthetic
                                      }
                                    >
                                      <button
                                        ref={menuTriggerRef}
                                        className={`${iconButtonPrimaryClass} ${!props.isReporter ? "!cursor-not-allowed opacity-50" : ""} group mr-4 w-auto`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          menuTriggerRef.current =
                                            e.currentTarget as HTMLButtonElement;
                                          setEditChangeDate(selectedDate);
                                          setEditChangeTime(
                                            toHm(change.hour, change.minute),
                                          );
                                          setPendingShiftId(change.newShiftId);
                                          setOpenChangeMenuId((prev) =>
                                            prev === change.id
                                              ? null
                                              : change.id,
                                          );
                                        }}
                                        aria-haspopup="menu"
                                        aria-expanded={shiftsOpen}
                                        disabled={
                                          !props.isReporter || isSynthetic
                                        }
                                      >
                                        <HoverIcon
                                          outline={Outline.PencilIcon}
                                          solid={Solid.PencilIcon}
                                          className="h-6 min-h-6 w-6 min-w-6 text-[var(--text-main)]"
                                          active={
                                            openChangeMenuId === change.id
                                          }
                                        />
                                      </button>
                                    </CustomTooltip>

                                    <MenuDropdownAnchor
                                      triggerRef={menuTriggerRef}
                                      isOpen={openChangeMenuId === change.id}
                                      onClose={() => {
                                        setOpenChangeMenuId(null);
                                        setPendingShiftId(null);
                                      }}
                                      addSpacing={8}
                                    >
                                      <div className="flex w-full flex-col gap-4">
                                        {dropdownShifts.map((item) => (
                                          <div
                                            key={item.id}
                                            onClick={() =>
                                              setPendingShiftId(item.id)
                                            }
                                            role="menuitemradio"
                                            aria-checked={
                                              pendingShiftId === item.id
                                            }
                                            className="group flex cursor-pointer items-center justify-between gap-4"
                                          >
                                            <Input
                                              type="radio"
                                              name={`shift-selection-${item.id}`}
                                              checked={
                                                (pendingShiftId ??
                                                  change.newShiftId) === item.id
                                              }
                                              label={item.label}
                                              readOnly
                                            />
                                          </div>
                                        ))}

                                        <div className="mt-4 flex flex-col gap-6">
                                          <Input
                                            type="date"
                                            value={editChangeDate}
                                            onChange={(v) =>
                                              setEditChangeDate(String(v))
                                            }
                                            label={t("Common/Date")}
                                            onModal
                                            required
                                          />
                                          <Input
                                            type="time"
                                            value={editChangeTime}
                                            onChange={(v) =>
                                              setEditChangeTime(String(v))
                                            }
                                            label={t("Common/Time")}
                                            onModal
                                            required
                                          />
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 gap-4">
                                        <button
                                          className={`${buttonPrimaryClass} !min-h-[32px] w-full rounded-full`}
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            await handleEditShiftChange(
                                              change,
                                              {
                                                date: editChangeDate,
                                                time: editChangeTime,
                                                usePendingShift: true,
                                              },
                                            );
                                            // setPendingShiftDate(editChangeDate);
                                            // setPendingShiftTime(editChangeTime);
                                            setOpenChangeMenuId(null);
                                          }}
                                          disabled={
                                            !props.isReporter ||
                                            !editChangeDate ||
                                            !editChangeTime
                                          }
                                        >
                                          {t("Unit/Update post")}
                                        </button>
                                        <button
                                          className={`${buttonDeletePrimaryClass} !min-h-[32px] w-full rounded-full`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenChangeMenuId(null);
                                            toggleDeleteItemModal(
                                              String(change.id),
                                              "shiftChange",
                                            );
                                          }}
                                          disabled={!props.isReporter}
                                        >
                                          {t("Unit/Remove post")}
                                        </button>{" "}
                                      </div>
                                    </MenuDropdownAnchor>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}

                          {isExpanded && (
                            <tr
                              className={`${hour === 23 ? "border-b-0" : ""} ${hour % 2 === 0 ? "bg-[var(--bg-grid)]" : "bg-[var(--bg-grid-zebra)]"} border-y-1 border-y-[var(--border-secondary)]`}
                            >
                              <td
                                colSpan={
                                  unitColumnNames.length + compareColsCount + 4
                                }
                              >
                                <div className="flex flex-col gap-4 p-4">
                                  <CustomTooltip
                                    content={`${!props.isReporter ? t("Common/No access") : t("Unit/Tooltip report disruptions") + t("Unit/Tooltip this hour")}`}
                                    veryLongDelay={props.isReporter == true}
                                  >
                                    <button
                                      className={`${iconButtonPrimaryClass} ml-auto flex items-center justify-center gap-2`}
                                      onClick={() => {
                                        const startDate = new Date(
                                          `${selectedDate}T${hour.toString().padStart(2, "0")}:00:00`,
                                        );

                                        toggleReportModal(
                                          undefined,
                                          startDate.getHours(),
                                          toLocalDateString(startDate),
                                        );
                                      }}
                                      disabled={!props.isReporter}
                                    >
                                      <HoverIcon
                                        outline={Outline.PlusIcon}
                                        solid={Solid.PlusIcon}
                                        className="h-6 min-h-6 w-6 min-w-6"
                                      />
                                    </button>
                                  </CustomTooltip>
                                  {(() => {
                                    const hourReports = reports.filter(
                                      (report) => {
                                        if (!report.startTime) {
                                          return false;
                                        }

                                        const dayStart = new Date(
                                          `${selectedDate}T00:00:00`,
                                        );
                                        const dayEnd = new Date(dayStart);
                                        dayEnd.setDate(dayEnd.getDate() + 1);

                                        const start = new Date(
                                          report.startTime,
                                        );
                                        const stop = report.stopTime
                                          ? new Date(report.stopTime)
                                          : dayEnd;

                                        if (
                                          stop <= dayStart ||
                                          start >= dayEnd
                                        ) {
                                          return false;
                                        }

                                        const hourStart = new Date(dayStart);
                                        hourStart.setHours(hour, 0, 0, 0);

                                        const hourEnd = new Date(dayStart);
                                        hourEnd.setHours(hour + 1, 0, 0, 0);

                                        return (
                                          start < hourEnd && stop > hourStart
                                        );
                                      },
                                    );

                                    return hourReports.map((report, index) => (
                                      <div
                                        key={`${report.id ?? "temp"}-${report.startTime ?? "unknown"}-${index}`}
                                        className="relative flex flex-col gap-4 rounded bg-[var(--bg-modal)] p-4"
                                      >
                                        {report.categoryName && (
                                          <div className="flex justify-between gap-4">
                                            <div className="mb-2 flex flex-col">
                                              <div className="font-bold">
                                                {report.categoryName}
                                              </div>

                                              {report.subCategoryName && (
                                                <div className="text-sm text-[var(--text-secondary)]">
                                                  <>{report.subCategoryName}</>
                                                </div>
                                              )}
                                            </div>

                                            {report.categoryId && (
                                              <div className="flex gap-2">
                                                <CustomTooltip
                                                  content={`${!props.isReporter ? t("Common/No access") : t("Unit/Edit disruption")}`}
                                                  veryLongDelay={
                                                    props.isReporter == true
                                                  }
                                                >
                                                  <button
                                                    type="button"
                                                    className={`${iconButtonPrimaryClass} group`}
                                                    onClick={() => {
                                                      const startDate =
                                                        new Date(
                                                          report.startTime,
                                                        );

                                                      toggleReportModal(
                                                        report.id,
                                                        startDate.getHours(),
                                                        toLocalDateString(
                                                          startDate,
                                                        ),
                                                      );
                                                    }}
                                                    disabled={!props.isReporter}
                                                  >
                                                    <HoverIcon
                                                      outline={
                                                        Outline.PencilSquareIcon
                                                      }
                                                      solid={
                                                        Solid.PencilSquareIcon
                                                      }
                                                      className="h-6 min-h-6 w-6 min-w-6"
                                                    />
                                                  </button>
                                                </CustomTooltip>

                                                <CustomTooltip
                                                  content={`${!props.isReporter ? t("Common/No access") : t("Unit/Delete disruption")}`}
                                                  veryLongDelay={
                                                    props.isReporter == true
                                                  }
                                                >
                                                  <button
                                                    type="button"
                                                    className={`${iconButtonPrimaryClass} group`}
                                                    onClick={() =>
                                                      toggleDeleteItemModal(
                                                        report.id,
                                                      )
                                                    }
                                                    disabled={!props.isReporter}
                                                  >
                                                    <HoverIcon
                                                      outline={
                                                        Outline.TrashIcon
                                                      }
                                                      solid={Solid.TrashIcon}
                                                      className="h-6 min-h-6 w-6 min-w-6"
                                                    />
                                                  </button>
                                                </CustomTooltip>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        <div className="flex justify-between gap-2">
                                          <div className="text-sm text-[var(--text-secondary)]">
                                            {report.stopTime ? (
                                              (() => {
                                                const start = new Date(
                                                  report.startTime,
                                                );
                                                const stop = new Date(
                                                  report.stopTime,
                                                );
                                                const diffMs =
                                                  stop.getTime() -
                                                  start.getTime();
                                                const totalMinutes = Math.floor(
                                                  diffMs / (1000 * 60),
                                                );
                                                const diffDays = Math.floor(
                                                  totalMinutes / (60 * 24),
                                                );
                                                const diffHours = Math.floor(
                                                  (totalMinutes % (60 * 24)) /
                                                    60,
                                                );
                                                const diffMinutes =
                                                  totalMinutes % 60;

                                                const parts: string[] = [];
                                                if (diffDays > 0)
                                                  parts.push(
                                                    `${diffDays} ${diffDays === 1 ? t("Common/day") : t("Common/days")}`,
                                                  );
                                                if (diffHours > 0)
                                                  parts.push(
                                                    `${diffHours} ${diffHours === 1 ? t("Common/hour") : t("Common/hours")}`,
                                                  );
                                                if (
                                                  diffMinutes > 0 ||
                                                  parts.length === 0
                                                )
                                                  parts.push(
                                                    `${diffMinutes} ${diffMinutes === 1 ? t("Common/minute") : t("Common/minutes")}`,
                                                  );

                                                const duration =
                                                  parts.join(" ");

                                                return (
                                                  <>
                                                    {report.startTime
                                                      ?.slice(0, 16)
                                                      .replace("T", " ")}{" "}
                                                    -{" "}
                                                    {report.stopTime
                                                      ?.slice(0, 16)
                                                      .replace("T", " ")}{" "}
                                                    <br />
                                                    <span className="italic">
                                                      ({duration})
                                                    </span>
                                                  </>
                                                );
                                              })()
                                            ) : (
                                              <>
                                                {report.startTime
                                                  ?.slice(0, 16)
                                                  .replace("T", " ")}{" "}
                                                -{" "}
                                                <span className="font-semibold text-[var(--note-error)]">
                                                  {t("Unit/ongoing")}
                                                </span>
                                              </>
                                            )}
                                          </div>

                                          {!report.categoryId && (
                                            <div className="flex gap-2">
                                              <CustomTooltip
                                                content={`${!props.isReporter ? t("Common/No access") : t("Unit/Edit disruption")}`}
                                                veryLongDelay={
                                                  props.isReporter == true
                                                }
                                              >
                                                <button
                                                  type="button"
                                                  className={`${iconButtonPrimaryClass} group`}
                                                  onClick={() => {
                                                    const startDate = new Date(
                                                      report.startTime,
                                                    );

                                                    toggleReportModal(
                                                      report.id,
                                                      startDate.getHours(),
                                                      toLocalDateString(
                                                        startDate,
                                                      ),
                                                    );
                                                  }}
                                                  disabled={!props.isReporter}
                                                >
                                                  <HoverIcon
                                                    outline={
                                                      Outline.PencilSquareIcon
                                                    }
                                                    solid={
                                                      Solid.PencilSquareIcon
                                                    }
                                                    className="h-6 min-h-6 w-6 min-w-6"
                                                  />
                                                </button>
                                              </CustomTooltip>

                                              <CustomTooltip
                                                content={`${!props.isReporter ? t("Common/No access") : t("Unit/Delete disruption")}`}
                                                veryLongDelay={
                                                  props.isReporter == true
                                                }
                                              >
                                                <button
                                                  type="button"
                                                  className={`${iconButtonPrimaryClass} group`}
                                                  onClick={() =>
                                                    toggleDeleteItemModal(
                                                      report.id,
                                                    )
                                                  }
                                                  disabled={!props.isReporter}
                                                >
                                                  <HoverIcon
                                                    outline={Outline.TrashIcon}
                                                    solid={Solid.TrashIcon}
                                                    className="h-6 min-h-6 w-6 min-w-6"
                                                  />
                                                </button>
                                              </CustomTooltip>
                                            </div>
                                          )}
                                        </div>
                                        <div
                                          className="text-sm break-all"
                                          dangerouslySetInnerHTML={{
                                            __html: report.content,
                                          }}
                                        />

                                        <div className="mt-8 flex justify-end text-sm text-[var(--text-secondary)]">
                                          <div className="flex flex-col text-right">
                                            {report.creationDate && (
                                              <div>
                                                <span className="font-semibold">
                                                  {t("Common/Created")}
                                                </span>{" "}
                                                {utcIsoToLocalDateTime(
                                                  report.creationDate,
                                                )}{" "}
                                                {t("Common/by")}{" "}
                                                {report.createdBy}
                                              </div>
                                            )}
                                            {report.updateDate && (
                                              <div>
                                                <span className="font-semibold">
                                                  {t("Common/Updated")}
                                                </span>{" "}
                                                {utcIsoToLocalDateTime(
                                                  report.updateDate,
                                                )}{" "}
                                                {t("Common/by")}{" "}
                                                {report.updatedBy}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ));
                                  })()}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </>
                )}
              </tbody>
            </table>
          </div>
          <CustomTooltip content={t("Unit/Scroll to top")} veryLongDelay>
            <button
              className={`${buttonSecondaryClass} ml-auto`}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label={t("Unit/Scroll to top")}
            >
              <ChevronUpIcon className="min-h-full min-w-full" />
            </button>
          </CustomTooltip>
        </div>
      </>
    );
  }
};

export default UnitClient;
