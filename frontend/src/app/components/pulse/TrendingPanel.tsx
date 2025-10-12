"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import SingleDropdown from "../common/SingleDropdown";
import Message from "../common/Message";
import { useTranslations } from "next-intl";
import CustomTooltip from "../common/CustomTooltip";
import HoverIcon from "../common/HoverIcon";
import * as Outline from "@heroicons/react/24/outline";
import * as Solid from "@heroicons/react/24/solid";
import {
  buttonDeletePrimaryClass,
  buttonPrimaryClass,
  iconButtonPrimaryClass,
} from "@/app/styles/buttonClasses";
import MenuDropdown from "../common/MenuDropdown/MenuDropdown";
import Input from "../common/Input";
import { get } from "http";
import { useToast } from "../toast/ToastProvider";
import { trendingPanelConstraints } from "@/app/helpers/inputConstraints";
import MultiDropdown from "../common/MultiDropdown";
import {
  LineChart,
  BarChart,
  PieChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
  Pie,
} from "recharts";

type UnitCellDto = {
  id: number;
  unitId: number;
  selectedUnitIds: number[];
  columnId: number;
  columnName: string;
  value?: string | null;
  intValue?: number | null;
  hour?: number | null;
  date: string;
};

type Aggregation = "Total" | "Average";

type ViewMode = "Value" | "LineChart" | "BarChart" | "PieChart";

type TrendingPeriod =
  | "AllTime"
  | "Today"
  | "Yesterday"
  | "Weekly"
  | "Monthly"
  | "Quarterly"
  | "Custom";

type Props = {
  id: number;
  title: string;
  type?: "Total" | "Average";
  period?: TrendingPeriod;
  viewMode?: ViewMode;
  unitIds?: number[];
  unitColumnId?: number | null;
  unitOptions: { value: string; label: string; creationDate: string }[];
  className?: string;
  onUpdated?: () => void;
  onDeleted?: () => void;
  customStartDate?: string | null;
  customEndDate?: string | null;
  colSpan?: number;
  onColSpanChange?: (colSpan: number) => void;
  showInfo?: boolean;
};

const parseDate = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, day ?? 1);
};

const formatSE = (d: Date) =>
  d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });

const todayStr = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const TrendingPanel: React.FC<Props> = ({
  id,
  title = "",
  type = "Total",
  period = "AllTime",
  viewMode = "Value",
  unitIds = [],
  unitColumnId = null,
  unitOptions,
  className = "",
  onUpdated,
  onDeleted,
  customStartDate,
  customEndDate,
  colSpan = 1,
  onColSpanChange,
  showInfo = true,
}) => {
  const t = useTranslations();

  // --- Variables ---
  // --- Refs ---
  const panelButtonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // --- States ---
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedUnitIds, setSelectedUnitIds] = useState<number[]>(
    unitIds ?? [],
  );

  const [days, setDays] = useState<TrendingPeriod>(period ?? "AllTime");
  const [aggregation, setAggregation] = useState<Aggregation>(type ?? "Total");
  const [selectedColumnId, setSelectedColumnId] = useState<number | "ALL">(
    unitColumnId ?? "ALL",
  );
  const [rows, setRows] = useState<UnitCellDto[]>([]);
  const [unitColumns, setUnitColumns] = useState<
    { id: number; name: string }[]
  >([]);
  const [panelName, setPanelName] = useState(title);
  const [isLoadingUnitCells, setIsLoadingUnitCells] = useState(false);
  const [panelColSpan, setPanelColSpan] = useState(colSpan);
  const [isResizing, setIsResizing] = useState(false);

  // --- States: Custom period ---
  const [customStart, setCustomStart] = useState<string | null>(null);
  const [customEnd, setCustomEnd] = useState<string | null>(null);

  // --- States: View mode ---
  const [panelViewMode, setPanelViewMode] = useState<ViewMode>(
    viewMode ?? "Value",
  );
  const graphColors = [
    "var(--graph-one)",
    "var(--graph-two)",
    "var(--graph-three)",
    "var(--graph-four)",
  ];
  const [hiddenUnits, setHiddenUnits] = useState<number[]>([]);

  const priority = [t("TrendingPanel/Total"), t("TrendingPanel/Average")];

  // --- Memos ---
  const unitCreationDate = useMemo(() => {
    if (!selectedUnitIds.length) {
      return null;
    }

    const selected = unitOptions.filter((o) =>
      selectedUnitIds.includes(Number(o.value)),
    );

    if (!selected.length) {
      return null;
    }

    return selected
      .map((o) => new Date(o.creationDate))
      .sort((a, b) => a.getTime() - b.getTime())[0];
  }, [selectedUnitIds, unitOptions]);

  const daysToBackMap: Record<TrendingPeriod, number | null> = {
    Today: 1,
    Yesterday: 1,
    Weekly: 7,
    Monthly: 30,
    Quarterly: 90,
    AllTime: null,
    Custom: null,
  };

  const start = useMemo(() => {
    const creation = unitCreationDate ? new Date(unitCreationDate) : null;

    if (days === "Today") {
      const d = new Date();
      return creation && creation > d
        ? creation.toISOString().slice(0, 10)
        : d.toISOString().slice(0, 10);
    }

    if (days === "Yesterday") {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return creation && creation > d
        ? creation.toISOString().slice(0, 10)
        : d.toISOString().slice(0, 10);
    }

    const back = daysToBackMap[days];

    if (back == null) {
      if (rows.length > 0) {
        const firstRow = rows.map((r) => r.date).sort()[0];
        const firstRowDate = new Date(firstRow);
        if (creation && creation > firstRowDate) {
          return creation.toISOString().slice(0, 10);
        }
        return firstRow;
      }
      return creation ? creation.toISOString().slice(0, 10) : undefined;
    }

    const d = new Date();
    d.setDate(d.getDate() - (back - 1));
    if (creation && creation > d) {
      return creation.toISOString().slice(0, 10);
    }
    return d.toISOString().slice(0, 10);
  }, [days, rows, unitCreationDate, selectedUnitIds]);

  const end = useMemo(() => {
    if (days === "Today") {
      const d = new Date();
      return d.toISOString().slice(0, 10);
    }

    if (days === "Yesterday") {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().slice(0, 10);
    }

    return todayStr();
  }, [days]);

  // --- Other ---
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");
  const { notify } = useToast();

  // --- BACKEND ---
  // --- Fetch unit columns ---
  useEffect(() => {
    if (!selectedUnitIds.length) {
      setUnitColumns([]);
      return;
    }

    const fetchUnitColumns = async () => {
      try {
        const allColumns: { id: number; name: string }[] = [];

        for (const unitId of selectedUnitIds) {
          const response = await fetch(`${apiUrl}/unit-column/unit/${unitId}`, {
            headers: {
              "X-User-Language": localStorage.getItem("language") || "sv",
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          const result = await response.json();

          if (response.ok && Array.isArray(result)) {
            const cols = result.map((c: any) => ({
              id: c.id ?? c.Id,
              name: c.name ?? c.Name,
            }));
            allColumns.push(...cols);
          }
        }

        const uniqueColumns = Array.from(
          new Map(allColumns.map((c) => [c.id, c])).values(),
        );

        setUnitColumns(uniqueColumns);
      } catch (err) {
        notify("error", t("Modal/Unknown error"));
      }
    };

    fetchUnitColumns();
  }, [selectedUnitIds]);

  // --- Fetch unit cells ---
  useEffect(() => {
    if (!selectedUnitIds.length) {
      setRows([]);
      return;
    }

    if (days === "Custom") {
      if (customStart && customEnd && customStart > customEnd) {
        setRows([]);
        return;
      }
    } else {
      if (start && end && start > end) {
        setRows([]);
        return;
      }
    }

    const fetchUnitCells = async () => {
      setIsLoadingUnitCells(true);

      try {
        const qs = new URLSearchParams();
        if (days === "Custom") {
          if (customStart) {
            qs.append("start", customStart);
          }

          if (customEnd) {
            qs.append("end", customEnd);
          }
        } else {
          if (days !== "AllTime" && start) {
            qs.append("start", start);
          }
          if (end) {
            qs.append("end", end);
          }
        }

        let allData: UnitCellDto[] = [];

        for (const unitId of selectedUnitIds) {
          const response = await fetch(
            `${apiUrl}/unit-cell/range/${unitId}?${qs.toString()}`,
            {
              headers: {
                "X-User-Language": localStorage.getItem("language") || "sv",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            },
          );

          const data: UnitCellDto[] = await response.json();

          if (!response.ok) {
            notify("error", t("Modal/Unknown error"));
          } else if (Array.isArray(data)) {
            allData.push(...data);
          }
        }

        setRows(allData);
      } catch (err) {
        notify("error", t("Modal/Unknown error"));
      } finally {
        setIsLoadingUnitCells(false);
      }
    };

    fetchUnitCells();
  }, [selectedUnitIds, days, start, end, customStart, customEnd]);

  // --- Update trending panel ---
  const updatePanel = async (updates: Partial<Props>) => {
    try {
      const body: any = {
        name: updates.title ?? panelName,
        type: updates.type ?? aggregation,
        period: updates.period ?? days,
        viewMode: updates.viewMode ?? viewMode,
        unitColumnId:
          updates.unitColumnId ??
          (selectedColumnId === "ALL" ? null : selectedColumnId),
        unitIds: updates.unitIds ?? selectedUnitIds,
        colSpan: updates.colSpan ?? panelColSpan,
        showInfo: updates.showInfo ?? showInfo,
      };

      const effectivePeriod = updates.period ?? days;
      if (effectivePeriod === "Custom") {
        body.customStartDate = updates.customStartDate ?? customStart;
        body.customEndDate = updates.customEndDate ?? customEnd;
      }

      const response = await fetch(`${apiUrl}/trending-panel/update/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-User-Language": localStorage.getItem("language") || "sv",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        notify("error", result?.message ?? t("Modal/Unknown error"));
        return;
      }

      if (body.customStartDate) {
        setCustomStart(body.customStartDate);
      }

      if (body.customEndDate) {
        setCustomEnd(body.customEndDate);
      }

      onUpdated?.();
    } catch {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Delete trending panel ---
  const deletePanel = async () => {
    try {
      const response = await fetch(`${apiUrl}/trending-panel/delete/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-User-Language": localStorage.getItem("language") || "sv",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        notify("error", result?.message ?? t("Modal/Unknown error"));
      } else {
        notify("info", result?.message);
        onDeleted?.();
      }
    } catch {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- SET CUSTOM PERIOD DEFAULT ---
  useEffect(() => {
    if (days === "Custom") {
      if (customStartDate && customEndDate) {
        setCustomStart(customStartDate.slice(0, 10));
        setCustomEnd(customEndDate.slice(0, 10));
      } else {
        const startDefault =
          unitCreationDate?.toISOString().slice(0, 10) ?? todayStr();
        const endDefault = todayStr();

        setCustomStart(startDefault);
        setCustomEnd(endDefault);

        updatePanel({
          period: "Custom",
          customStartDate: startDefault,
          customEndDate: endDefault,
        });
      }
    } else {
      setCustomStart(null);
      setCustomEnd(null);
    }
  }, [days, unitCreationDate, customStartDate, customEndDate]);

  // --- SET UNITS ---
  useEffect(() => {
    if (
      unitOptions.length &&
      !selectedUnitIds.some((id) =>
        unitOptions.some((o) => Number(o.value) === id),
      )
    ) {
      setSelectedUnitIds([Number(unitOptions[0].value)]);
    }
  }, [unitOptions, selectedUnitIds]);

  // --- SET SAVED PERIOD ---
  useEffect(() => {
    if (period) {
      setDays(period);
    }
  }, [period]);

  // --- TOGGLE/GET VIEW MODE ---
  const toggleViewMode = () => {
    const modes: ViewMode[] = ["Value", "LineChart", "BarChart", "PieChart"];
    const currentIndex = modes.indexOf(viewMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const next = modes[nextIndex];

    setPanelViewMode(next);
    updatePanel({ viewMode: next });
  };

  const getOutlineIcon = () => {
    switch (viewMode) {
      case "Value":
        return Outline.TableCellsIcon;
      case "LineChart":
        return Outline.PresentationChartLineIcon;
      case "BarChart":
        return Outline.ChartBarIcon;
      case "PieChart":
        return Outline.ChartPieIcon;
      default:
        return Outline.EllipsisHorizontalIcon;
    }
  };

  const getSolidIcon = () => {
    switch (viewMode) {
      case "Value":
        return Solid.TableCellsIcon;
      case "LineChart":
        return Solid.PresentationChartLineIcon;
      case "BarChart":
        return Solid.ChartBarIcon;
      case "PieChart":
        return Solid.ChartPieIcon;
      default:
        return Solid.EllipsisHorizontalIcon;
    }
  };

  // --- TOGGLE UNIT VISIBILITY ---
  const toggleUnitVisibility = (unitId: number) => {
    setHiddenUnits((prev) =>
      prev.includes(unitId)
        ? prev.filter((id) => id !== unitId)
        : [...prev, unitId],
    );
  };

  // --- HELPERS ---
  const daily = useMemo(() => {
    const filtered =
      selectedColumnId === "ALL"
        ? rows
        : rows.filter((r) => r.columnId === selectedColumnId);

    const map = new Map<string, Map<number, number[]>>();

    for (const r of filtered) {
      const v = r.intValue ?? (r.value ? Number(r.value) : NaN);
      if (Number.isNaN(v)) {
        continue;
      }

      if (!map.has(r.date)) {
        map.set(r.date, new Map());
      }

      const byUnit = map.get(r.date)!;
      if (!byUnit.has(r.unitId)) {
        byUnit.set(r.unitId, []);
      }

      byUnit.get(r.unitId)!.push(v);
    }

    const daysSorted = Array.from(map.keys()).sort();

    return daysSorted.map((d) => {
      const byUnit = map.get(d)!;
      const obj: Record<string, number | string> = { date: d };
      let all = 0;

      for (const u of selectedUnitIds) {
        const vals = byUnit.get(u) ?? [];
        const agg =
          aggregation === "Total"
            ? vals.reduce((a, b) => a + b, 0)
            : vals.length
              ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
              : 0;

        obj[String(u)] = agg;
        all += agg;
      }

      obj.ALL =
        aggregation === "Total"
          ? Array.from(byUnit.keys())
              .filter((u) => !hiddenUnits.includes(u))
              .reduce(
                (sum, u) =>
                  sum + (byUnit.get(u)?.reduce((a, b) => a + b, 0) || 0),
                0,
              )
          : (() => {
              const visible = Array.from(byUnit.keys()).filter(
                (u) => !hiddenUnits.includes(u),
              );
              if (!visible.length) return 0;
              const sum = visible.reduce(
                (s, u) => s + (byUnit.get(u)?.reduce((a, b) => a + b, 0) || 0),
                0,
              );
              return Math.round(sum / visible.length);
            })();

      return obj;
    });
  }, [rows, selectedColumnId, aggregation, selectedUnitIds, hiddenUnits]);

  const sortedUnits = [...selectedUnitIds]
    .map((id) => ({
      id,
      label:
        unitOptions.find((o) => Number(o.value) === id)?.label ?? `Unit ${id}`,
    }))
    .filter((u) => !!u.label)
    .sort((a, b) => a.label.localeCompare(b.label));

  // --- PANEL SIZE CYCLE ---
  const allowedSpans = [1, 2, 4];

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    let startX = e.clientX;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const threshold = 22;

      if (deltaX > threshold) {
        const idx = allowedSpans.indexOf(panelColSpan);
        if (idx < allowedSpans.length - 1) {
          const next = allowedSpans[idx + 1];
          setPanelColSpan(next);
          onColSpanChange?.(next);
          updatePanel({ colSpan: next });
          startX = moveEvent.clientX;
        }
      } else if (deltaX < -threshold) {
        const idx = allowedSpans.indexOf(panelColSpan);
        if (idx > 0) {
          const next = allowedSpans[idx - 1];
          setPanelColSpan(next);
          onColSpanChange?.(next);
          updatePanel({ colSpan: next });
          startX = moveEvent.clientX;
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div ref={panelRef} className={`${className} relative`}>
      <div className="relative flex h-[40px] items-center justify-between rounded-t border-1 border-[var(--border-main)] bg-[var(--bg-grid-header)] px-3 py-2">
        <span className="truncate font-semibold">{title}</span>
        <div className="flex items-center gap-2">
          {/* --- TOGGLE VIEW MODE --- */}
          <CustomTooltip
            content={
              panelViewMode === "Value"
                ? t("TrendingPanel/Change to line chart")
                : panelViewMode === "LineChart"
                  ? t("TrendingPanel/Change to bar chart")
                  : panelViewMode === "BarChart"
                    ? t("TrendingPanel/Change to pie chart")
                    : t("TrendingPanel/Change to value")
            }
            mediumDelay
          >
            <button
              type="button"
              className={`${iconButtonPrimaryClass} group`}
              onClick={() => {
                toggleViewMode();
              }}
            >
              <HoverIcon
                outline={getOutlineIcon()}
                solid={getSolidIcon()}
                className="h-6 min-h-6 w-6 min-w-6"
              />
            </button>
          </CustomTooltip>

          {/* --- SETTINGS --- */}
          <CustomTooltip content={t("TrendingPanel/Settings")} mediumDelay>
            <button
              ref={panelButtonRef}
              type="button"
              className={`${iconButtonPrimaryClass} group`}
              onClick={() => {
                setPanelOpen((prev) => !prev);
              }}
            >
              <HoverIcon
                outline={Outline.EllipsisHorizontalIcon}
                solid={Solid.EllipsisHorizontalIcon}
                className="h-6 min-h-6 w-6 min-w-6"
              />
            </button>
          </CustomTooltip>
          <MenuDropdown
            triggerRef={panelButtonRef}
            isOpen={panelOpen}
            onClose={() => {
              setPanelOpen(false);
            }}
          >
            <div className="flex flex-col gap-6">
              <span className="text-lg font-semibold">
                {t("TrendingPanel/Trending panel")}
              </span>
              {/* --- Panel name --- */}
              <Input
                label={t("TrendingPanel/Panel name")}
                value={panelName}
                onChange={(val) => {
                  setPanelName(val as string);

                  if (String(val).length === 0) {
                    return;
                  }

                  updatePanel({ title: val as string });
                }}
                onBlur={() => {
                  if (String(panelName).length === 0) {
                    setPanelName(title);
                    return;
                  }
                }}
                onModal
                {...trendingPanelConstraints.name}
              />

              {/* --- Units to trend --- */}
              <MultiDropdown
                label={t("TrendingPanel/Units to trend")}
                value={selectedUnitIds.map(String)}
                onChange={(vals) => {
                  const ids = vals.map(Number);
                  setSelectedUnitIds(ids);
                  updatePanel({ unitIds: ids });
                }}
                options={unitOptions}
                onModal
              />

              {/* --- Data to trend --- */}
              <SingleDropdown
                label={t("TrendingPanel/Data to trend")}
                value={
                  selectedColumnId === "ALL" ? "ALL" : String(selectedColumnId)
                }
                onChange={(val) => {
                  const id = val === "ALL" ? "ALL" : Number(val);
                  setSelectedColumnId(id);
                  updatePanel({
                    unitColumnId: id === "ALL" ? null : id,
                  });
                }}
                options={[
                  { value: "ALL", label: t("Common/All") },
                  ...unitColumns.map((c) => ({
                    value: String(c.id),
                    label: c.name,
                  })),
                ]}
                onModal
              />

              {/* --- Trending type --- */}
              <SingleDropdown
                label={t("TrendingPanel/Trending type")}
                value={aggregation}
                onChange={(val) => {
                  const agg = val as Aggregation;
                  setAggregation(agg);
                  updatePanel({ type: agg });
                }}
                options={[
                  { value: "Total", label: t("TrendingPanel/Total") },
                  { value: "Average", label: t("TrendingPanel/Average") },
                ]}
                onModal
              />

              {/* --- Trending period --- */}
              <div className="min-w-20">
                <SingleDropdown
                  label={t("TrendingPanel/Trending period")}
                  value={days}
                  onChange={(val) => {
                    setDays(val as TrendingPeriod);
                    updatePanel({ period: val as TrendingPeriod });
                  }}
                  options={[
                    { value: "Today", label: t("TrendingPanel/Today") },
                    { value: "Yesterday", label: t("TrendingPanel/Yesterday") },
                    { value: "Weekly", label: t("TrendingPanel/Last week") },
                    { value: "Monthly", label: t("TrendingPanel/Last month") },
                    {
                      value: "Quarterly",
                      label: t("TrendingPanel/Last quarter"),
                    },
                    { value: "AllTime", label: t("TrendingPanel/Since start") },
                    {
                      value: "Custom",
                      label: t("TrendingPanel/Custom period"),
                    },
                  ]}
                  onModal
                />
              </div>

              {days === "Custom" && (
                <div className="flex flex-col gap-6">
                  <Input
                    type="date"
                    label={t("TrendingPanel/Start date")}
                    value={customStart ?? ""}
                    min={unitCreationDate?.toISOString().slice(0, 10)}
                    max={todayStr()}
                    onChange={(val) => {
                      const v = (val as string) || null;
                      setCustomStart(v);

                      if (customEnd && v && customEnd < v) {
                        setCustomEnd(v);
                        updatePanel({ customStartDate: v, customEndDate: v });
                      } else {
                        updatePanel({
                          customStartDate: v,
                          customEndDate: customEnd,
                        });
                      }
                    }}
                    onModal
                  />
                  <Input
                    type="date"
                    label={t("TrendingPanel/End date")}
                    value={customEnd ?? ""}
                    min={
                      customStart ??
                      unitCreationDate?.toISOString().slice(0, 10)
                    }
                    max={todayStr()}
                    onChange={(val) => {
                      const v = (val as string) || null;
                      setCustomEnd(v);
                      updatePanel({
                        customStartDate: customStart,
                        customEndDate: v,
                      });
                    }}
                    onModal
                  />
                </div>
              )}

              {/* --- Remove trending panel --- */}
              <button
                className={`${buttonDeletePrimaryClass}`}
                onClick={deletePanel}
              >
                {t("TrendingPanel/Remove trending panel")}
              </button>
            </div>
          </MenuDropdown>
        </div>
      </div>

      <div className="col-span-2">
        <div className="flex flex-col overflow-y-auto rounded-b border-1 border-t-0 border-[var(--border-main)] px-2 pt-1">
          {viewMode === "LineChart" ? (
            // --- LINE CHART ---
            <div className="mt-2 overflow-hidden">
              {isLoadingUnitCells ? (
                <div className="py-6">
                  <Message icon="loading" content="content" />
                </div>
              ) : daily.length === 0 ? (
                <div className="py-6">
                  <Message icon="noData" content={t("TrendingPanel/No data")} />
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer>
                    <LineChart data={daily}>
                      <YAxis />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d) => formatSE(parseDate(d))}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload) {
                            return null;
                          }

                          const visiblePayload = payload.filter(
                            (p) => !hiddenUnits.includes(Number(p.dataKey)),
                          );

                          return (
                            <div
                              style={{
                                backgroundColor: "var(--bg-tooltip-reverse)",
                                border: "1px solid var(--border-main)",
                                borderRadius: "0.3125rem",
                                padding: "0.5rem",
                              }}
                            >
                              <p className="mb-4 font-semibold">
                                {formatSE(parseDate(label as string))}
                              </p>

                              {visiblePayload
                                .slice()
                                .sort((a, b) => {
                                  const ai = priority.indexOf(a.name as string);
                                  const bi = priority.indexOf(b.name as string);

                                  if (ai !== -1 && bi !== -1) return ai - bi;
                                  if (ai !== -1) return -1;
                                  if (bi !== -1) return 1;

                                  return String(a.name).localeCompare(
                                    String(b.name),
                                  );
                                })
                                .map((entry, i) => {
                                  const colorMap: Record<string, string> = {};
                                  sortedUnits.forEach((u, i) => {
                                    colorMap[String(u.id)] =
                                      graphColors[i % graphColors.length];
                                  });

                                  return (
                                    <p
                                      key={entry.dataKey}
                                      style={{
                                        color:
                                          colorMap[entry.dataKey as string],
                                      }}
                                    >
                                      {entry.name}:{" "}
                                      {entry.value?.toLocaleString("sv-SE")}
                                    </p>
                                  );
                                })}
                            </div>
                          );
                        }}
                      />

                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        iconType="line"
                        iconSize={12}
                        onClick={(e: any) => {
                          const unitId = Number(e.dataKey);
                          if (!isNaN(unitId)) toggleUnitVisibility(unitId);
                        }}
                        formatter={(value: string, entry: any) => {
                          const unitId = Number(entry.dataKey);
                          const isAll = isNaN(unitId);
                          const isHidden = hiddenUnits.includes(unitId);

                          if (isAll) {
                            return (
                              <span className="cursor-default text-[var(--text-main)]">
                                {value}
                              </span>
                            );
                          }

                          return (
                            <CustomTooltip
                              content={
                                <span>
                                  {isHidden
                                    ? `${t("TrendingPanel/Show unit")} ${value}`
                                    : `${t("TrendingPanel/Hide unit")} ${value}`}
                                </span>
                              }
                              longDelay
                            >
                              <span
                                className={`${isHidden ? "opacity-25" : ""} cursor-pointer transition-opacity delay-[var(--very-fast)]`}
                              >
                                {value}
                              </span>
                            </CustomTooltip>
                          );
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="ALL"
                        name={t("Common/All")}
                        dot={false}
                        strokeWidth={2}
                        stroke="var(--text-main)"
                      />

                      {sortedUnits.map((u, i) => {
                        const isHidden = hiddenUnits.includes(u.id);
                        return (
                          <Line
                            key={u.id}
                            type="monotone"
                            dataKey={String(u.id)}
                            name={u.label}
                            dot={false}
                            strokeWidth={2}
                            stroke={graphColors[i % graphColors.length]}
                            strokeOpacity={isHidden ? 0 : 1}
                            activeDot={!isHidden}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ) : viewMode === "BarChart" ? (
            // --- BAR CHART ---
            <div className="mt-2 overflow-hidden">
              {isLoadingUnitCells ? (
                <div className="py-6">
                  <Message icon="loading" content="content" />
                </div>
              ) : daily.length === 0 ? (
                <div className="py-6">
                  <Message icon="noData" content={t("TrendingPanel/No data")} />
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer>
                    <BarChart data={daily}>
                      <YAxis />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d) => formatSE(parseDate(d))}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload) {
                            return null;
                          }

                          return (
                            <div
                              style={{
                                backgroundColor: "var(--bg-tooltip-reverse)",
                                border: "1px solid var(--border-main)",
                                borderRadius: "0.3125rem",
                                padding: "0.5rem",
                              }}
                            >
                              <p className="mb-4 font-semibold">
                                {formatSE(parseDate(label as string))}
                              </p>
                              {payload.map((entry, i) => {
                                const colorMap: Record<string, string> = {};
                                sortedUnits.forEach((u, i) => {
                                  colorMap[String(u.id)] =
                                    graphColors[i % graphColors.length];
                                });
                                colorMap["ALL"] = "var(--text-main)";

                                return (
                                  <p
                                    key={entry.dataKey}
                                    style={{
                                      color: colorMap[entry.dataKey as string],
                                    }}
                                  >
                                    {entry.name}:{" "}
                                    {entry.value?.toLocaleString("sv-SE")}
                                  </p>
                                );
                              })}
                            </div>
                          );
                        }}
                      />

                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        iconType="square"
                        iconSize={12}
                        onClick={(e: any) => {
                          const unitId = Number(e.dataKey);
                          if (!isNaN(unitId)) toggleUnitVisibility(unitId);
                        }}
                        formatter={(value: string, entry: any) => {
                          const unitId = Number(entry.dataKey);
                          const isAll = isNaN(unitId);
                          const isHidden = hiddenUnits.includes(unitId);

                          if (isAll) {
                            return (
                              <span className="cursor-default text-[var(--text-main)]">
                                {value}
                              </span>
                            );
                          }

                          return (
                            <CustomTooltip
                              content={
                                <span>
                                  {isHidden
                                    ? `${t("TrendingPanel/Show unit")} ${value}`
                                    : `${t("TrendingPanel/Hide unit")} ${value}`}
                                </span>
                              }
                              longDelay
                            >
                              <span
                                className={`${isHidden ? "opacity-25" : ""} cursor-pointer transition-opacity delay-[var(--very-fast)]`}
                              >
                                {value}
                              </span>
                            </CustomTooltip>
                          );
                        }}
                      />

                      <Bar
                        dataKey="ALL"
                        name={t("Common/All")}
                        fill="var(--text-main)"
                      />

                      {/* {sortedUnits.map((u, i) => (
                        <Bar
                          key={u.id}
                          dataKey={String(u.id)}
                          name={u.label}
                          fill={graphColors[i % graphColors.length]}
                        />
                      ))} */}

                      {sortedUnits.map((u, i) => {
                        const isHidden = hiddenUnits.includes(u.id);
                        return (
                          <Bar
                            key={u.id}
                            dataKey={String(u.id)}
                            name={u.label}
                            fill={graphColors[i % graphColors.length]}
                            fillOpacity={isHidden ? 0 : 1}
                            activeBar={!isHidden}
                          />
                        );
                      })}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ) : viewMode === "PieChart" ? (
            // --- PIE CHART ---
            <div className="mt-2 overflow-hidden">
              {isLoadingUnitCells ? (
                <div className="py-6">
                  <Message icon="loading" content="content" />
                </div>
              ) : daily.length === 0 ? (
                <div className="py-6">
                  <Message icon="noData" content={t("TrendingPanel/No data")} />
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center">
                  <div className="text-sm text-[var(--text-secondary)]">
                    {t("TrendingPanel/Total")}
                  </div>

                  <div className="text-xl font-bold text-[var(--text-main)]">
                    {(aggregation === "Total"
                      ? daily.reduce((sum, d) => sum + (Number(d.ALL) || 0), 0)
                      : Math.round(
                          daily.reduce(
                            (sum, d) => sum + (Number(d.ALL) || 0),
                            0,
                          ) / (daily.length || 1),
                        )
                    ).toLocaleString("sv-SE")}
                  </div>

                  <ResponsiveContainer>
                    <PieChart>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload) {
                            return null;
                          }

                          return (
                            <div
                              style={{
                                backgroundColor: "var(--bg-tooltip-reverse)",
                                border: "1px solid var(--border-main)",
                                borderRadius: "0.3125rem",
                                padding: "0.5rem",
                              }}
                            >
                              {payload.map((entry) => (
                                <p
                                  key={entry.name}
                                  style={{ color: entry.payload.fill }}
                                >
                                  {entry.name}:{" "}
                                  {entry.value?.toLocaleString("sv-SE")}
                                </p>
                              ))}
                            </div>
                          );
                        }}
                      />

                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        iconSize={12}
                        onClick={(e: any) => {
                          const unit = sortedUnits.find(
                            (u) => u.label === e.value,
                          );
                          if (unit) toggleUnitVisibility(unit.id);
                        }}
                        formatter={(value: string) => {
                          const unit = sortedUnits.find(
                            (u) => u.label === value,
                          );
                          const isAll = !unit;
                          const isHidden = unit
                            ? hiddenUnits.includes(unit.id)
                            : false;

                          return isAll ? (
                            <span className="cursor-default text-[var(--text-main)]">
                              {value}
                            </span>
                          ) : (
                            <CustomTooltip
                              content={
                                <span>
                                  {isHidden
                                    ? `${t("TrendingPanel/Show unit")} ${value}`
                                    : `${t("TrendingPanel/Hide unit")} ${value}`}
                                </span>
                              }
                              longDelay
                            >
                              <span
                                className={`${isHidden ? "opacity-25" : ""} cursor-pointer transition-opacity delay-[var(--very-fast)]`}
                              >
                                {value}
                              </span>
                            </CustomTooltip>
                          );
                        }}
                      />

                      <Pie
                        data={[
                          ...sortedUnits.map((u, i) => {
                            const isHidden = hiddenUnits.includes(u.id);
                            return {
                              name: u.label,
                              value: isHidden
                                ? 0
                                : aggregation === "Total"
                                  ? daily.reduce(
                                      (sum, d) => sum + (Number(d[u.id]) || 0),
                                      0,
                                    )
                                  : Math.round(
                                      daily.reduce(
                                        (sum, d) =>
                                          sum + (Number(d[u.id]) || 0),
                                        0,
                                      ) / (daily.length || 1),
                                    ),
                              fill: graphColors[i % graphColors.length],
                              opacity: isHidden ? 0.25 : 1,
                            };
                          }),
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius="80%"
                        stroke="none"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ) : (
            // --- VALUE/NO CHART ---
            <div className="mt-2 overflow-hidden">
              {isLoadingUnitCells ? (
                <div className="py-6">
                  <Message icon="loading" content="content" />
                </div>
              ) : daily.length === 0 ? (
                <div className="py-6">
                  <Message icon="noData" content={t("TrendingPanel/No data")} />
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center">
                  <div className="flex flex-col items-center text-xl text-[var(--text-main)]">
                    <div className="text-sm text-[var(--text-secondary)]">
                      {t("TrendingPanel/Total")}
                    </div>
                    <div className="text-xl font-bold text-[var(--text-main)]">
                      {(aggregation === "Total"
                        ? daily.reduce(
                            (sum, d) => sum + (Number(d.ALL) || 0),
                            0,
                          )
                        : Math.round(
                            daily.reduce(
                              (sum, d) => sum + (Number(d.ALL) || 0),
                              0,
                            ) / (daily.length || 1),
                          )
                      ).toLocaleString("sv-SE")}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col items-center justify-center gap-2">
                    {sortedUnits
                      .filter((u) => !hiddenUnits.includes(u.id))
                      .map((u, i) => {
                        const value =
                          aggregation === "Total"
                            ? daily.reduce(
                                (sum, d) => sum + (Number(d[u.id]) || 0),
                                0,
                              )
                            : Math.round(
                                daily.reduce(
                                  (sum, d) => sum + (Number(d[u.id]) || 0),
                                  0,
                                ) / (daily.length || 1),
                              );

                        return (
                          <div
                            key={u.id}
                            className="text-2xl font-bold"
                            style={{
                              color: graphColors[i % graphColors.length],
                            }}
                          >
                            {value.toLocaleString("sv-SE")}
                          </div>
                        );
                      })}
                  </div>

                  {/* --- Legend (set to specific px to match rechart) --- */}
                  <div className="mx-[6px] mt-auto mb-[5px] flex flex-wrap justify-center gap-x-[12px] text-[14px]">
                    <div className="flex items-center gap-[11px]">
                      {sortedUnits.map((u, i) => {
                        const isHidden = hiddenUnits.includes(u.id);
                        return (
                          <CustomTooltip
                            key={u.id}
                            content={
                              <span>
                                {isHidden
                                  ? `${t("TrendingPanel/Show unit")} ${u.label}`
                                  : `${t("TrendingPanel/Hide unit")} ${u.label}`}
                              </span>
                            }
                            longDelay
                          >
                            <div
                              onClick={() => toggleUnitVisibility(u.id)}
                              className={`flex cursor-pointer items-center gap-[5px] transition-opacity delay-[var(--very-fast)] ${
                                isHidden ? "opacity-25" : ""
                              }`}
                              style={{
                                color: graphColors[i % graphColors.length],
                              }}
                            >
                              <span
                                className="inline-block h-[12px] w-[12px]"
                                style={{
                                  backgroundColor:
                                    graphColors[i % graphColors.length],
                                }}
                              />
                              {u.label}
                            </div>
                          </CustomTooltip>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- PANEL INFO --- */}
          <div className="mt-2 text-sm">
            <div className="-mx-2 bg-[var(--bg-grid-zebra)] px-2 py-1">
              <button
                className="flex w-full cursor-pointer items-center justify-between transition-colors delay-[var(--transition-fast)] hover:text-[var(--accent-color)]"
                onClick={() => updatePanel({ showInfo: !showInfo })}
              >
                <span className="">
                  {showInfo
                    ? t("TrendingPanel/Hide information")
                    : t("TrendingPanel/Show information")}
                </span>
                {showInfo ? (
                  <HoverIcon
                    outline={Outline.ChevronDownIcon}
                    solid={Solid.ChevronDownIcon}
                    className="h-4 w-4"
                  />
                ) : (
                  <HoverIcon
                    outline={Outline.ChevronUpIcon}
                    solid={Solid.ChevronUpIcon}
                    className="h-4 w-4"
                  />
                )}
              </button>
            </div>

            {showInfo && (
              <>
                {/* --- Data to trend --- */}
                <div className="-mx-2 flex justify-between px-2 py-1">
                  <span className="text-[var(--text-secondary)]">
                    {t("TrendingPanel/Data to trend")}
                  </span>
                  <span className="font-medium">
                    {selectedColumnId === "ALL"
                      ? t("Common/All")
                      : (unitColumns.find((c) => c.id === selectedColumnId)
                          ?.name ?? t("TrendingPanel/No data"))}
                  </span>
                </div>

                {/* --- Trending type --- */}
                <div className="-mx-2 flex justify-between bg-[var(--bg-grid-zebra)] px-2 py-1">
                  <span className="text-[var(--text-secondary)]">
                    {t("TrendingPanel/Trending type")}
                  </span>
                  <span className="font-medium">
                    {aggregation === "Total"
                      ? t("TrendingPanel/Total")
                      : t("TrendingPanel/Average")}
                  </span>
                </div>

                {/* --- Units to trend --- */}
                <div className="-mx-2 flex justify-between px-2 py-1">
                  <span className="text-[var(--text-secondary)]">
                    {t("Common/Units")}
                  </span>
                  <span className="max-w-[60%] text-right font-medium">
                    {sortedUnits.length > 0
                      ? sortedUnits.map((u) => u.label).join(", ")
                      : t("TrendingPanel/No units selected")}
                  </span>
                </div>

                {/* --- Trending period --- */}
                <div className="-mx-2 flex justify-between bg-[var(--bg-grid-zebra)] px-2 py-1">
                  <span className="text-[var(--text-secondary)]">
                    {t("TrendingPanel/Trending period")}
                  </span>
                  <span className="font-medium">
                    {days === "Today"
                      ? t("TrendingPanel/Today")
                      : days === "Yesterday"
                        ? t("TrendingPanel/Yesterday")
                        : days === "Weekly"
                          ? t("TrendingPanel/Last week")
                          : days === "Monthly"
                            ? t("TrendingPanel/Last month")
                            : days === "Quarterly"
                              ? t("TrendingPanel/Last quarter")
                              : days === "Custom"
                                ? t("TrendingPanel/Custom period")
                                : t("TrendingPanel/Since start")}
                  </span>
                </div>

                {/* --- Date range --- */}
                <div className="-mx-2 flex justify-between px-2 py-1">
                  <span className="text-[var(--text-secondary)]">
                    {t("TrendingPanel/Date range")}
                  </span>
                  <span className="font-medium">
                    {days === "Custom"
                      ? customStart && customEnd && customStart <= customEnd
                        ? `${formatSE(parseDate(customStart))} – ${formatSE(parseDate(customEnd))}`
                        : customStart && customEnd && customStart > customEnd
                          ? `${formatSE(parseDate(customStart))} – ${formatSE(parseDate(customStart))}`
                          : t("TrendingPanel/No data")
                      : start && end && start <= end
                        ? `${formatSE(parseDate(start))} – ${formatSE(parseDate(end))}`
                        : start && end && start > end
                          ? `${formatSE(parseDate(start))} – ${formatSE(parseDate(start))}`
                          : t("TrendingPanel/No data")}
                  </span>
                </div>
              </>
            )}

            {/* --- RESIZE HANDLE --- */}
            <div
              className={`absolute top-0 right-0 h-full w-2 cursor-ew-resize hover:bg-[var(--text-secondary)] ${isResizing ? "bg-[var(--text-secondary)]" : "bg-transparent"}`}
              onMouseDown={handleMouseDown}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendingPanel;
