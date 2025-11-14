import { useTranslations } from "next-intl";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useToast } from "../components/toast/ToastProvider";
import { toLocalDateString } from "../helpers/timeUtils";
import useTheme from "./useTheme";

// --- CLASSES ---
export const thClass =
  "px-4 py-2 h-[40px] text-left border-b-1 border-b-(--border-main) border-r-1 border-r-(--border-secondary) flex-inline items-center justify-center";

export const tdClass =
  "px-4 py-2 h-[40px] text-left break-all border border-(--border-secondary) flex-inline items-center justify-center";

export const tdClassSpecial =
  "px-4 py-2 h-[40px] text-left break-all flex-inline items-center justify-center";

export const shiftsClass =
  "truncate font-semibold transition-colors duration-(--fast) group-hover:text-(--accent-color)";

export const shiftsIconClass =
  "h-6 w-6 transition-[color,rotate] duration-(--fast) group-hover:text-(--accent-color)";

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
  lightColorHex: string;
  darkColorHex: string;
  reverseColor: boolean;
  lightTextColorHex: string;
  darkTextColorHex: string;
};

type ShiftChange = {
  id: number;
  hour: number;
  minute?: number;
  oldShiftId: number;
  newShiftId: number;
};

const useClient = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- Other ---
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
  const [unitColumnLargeColumnFlags, setUnitColumnLargeColumnFlags] = useState<
    boolean[]
  >([]);

  // --- States: UnitCell & Report ---
  const [unitCells, setUnitCells] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [editingCell, setEditingCell] = useState<{
    hour: number;
    columnId: number;
  } | null>(null);
  const [editingValue, setEditingValue] = useState<string | number | boolean>(
    "",
  );

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
  const [tempDate, setTempDate] = useState(selectedDate);

  const [reportDate, setReportDate] = useState<string>("");
  const [reportHour, setReportHour] = useState<string>("");

  const [pendingShiftDate, setPendingShiftDate] =
    useState<string>(selectedDate);
  const [pendingShiftTime, setPendingShiftTime] = useState<string>("");
  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  const isBootstrapping = isLoadingUnits || isLoadingColumns || isLoadingShifts;
  const canShowLock = !isBootstrapping && isHidden && !isInvalid;
  const canShowInvalid = !isBootstrapping && isInvalid && !isHidden;
  const isReady = !isHidden && !isInvalid;

  // --- Other ---
  const { currentTheme } = useTheme();

  // --- HELPERS ---
  const handleDateChange = (val: string) => {
    if (!val || val === selectedDate) {
      setTempDate(selectedDate);
      return;
    }

    const year = Number(val.split("-")[0]);
    if (year > 2999 || year < 1000) {
      setTempDate(selectedDate);
      return;
    }

    if (unitCreationDate && val < unitCreationDate) {
      setTempDate(unitCreationDate);
      setSelectedDate(unitCreationDate);
      updateDate(unitCreationDate);
    } else {
      setSelectedDate(val);
      updateDate(val);
    }
  };

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
      setUnitColumnLargeColumnFlags(
        result.map((c: any) => Boolean(c.largeColumn)),
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
          lightColorHex: ts.lightColorHex,
          darkColorHex: ts.darkColorHex,
          reverseColor: ts.reverseColor,
          lightTextColorHex: ts.lightTextColorHex,
          darkTextColorHex: ts.darkTextColorHex,
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

      notify("success", t("Unit/Shift change") + t("Modal/updated1"));
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
      notify("success", t("ReportModal/Event") + t("Manage/deleted1"));
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Save unit cell ---
  const saveInlineEdit = async () => {
    if (!editingCell) {
      return;
    }

    try {
      const { hour, columnId } = editingCell;
      const dataType = unitColumnDataTypes[unitColumnIds.indexOf(columnId)];

      const isEmpty =
        dataType === "Number" && (editingValue === "" || editingValue === null);

      const body = {
        unitId: parsedUnitId,
        date: selectedDate,
        hour,
        values: [
          {
            columnId,
            value:
              dataType === "Boolean"
                ? editingValue
                  ? "true"
                  : "false"
                : isEmpty
                  ? ""
                  : String(editingValue),
            intValue:
              dataType === "Number" && !isEmpty
                ? Number(editingValue)
                : undefined,
          },
        ],
      };

      const response = await fetch(`${apiUrl}/unit-cell/update-all/${unitId}`, {
        method: "PUT",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        notify("success", t("Common/Changes saved"));
        setEditingCell(null);
        setRefetchData(true);
      } else {
        const result = await response.json();
        notify("error", result?.message ?? t("Modal/Unknown error"));
      }
    } catch {
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
    if (unitCreationDate && newDate < unitCreationDate) {
      return;
    }

    setSelectedDate(newDate);
    setTempDate(newDate);
    setRefetchData(true);
    setExpandedRows([]);

    const current = new URLSearchParams(searchParams.toString());
    current.set("date", newDate);

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

  return {
    t,
    groupId,
    unitId,
    parsedGroupId,
    parsedUnitId,
    searchParams,
    router,
    shiftsRef,
    menuTriggerRef,
    shiftsOpen,
    setShiftsOpen,
    shiftNames,
    shiftOptions,
    currentActiveShiftId,
    setCurrentActiveShiftId,
    shiftVisibility,
    dropdownShifts,
    shiftChanges,
    setShiftChanges,
    openChangeMenuId,
    setOpenChangeMenuId,
    editChangeDate,
    setEditChangeDate,
    editChangeTime,
    setEditChangeTime,
    unitName,
    unitGroupId,
    isHidden,
    categoryIds,
    activeShiftId,
    pendingShiftId,
    setPendingShiftId,
    baseShiftId,
    unitCreationDate,
    unitGroupName,
    unitColumnIds,
    unitColumnNames,
    unitColumnDataTypes,
    unitColumnCompareFlags,
    unitColumnComparisonTexts,
    unitColumnLargeColumnFlags,
    unitCells,
    setUnitCells,
    reports,
    setReports,
    editingCell,
    setEditingCell,
    editingValue,
    setEditingValue,
    expandedRows,
    setExpandedRows,
    allExpanded,
    setAllExpanded,
    isUnitCellModalOpen,
    setIsUnitCellModalOpen,
    isReportModalOpen,
    setIsReportModalOpen,
    reportId,
    setReportId,
    deleteType,
    setDeleteType,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    deletingItemId,
    setDeletingItemId,
    refetchData,
    setRefetchData,
    isLoadingUnits,
    isLoadingColumns,
    isLoadingShifts,
    isManualRefresh,
    setIsManualRefresh,
    isInvalid,
    isUnitValid,
    selectedDate,
    setSelectedDate,
    tempDate,
    setTempDate,
    reportDate,
    setReportDate,
    reportHour,
    setReportHour,
    pendingShiftDate,
    setPendingShiftDate,
    pendingShiftTime,
    setPendingShiftTime,
    nowTs,
    setNowTs,
    isBootstrapping,
    canShowLock,
    canShowInvalid,
    isReady,
    currentTheme,
    handleDateChange,
    overlaps,
    toMinutes,
    getShiftLabel,
    getTeamSpanForHour,
    getSortedChanges,
    resolveShiftIdForTime,
    toHm,
    isSameDate,
    isCreationMidnight,
    getNumericCellValue,
    compareColsCount,
    fetchShiftChanges,
    updateShiftChange,
    handleEditShiftChange,
    deleteShiftChange,
    deleteReport,
    saveInlineEdit,
    toggleRow,
    toggleAllRows,
    toggleUnitCellModal,
    toggleReportModal,
    toggleDeleteItemModal,
    goToPreviousDay,
    goToNextDay,
    updateDate,
    changeShift,
    refreshUnitActive,
    tdClassSpecial,
  };
};

export default useClient;
