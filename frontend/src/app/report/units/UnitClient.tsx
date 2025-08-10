"use client";

import { useEffect, useRef, useState } from "react";
import {
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
import {
  DocumentTextIcon as OutlineDocumentTextIcon,
  ExclamationTriangleIcon as OutlineExclamationTriangleIcon,
  PencilSquareIcon as OutlinePencilSquareIcon,
  TrashIcon as OutlineTrashIcon,
  PlusIcon as OutlinePlusIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
  DocumentTextIcon as SolidDocumentTextIcon,
  ExclamationTriangleIcon as SolidExclamationTriangleIcon,
  PencilSquareIcon as SolidPencilSquareIcon,
  TrashIcon as SolidTrashIcon,
  PlusIcon as SolidPlusIcon,
} from "@heroicons/react/24/solid";
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
import MenuDropdown from "@/app/components/common/MenuDropdown";

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
};

// --- CLASSES ---
export const thClass =
  "px-4 py-2 h-[40px] text-left border-b-1 border-b-[var(--border-main)] border-r-1 border-r-[var(--border-secondary)] flex-inline items-center justify-center";

export const tdClass =
  "px-4 py-2 h-[40px] text-left break-all border-1 border-[var(--border-secondary)] flex-inline items-center justify-center";

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

  // --- States: Shift ---
  const [shiftsOpen, setShiftsOpen] = useState(false);
  const [shiftNames, setShiftNames] = useState<Shift[]>([]);
  const [shiftVisibility, setShiftVisibility] = useState<
    Record<number, boolean>
  >({});
  const shifts = shiftNames.map((s) => ({
    id: s.id,
    label: s.systemKey ? t(`Shift/${s.systemKey}`) : s.name,
    show: !!shiftVisibility[s.id],
  }));
  const selectedShifts = shiftNames.filter((s) => shiftVisibility[s.id]);

  // --- States: Unit ---
  const [unitName, setUnitName] = useState("");
  const [unitGroupId, setUnitGroupId] = useState("");
  const [isHidden, setIsHidden] = useState(false);
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [activeShiftId, setActiveShiftId] = useState<number | null>(null);
  const [pendingShiftId, setPendingShiftId] = useState<number | null>(null);

  // --- States: UnitGroup ---
  const [unitGroupName, setUnitGroupName] = useState("");

  // --- States: UnitColumn ---
  const [unitColumnIds, setUnitColumnIds] = useState<number[]>([]);
  const [unitColumnNames, setUnitColumnNames] = useState<string[]>([]);
  const [unitColumnDataTypes, setUnitColumnDataTypes] = useState<string[]>([]);

  // --- States: UnitCell & Report ---
  const [unitCells, setUnitCells] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  // --- States: This ---
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [allExpanded, setAllExpanded] = useState(false);

  const [isUnitCellModalOpen, setIsUnitCellModalOpen] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportId, setReportId] = useState<string | undefined>();

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

  const isBootstrapping = isLoadingUnits || isLoadingColumns || isLoadingShifts;
  const canShowLock = !isBootstrapping && isHidden && !isInvalid;
  const canShowInvalid = !isBootstrapping && isInvalid && !isHidden;
  const isReady = !isBootstrapping && !isHidden && !isInvalid;

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
      setPendingShiftId(result.activeShiftId ?? null);
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
        const response = await fetch(`${apiUrl}/shift/unit/${unitId}`, {
          headers: {
            "X-User-Language": localStorage.getItem("language") || "sv",
            "Content-Type": "application/json",
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
      } finally {
        setIsLoadingShifts(false);
      }
    };

    const fillShiftData = (result: any) => {
      const list = Array.isArray(result)
        ? result
        : (result?.items ?? result?.data ?? []);
      const shiftsWithIds = list.map((c: any) => ({
        id: c.id,
        name: String(c.name),
        systemKey: c.systemKey ?? null,
      }));
      setShiftNames(shiftsWithIds);

      setShiftNames(shiftsWithIds);
      if (pendingShiftId == null && shiftsWithIds[0]) {
        setPendingShiftId(shiftsWithIds[0].id);
      }
    };

    fetchShifts();
  }, [unitId, isUnitValid]);

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
        t("ReportModal/Disruption report") + t("Manage/deleted"),
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
  const toggleDeleteItemModal = (id?: string) => {
    setDeletingItemId(id);
    setIsDeleteModalOpen((prev) => !prev);
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
    setSelectedDate(newDate);
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

      const response = await fetch(`${apiUrl}/unit/${unitId}/active-shift`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-User-Language": localStorage.getItem("language") || "sv",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          activeShiftId: pendingShiftId,
        }),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      if (response.status === 204) {
        const s = shiftNames.find((x) => x.id === pendingShiftId);
        const key = s?.systemKey ? `Shift/${String(s.systemKey).trim()}` : null;
        const label = key
          ? t(key) !== key
            ? t(key)
            : (s?.name ?? "")
          : (s?.name ?? "");
        notify("info", `${t("Unit/Shift changed")} ${label}`);
        setActiveShiftId(pendingShiftId);
        setShiftsOpen(false);
        setRefetchData(true);
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
          onClose={() => {
            toggleDeleteItemModal();
            setDeletingItemId("");
          }}
          onConfirm={() => {
            deleteReport(String(deletingItemId));
            setReports((prev) => prev.filter((r) => r.id !== deletingItemId));
            toggleDeleteItemModal();
          }}
        />

        {/* --- CONTENT --- */}
        <div className="flex flex-col gap-4">
          <div className="flex w-full flex-wrap gap-4">
            <div className="flex gap-4">
              {/* --- Report data top --- */}
              <CustomTooltip
                content={`${!props.isReporter ? t("Common/No access") : unitColumnNames.length > 0 ? t("Unit/Report data") : t("Unit/No columns")}`}
                lgHidden={
                  unitColumnNames.length > 0 && props.isReporter === true
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
                      outline={OutlineDocumentTextIcon}
                      solid={SolidDocumentTextIcon}
                      className="h-6 min-h-6 w-6 min-w-6"
                    />
                    <span className="hidden lg:block">
                      {t("Unit/Report data")}
                    </span>
                  </div>
                </button>
              </CustomTooltip>

              <CustomTooltip
                content={`${!props.isReporter ? t("Common/No access") : t("Unit/Report disruptions")}`}
                lgHidden={props.isReporter === true}
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
                      outline={OutlineExclamationTriangleIcon}
                      solid={SolidExclamationTriangleIcon}
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
                  <ArrowPathIcon
                    className={`${refetchData && isManualRefresh ? "motion-safe:animate-[spin_1s_linear_infinite]" : ""} min-h-full min-w-full`}
                  />
                </button>
              </CustomTooltip>
              <div className="flex">
                <button
                  className={`${buttonSecondaryClass} rounded-r-none`}
                  onClick={goToPreviousDay}
                  aria-label={t("Unit/Previous day")}
                >
                  <ChevronLeftIcon className="min-h-full min-w-full" />
                </button>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(val) => {
                    updateDate(String(val));
                  }}
                  notRounded
                />
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

          <div className="relative ml-auto flex items-center gap-4">
            <CustomTooltip
              content={`${!props.isReporter ? t("Common/No access") : ""}`}
            >
              <button
                ref={shiftsRef}
                className={`${roundedButtonClass} ${!props.isReporter ? "!cursor-not-allowed opacity-50" : ""} group w-auto gap-2 px-4`}
                onClick={() => {
                  setPendingShiftId(activeShiftId);
                  setShiftsOpen((prev) => !prev);
                }}
                aria-haspopup="menu"
                aria-expanded={shiftsOpen}
                disabled={!props.isReporter}
              >
                <span
                  className={`${shiftsClass} ${shiftsOpen ? "text-[var(--accent-color)]" : ""}`}
                >
                  {activeShiftId != null
                    ? (() => {
                        const shift = shiftNames.find(
                          (s) => s.id === activeShiftId,
                        );
                        if (!shift) return "";

                        if (shift.systemKey) {
                          const key = `Shift/${shift.systemKey}`;
                          const tr = t(key);
                          return tr !== key ? tr : shift.name;
                        }

                        return shift.name;
                      })()
                    : ""}
                </span>
                <ChevronDownIcon
                  className={`${shiftsIconClass} ${shiftsOpen ? "rotate-180 text-[var(--accent-color)]" : ""}`}
                />
              </button>
            </CustomTooltip>

            <MenuDropdown
              triggerRef={shiftsRef}
              isOpen={shiftsOpen}
              onClose={() => setShiftsOpen(false)}
            >
              <div className="flex w-full flex-col gap-4">
                {shifts.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setPendingShiftId(item.id)}
                    role="menuitemradio"
                    aria-checked={pendingShiftId === item.id}
                    className="group flex cursor-pointer items-center justify-between gap-4"
                  >
                    <Input
                      type="radio"
                      name="shift-selection"
                      checked={pendingShiftId === item.id}
                      label={item.label}
                      readOnly
                    />
                  </div>
                ))}
                <button
                  className={`${buttonPrimaryClass} !min-h-[32px] w-full rounded-full`}
                  onClick={changeShift}
                  disabled={
                    activeShiftId != null &&
                    pendingShiftId != null &&
                    pendingShiftId === activeShiftId
                  }
                >
                  {t("Unit/Change to shift")}
                </button>
              </div>
            </MenuDropdown>
          </div>

          <div className="w-full overflow-x-auto rounded border-1 border-[var(--border-main)]">
            <table className="w-full max-w-full min-w-fit border-collapse overflow-x-auto">
              <thead className="bg-[var(--bg-grid-header)]">
                {refetchData ? (
                  <tr>
                    <th
                      colSpan={unitColumnNames.length + 3}
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
                      {t("Unit/Time")}
                    </th>
                    <th
                      className={`${thClass} ${unitColumnNames.length > 0 ? "w-0" : ""} whitespace-nowrap`}
                    >
                      {t("Unit/Disruptions")}
                    </th>

                    {unitColumnNames.map((col, i) => (
                      <th key={i} className={`${thClass}`}>
                        {col}
                      </th>
                    ))}
                  </tr>
                )}
              </thead>
              <tbody>
                {refetchData ? (
                  <tr>
                    {/* 960px = h-[tdClass] * 24 */}
                    <td
                      colSpan={unitColumnNames.length + 3}
                      className={`${tdClass} h-[960px]`}
                    >
                      <Message icon="loading" content="content" />
                    </td>
                  </tr>
                ) : (
                  <>
                    {Array.from({ length: 24 }, (_, hour) => {
                      const isExpanded = expandedRows.includes(hour);
                      return (
                        <React.Fragment key={hour}>
                          <tr
                            role="button"
                            onClick={() => toggleRow(hour)}
                            aria-label="Öppna/stäng"
                            className={`${hour % 2 === 0 ? "bg-[var(--bg-grid)]" : "bg-[var(--bg-grid-zebra)]"} group/row cursor-pointer transition-[background] duration-[var(--fast)] hover:bg-[var(--bg-grid-header-hover)]`}
                          >
                            {/* --- Standard <td>s --- */}
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
                            <td
                              className={`${tdClass} ${hour === 23 ? "border-b-0" : ""} ${hour % 2 === 0 ? "bg-[var(--bg-grid)] group-hover/row:bg-[var(--bg-grid-header-hover)]" : "bg-[var(--bg-grid-zebra)] group-hover/row:bg-[var(--bg-grid-header-hover)]"} sticky left-[52.5px] w-[72px] whitespace-nowrap transition-[background] duration-[var(--fast)]`}
                            >
                              {hour.toString().padStart(2, "0")}:00
                            </td>
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
                                      >
                                        <span className="ml-1 text-[var(--note-error)]">
                                          &#x26A0;
                                        </span>
                                      </CustomTooltip>
                                    )}
                                  </>
                                );
                              })()}
                            </td>
                            {unitColumnNames.map((_, colIdx) => {
                              const columnName = unitColumnNames[colIdx];
                              const dataType = unitColumnDataTypes[colIdx];

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

                              return (
                                <td
                                  key={`collapsed-${hour}-${colIdx}`}
                                  className={`${tdClass} ${hour === 23 ? "border-b-0" : ""} ${colIdx === unitColumnNames.length - 1 ? "border-r-0" : ""} group/cell min-w-48`}
                                >
                                  <div className="flex gap-4">
                                    {displayValue}

                                    <CustomTooltip
                                      content={`${!props.isReporter ? t("Common/No access") : unitColumnNames.length > 0 ? t("Unit/Report data") : t("Unit/No columns")}`}
                                      lgHidden={
                                        unitColumnNames.length > 0 &&
                                        props.isReporter === true
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
                                          outline={OutlinePencilSquareIcon}
                                          solid={SolidPencilSquareIcon}
                                          className="h-6 min-h-6 w-6 min-w-6"
                                        />
                                      </button>
                                    </CustomTooltip>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>

                          {isExpanded && (
                            <tr
                              className={`${hour === 23 ? "border-b-0" : ""} ${hour % 2 === 0 ? "bg-[var(--bg-grid)]" : "bg-[var(--bg-grid-zebra)]"} border-y-1 border-y-[var(--border-secondary)]`}
                            >
                              <td colSpan={unitColumnNames.length + 3}>
                                <div className="flex flex-col gap-4 p-4">
                                  <CustomTooltip
                                    content={`${!props.isReporter ? t("Common/No access") : t("Unit/Report disruptions")}`}
                                    lgHidden={props.isReporter === true}
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
                                        outline={OutlinePlusIcon}
                                        solid={SolidPlusIcon}
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
                                                  lgHidden={
                                                    props.isReporter === true
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
                                                        OutlinePencilSquareIcon
                                                      }
                                                      solid={
                                                        SolidPencilSquareIcon
                                                      }
                                                      className="h-6 min-h-6 w-6 min-w-6"
                                                    />
                                                  </button>
                                                </CustomTooltip>

                                                <CustomTooltip
                                                  content={`${!props.isReporter ? t("Common/No access") : t("Unit/Delete disruption")}`}
                                                  lgHidden={
                                                    props.isReporter === true
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
                                                      outline={OutlineTrashIcon}
                                                      solid={SolidTrashIcon}
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
                                                lgHidden={
                                                  props.isReporter === true
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
                                                      OutlinePencilSquareIcon
                                                    }
                                                    solid={
                                                      SolidPencilSquareIcon
                                                    }
                                                    className="h-6 min-h-6 w-6 min-w-6"
                                                  />
                                                </button>
                                              </CustomTooltip>

                                              <CustomTooltip
                                                content={`${!props.isReporter ? t("Common/No access") : t("Unit/Delete disruption")}`}
                                                lgHidden={
                                                  props.isReporter === true
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
                                                    outline={OutlineTrashIcon}
                                                    solid={SolidTrashIcon}
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

          <CustomTooltip content={t("Unit/Scroll to top")}>
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
