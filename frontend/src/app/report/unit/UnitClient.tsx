"use client";

import { useEffect, useState } from "react";
import {
  buttonSecondaryClass,
  iconButtonPrimaryClass,
} from "../../styles/buttonClasses";
import Message from "../../components/common/Message";
import CustomTooltip from "../../components/common/CustomTooltip";
import { useToast } from "../../components/toast/ToastProvider";
import { useParams, useSearchParams, useRouter } from "next/navigation";
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
  InformationCircleIcon as OutlineInformationCircleIcon,
} from "@heroicons/react/24/outline";
import {
  DocumentTextIcon as SolidDocumentTextIcon,
  ExclamationTriangleIcon as SolidExclamationTriangleIcon,
  PencilSquareIcon as SolidPencilSquareIcon,
  TrashIcon as SolidTrashIcon,
  InformationCircleIcon as SolidInformationCircleIcon,
} from "@heroicons/react/24/solid";
import HoverIcon from "@/app/components/common/HoverIcon";
import Input from "@/app/components/common/Input";
import ReportModal from "@/app/components/modals/report/ReportModal";
import { get } from "http";
import UnitCellModal from "@/app/components/modals/report/UnitCellModal";
import {
  toLocalDateString,
  utcIsoToLocalDateTime,
} from "@/app/helpers/timeUtils";
import DeleteModal from "@/app/components/modals/DeleteModal";

type Props = {
  isAuthReady: boolean | null;
  isLoggedIn: boolean | null;
  isConnected: boolean | null;
  isReporter: boolean | null;
};

// --- CLASSES ---
export const thClass =
  "px-4 py-2 h-[40px] text-left border-b-1 border-b-[var(--border-main)] border-r-1 border-r-[var(--border-secondary)] flex-inline items-center justify-center";

export const tdClass =
  "px-4 py-2 h-[40px] text-left break-all border-1 border-[var(--border-secondary)] flex-inline items-center justify-center";

const UnitClient = (props: Props) => {
  // --- VARIABLES ---
  // --- Other ---
  const params = useParams();
  const unitId = params?.id;
  const parsedUnitId = unitId ? Number(unitId) : undefined;

  const searchParams = useSearchParams();
  const router = useRouter();
  const dateParam = searchParams.get("date");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");
  const { notify } = useToast();

  // --- States: Unit ---
  const [unitName, setUnitName] = useState("");
  const [unitGroupId, setUnitGroupId] = useState("");
  const [isHidden, setIsHidden] = useState(false);
  const [unitCategoryIds, setUnitCategoryIds] = useState<number[]>([]);

  // --- States: UnitGroup ---
  const [unitGroupName, setUnitGroupName] = useState("");

  // --- States: UnitColumn ---
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
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingDate, setIsChangingDate] = useState(true);

  const [selectedDate, setSelectedDate] = useState(() => {
    return dateParam || new Date().toISOString().split("T")[0];
  });

  const [reportDate, setReportDate] = useState<string>("");
  const [reportHour, setReportHour] = useState<string>("");

  // --- BACKEND ---
  // --- Fetch unit ---
  useEffect(() => {
    const fetchUnit = async () => {
      try {
        const response = await fetch(`${apiUrl}/unit/fetch/${unitId}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (!response.ok) {
          notify("error", result.message);
        } else {
          fillUnitData(result);
        }
      } catch (err) {
        notify("error", String(err));
      }
    };

    const fillUnitData = (result: any) => {
      setUnitName(result.name ?? "");
      setUnitGroupId(String(result.unitGroupId ?? ""));
      setIsHidden(result.isHidden ?? false);
      setUnitCategoryIds(result.categoryIds ?? []);
    };

    if (unitId) {
      fetchUnit();
    }
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
              "Content-Type": "application/json",
            },
          },
        );

        const result = await response.json();

        if (!response.ok) {
          notify("error", result.message);
        } else {
          fillUnitGroupData(result);
        }
      } catch (err) {
        notify("error", String(err));
      } finally {
        setIsLoading(false);
      }
    };

    const fillUnitGroupData = (result: any) => {
      setUnitGroupName(result.name ?? "");
    };

    fetchUnitGroup();
  }, [unitGroupId]);

  // --- Fetch unit columns ---
  useEffect(() => {
    if (!unitId) {
      return;
    }

    const fetchUnitColumns = async () => {
      try {
        const response = await fetch(`${apiUrl}/unit-column/unit/${unitId}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (!response.ok) {
          notify("error", result.message);
        } else {
          fillUnitColumnData(result);
        }
      } catch (err) {
        notify("error", String(err));
      }
    };

    const fillUnitColumnData = (result: any) => {
      setUnitColumnNames(result.map((c: any) => c.name));
      setUnitColumnDataTypes(result.map((c: any) => c.dataType));
    };

    fetchUnitColumns();
  }, [unitId]);

  // --- Delete report ---
  const deleteReport = async (id: string) => {
    try {
      const response = await fetch(`${apiUrl}/report/delete/${id}`, {
        method: "DELETE",
        headers: {
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
        notify("error", result.message);
        return;
      }

      setReports((prev) => prev.filter((r) => r.id !== id));
      notify("success", "Störningsrapport raderad");
    } catch (err) {
      notify("error", String(err));
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

    const current = new URLSearchParams(searchParams.toString());
    current.set("date", newDate);

    router.replace(`?${current.toString()}`);
  };

  useEffect(() => {
    if (!unitId || !selectedDate || !refetchData) {
      return;
    }

    setIsChangingDate(true);

    const fetchCells = async () => {
      const response = await fetch(
        `${apiUrl}/unit-cell/${unitId}/${selectedDate}`,
        {
          headers: {
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
        notify("error", String(err));
      })
      .finally(() => {
        setRefetchData(false);
        setIsChangingDate(false);
      });

    fetchCells();
    fetchReports();
  }, [unitId, selectedDate, refetchData]);

  if (!isLoading && isHidden) {
    return <Message icon="lock" content="lock" fullscreen={true} />;
  } else if (!isLoading && !isHidden) {
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
          categoryIds={unitCategoryIds}
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
          isNestedModal
        />

        {/* --- CONTENT --- */}
        <div className="flex flex-col gap-4">
          <div className="flex w-full flex-wrap gap-4">
            <div className="flex gap-4">
              {/* --- Report data top --- */}
              <CustomTooltip
                content={`${!props.isReporter ? "Du saknar behörighet!" : unitColumnNames.length > 0 ? "Rapportera data" : "Det finns ingen kolumner att rapportera någon data i"}`}
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
                    <span className="hidden lg:block">Rapportera data</span>
                  </div>
                </button>
              </CustomTooltip>

              <CustomTooltip
                content={`${!props.isReporter ? "Du saknar behörighet!" : "Rapportera störningar"}`}
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
                      Rapportera störningar
                    </span>
                  </div>
                </button>
              </CustomTooltip>
            </div>

            <div className="ml-auto flex max-w-max items-center">
              <button
                className={`${buttonSecondaryClass} rounded-r-none`}
                onClick={goToPreviousDay}
                aria-label="Föregående dag"
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
                aria-label="Nästa dag"
              >
                <ChevronRightIcon className="min-h-full min-w-full" />
              </button>
            </div>
          </div>

          <div className="w-full overflow-x-auto rounded border-1 border-[var(--border-main)]">
            <table className="w-full max-w-full min-w-fit border-collapse overflow-x-auto">
              <thead className="bg-[var(--bg-grid-header)]">
                {isChangingDate ? (
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
                      aria-label="Öppna/stäng alla"
                    >
                      <div className={iconButtonPrimaryClass}>
                        {allExpanded ? <ChevronDownIcon /> : <ChevronUpIcon />}
                      </div>
                    </th>
                    <th
                      className={`${thClass} sticky left-[52.5px] w-[72px] bg-[var(--bg-grid-header)] whitespace-nowrap`}
                    >
                      Tid
                    </th>
                    <th
                      className={`${thClass} ${unitColumnNames.length > 0 ? "w-0" : ""} whitespace-nowrap`}
                    >
                      Störningar
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
                {isChangingDate ? (
                  <tr>
                    {/* 960px = h-[tdClass] * 24 */}
                    <td
                      colSpan={unitColumnNames.length + 3}
                      className={`${tdClass} h-[960px]`}
                    >
                      <Message icon="loading" content="loading" />
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
                                      <CustomTooltip content="Pågående störning">
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
                                    ? "Ja"
                                    : cell?.value === "false"
                                      ? "Nej"
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
                                      content={`${!props.isReporter ? "Du saknar behörighet!" : unitColumnNames.length > 0 ? "Rapportera data" : "Det finns ingen kolumner att rapportera någon data i"}`}
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

                                    if (hourReports.length === 0) {
                                      return (
                                        <div className="text-sm text-[var(--text-secondary)]">
                                          Inga störningar rapporterade
                                        </div>
                                      );
                                    }

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

                                            {props.isReporter && (
                                              <div className="flex gap-2">
                                                <button
                                                  type="button"
                                                  className={`${iconButtonPrimaryClass}`}
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
                                                <button
                                                  type="button"
                                                  className={`${iconButtonPrimaryClass}`}
                                                  onClick={() =>
                                                    toggleDeleteItemModal(
                                                      report.id,
                                                    )
                                                  }
                                                >
                                                  <HoverIcon
                                                    outline={OutlineTrashIcon}
                                                    solid={SolidTrashIcon}
                                                    className="h-6 min-h-6 w-6 min-w-6"
                                                  />
                                                </button>
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
                                                    `${diffDays} ${diffDays === 1 ? "dag" : "dagar"}`,
                                                  );
                                                if (diffHours > 0)
                                                  parts.push(
                                                    `${diffHours} ${diffHours === 1 ? "timme" : "timmar"}`,
                                                  );
                                                if (
                                                  diffMinutes > 0 ||
                                                  parts.length === 0
                                                )
                                                  parts.push(
                                                    `${diffMinutes} ${diffMinutes === 1 ? "minut" : "minuter"}`,
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
                                                  pågående
                                                </span>
                                              </>
                                            )}
                                          </div>

                                          {!report.categoryId &&
                                            props.isReporter && (
                                              <div className="flex gap-2">
                                                <button
                                                  type="button"
                                                  className={`${iconButtonPrimaryClass}`}
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
                                                <button
                                                  type="button"
                                                  className={`${iconButtonPrimaryClass}`}
                                                  onClick={() =>
                                                    toggleDeleteItemModal(
                                                      report.id,
                                                    )
                                                  }
                                                >
                                                  <HoverIcon
                                                    outline={OutlineTrashIcon}
                                                    solid={SolidTrashIcon}
                                                    className="h-6 min-h-6 w-6 min-w-6"
                                                  />
                                                </button>
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
                                                  Skapad:
                                                </span>{" "}
                                                {utcIsoToLocalDateTime(
                                                  report.creationDate,
                                                )}{" "}
                                                av {report.createdBy}
                                              </div>
                                            )}
                                            {report.updateDate && (
                                              <div>
                                               <span className="font-semibold">
                                                  Uppdaterad:
                                                </span>{" "}
                                                {utcIsoToLocalDateTime(
                                                  report.updateDate,
                                                )}{" "}
                                                av {report.updatedBy}
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

          <div className="flex w-full flex-wrap gap-4">
            <div className="ml-auto flex max-w-max items-center">
              <button
                className={`${buttonSecondaryClass} rounded-r-none`}
                onClick={goToPreviousDay}
                aria-label="Föregående dag"
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
                aria-label="Nästa dag"
              >
                <ChevronRightIcon className="min-h-full min-w-full" />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }
};

export default UnitClient;
