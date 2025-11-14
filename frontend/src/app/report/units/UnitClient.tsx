"use client";

import {
  buttonDeletePrimaryClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
  iconButtonPrimaryClass,
  roundedButtonClass,
} from "../../styles/buttonClasses";
import Message from "../../components/common/Message";
import CustomTooltip from "../../components/common/CustomTooltip";
import React from "react";
import useClient, {
  shiftsClass,
  shiftsIconClass,
  tdClass,
  tdClassSpecial,
  thClass,
} from "@/app/hooks/useClient";
import HoverIcon from "@/app/components/common/HoverIcon";
import * as Outline from "@heroicons/react/24/outline";
import * as Solid from "@heroicons/react/24/solid";
import {
  toLocalDateString,
  utcIsoToLocalDateTime,
} from "@/app/helpers/timeUtils";
import Input from "@/app/components/common/Input";
import MenuDropdown from "@/app/components/common/MenuDropdown/MenuDropdown";
import MenuDropdownAnchor from "@/app/components/common/MenuDropdown/MenuDropdownAnchor";
import { badgeClass } from "@/app/components/manage/ManageClasses";
import DeleteModal from "@/app/components/modals/DeleteModal";
import ReportModal from "@/app/components/modals/report/ReportModal";
import UnitCellModal from "@/app/components/modals/report/UnitCellModal";

type ShiftChange = {
  id: number;
  hour: number;
  minute?: number;
  oldShiftId: number;
  newShiftId: number;
};

const UnitClient = (props: any) => {
  const c = useClient(props);

  if (c.canShowLock) {
    return <Message icon="lock" content="lock" fullscreen />;
  }
  if (c.canShowInvalid) {
    return <Message content="invalid" fullscreen />;
  }
  if (c.isReady) {
    return (
      <>
        {/* --- MODALS --- */}
        <UnitCellModal
          isOpen={c.isUnitCellModalOpen}
          onClose={c.toggleUnitCellModal}
          onItemUpdated={() => {
            c.setRefetchData(true);
          }}
          unitId={c.parsedUnitId}
          selectedDate={c.selectedDate}
          selectedHour={c.reportHour}
        />

        <ReportModal
          isOpen={c.isReportModalOpen}
          onClose={c.toggleReportModal}
          onItemUpdated={() => {
            c.setRefetchData(true);
          }}
          unitId={c.parsedUnitId}
          categoryIds={c.categoryIds}
          reportId={Number(c.reportId)}
          selectedDate={c.reportDate}
          selectedHour={c.reportHour}
        />

        <DeleteModal
          isOpen={c.isDeleteModalOpen}
          onClose={() => c.toggleDeleteItemModal()}
          onConfirm={async () => {
            if (!c.deletingItemId || !c.deleteType) {
              return;
            }

            if (c.deleteType === "report") {
              await c.deleteReport(c.deletingItemId);
              c.setReports((prev) =>
                prev.filter((r) => String(r.id) !== c.deletingItemId),
              );
            } else if (c.deleteType === "shiftChange") {
              await c.deleteShiftChange(c.deletingItemId);
              c.setShiftChanges((prev) =>
                prev.filter((sc) => String(sc.id) !== c.deletingItemId),
              );
            }

            c.toggleDeleteItemModal();
          }}
          customDeleteMessage={
            c.deleteType === "shiftChange"
              ? c.t("Unit/Remove post message")
              : undefined
          }
        />

        {/* --- CONTENT --- */}
        <div className="flex flex-col gap-4">
          <div className="flex w-full flex-wrap gap-4">
            <div className="flex gap-4">
              {/* --- Report data top --- */}
              <CustomTooltip
                content={`${!props.isReporter ? c.t("Common/No access") : c.unitColumnNames.length > 0 ? c.t("Unit/Tooltip report data") : c.t("Unit/No columns")}`}
                veryLongDelay={
                  props.isReporter == true && c.unitColumnNames.length > 0
                }
                showOnTouch
              >
                <button
                  className={`${buttonSecondaryClass} group lg:w-max lg:px-4`}
                  onClick={() => c.toggleUnitCellModal()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      c.toggleUnitCellModal();
                    }
                  }}
                  tabIndex={0}
                  disabled={!props.isReporter || c.unitColumnNames.length === 0}
                >
                  <div className="flex items-center justify-center gap-2 truncate">
                    <HoverIcon
                      outline={Outline.DocumentTextIcon}
                      solid={Solid.DocumentTextIcon}
                      className="h-6 min-h-6 w-6 min-w-6"
                    />
                    <span className="hidden lg:block">
                      {c.t("Unit/Report data")}
                    </span>
                  </div>
                </button>
              </CustomTooltip>

              <CustomTooltip
                content={`${!props.isReporter ? c.t("Common/No access") : c.t("Unit/Tooltip report events")}`}
                veryLongDelay={props.isReporter == true}
                showOnTouch
              >
                <button
                  className={`${buttonSecondaryClass} group lg:w-max lg:px-4`}
                  onClick={() => c.toggleReportModal()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      c.toggleReportModal();
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
                      {c.t("Unit/Report events")}
                    </span>
                  </div>
                </button>
              </CustomTooltip>
            </div>

            <div className="ml-auto flex max-w-max flex-wrap items-center gap-4">
              <CustomTooltip
                content={`${c.refetchData && c.isManualRefresh ? c.t("Common/Updating") : c.t("Common/Update page")}`}
                veryLongDelay
                showOnTouch
              >
                <button
                  className={`${buttonSecondaryClass} group flex items-center justify-center`}
                  onClick={() => {
                    c.setIsManualRefresh(true);
                    c.setRefetchData(true);
                  }}
                  aria-label={c.t("Common/Update page")}
                  disabled={c.isManualRefresh && c.refetchData}
                >
                  <Outline.ArrowPathIcon
                    className={`${c.refetchData && c.isManualRefresh ? "motion-safe:animate-[spin_1s_linear_infinite]" : ""} min-h-full min-w-full`}
                  />
                </button>
              </CustomTooltip>
              <div className="flex">
                <button
                  className={`${buttonSecondaryClass} rounded-r-none`}
                  onClick={c.goToPreviousDay}
                  aria-label={c.t("Unit/Previous day")}
                  disabled={
                    !!c.unitCreationDate && c.selectedDate <= c.unitCreationDate
                  }
                >
                  <Outline.ChevronLeftIcon className="min-h-full min-w-full" />
                </button>
                <div className="flex max-w-40 min-w-40">
                  <Input
                    type="date"
                    value={c.tempDate}
                    onChange={(val) => c.setTempDate(String(val))}
                    onBlur={(e) => c.handleDateChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        c.handleDateChange(
                          (e.target as HTMLInputElement).value,
                        );
                      }
                    }}
                    notRounded
                    min={c.unitCreationDate}
                  />
                </div>
                <button
                  className={`${buttonSecondaryClass} rounded-l-none`}
                  onClick={c.goToNextDay}
                  aria-label={c.t("Unit/Next day")}
                >
                  <Outline.ChevronRightIcon className="min-h-full min-w-full" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-4">
            <div className="relative ml-auto flex items-center gap-4">
              <CustomTooltip
                content={`${!props.isReporter ? c.t("Common/No access") : ""}`}
                veryLongDelay={props.isReporter == true}
                showOnTouch
              >
                <button
                  ref={c.shiftsRef}
                  className={`${roundedButtonClass} ${!props.isReporter ? "!cursor-not-allowed opacity-50" : ""} group w-auto gap-2 px-4`}
                  onClick={async () => {
                    c.setPendingShiftId(null);
                    c.setPendingShiftId(c.currentActiveShiftId ?? null);
                    c.setPendingShiftDate(c.selectedDate);
                    c.setPendingShiftTime("");
                    c.setShiftsOpen((prev) => !prev);
                  }}
                  aria-haspopup="menu"
                  aria-expanded={c.shiftsOpen}
                  disabled={!props.isReporter}
                >
                  <span
                    className={`${shiftsClass} ${c.shiftsOpen ? "text-(--accent-color)" : ""}`}
                  >
                    {(() => {
                      const sid = c.currentActiveShiftId;

                      if (sid == null) {
                        return c.t("Unit/Change shift");
                      }

                      const shift = c.shiftNames.find((s) => s.id === sid);
                      if (!shift) {
                        return c.t("Unit/Change shift");
                      }

                      if (shift.systemKey) {
                        const key = `Shifts/${shift.systemKey}`;
                        const tr = c.t(key);
                        // return tr !== key ? tr : shift.name;
                        return c.t("Unit/Change shift");
                      }

                      // return shift.name;
                      return c.t("Unit/Change shift");
                    })()}
                  </span>
                  <Outline.ChevronDownIcon
                    className={`${shiftsIconClass} ${c.shiftsOpen ? "-rotate-180 text-(--accent-color)" : ""}`}
                  />
                </button>
              </CustomTooltip>
              <MenuDropdown
                triggerRef={c.shiftsRef}
                isOpen={c.shiftsOpen}
                onClose={() => {
                  c.setShiftsOpen(false);
                  c.setPendingShiftId(null);
                }}
              >
                <div className="flex w-full flex-col gap-4">
                  {c.dropdownShifts.map((item) => {
                    const effectivePendingId =
                      c.pendingShiftId ?? c.currentActiveShiftId;

                    return (
                      <div
                        key={item.id}
                        onClick={() => c.setPendingShiftId(item.id)}
                        role="menuitemradio"
                        aria-checked={c.pendingShiftId === item.id}
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
                      value={c.pendingShiftDate}
                      onChange={(v) => c.setPendingShiftDate(String(v))}
                      label={c.t("Common/Date")}
                      min={c.unitCreationDate}
                      onModal
                      required
                    />
                    <Input
                      type="time"
                      value={c.pendingShiftTime}
                      onChange={(v) => c.setPendingShiftTime(String(v))}
                      label={c.t("Common/Time")}
                      onModal
                      required
                    />
                  </div>
                </div>

                <button
                  className={`${buttonPrimaryClass} !min-h-[32px] w-full rounded-full`}
                  onClick={c.changeShift}
                  disabled={
                    !c.pendingShiftId ||
                    !c.pendingShiftDate ||
                    !c.pendingShiftTime ||
                    !props.isReporter ||
                    c.pendingShiftDate < c.unitCreationDate
                  }
                >
                  {c.t("Unit/Change to shift")}
                </button>
              </MenuDropdown>
            </div>
          </div>
          <div className="w-full overflow-x-auto rounded border border-(--border-main)">
            <table className="w-full max-w-full min-w-fit border-collapse overflow-x-auto">
              <thead className="bg-(--bg-grid-header)">
                {c.isBootstrapping ? (
                  <tr>
                    <th
                      colSpan={
                        c.unitColumnNames.length + c.compareColsCount + 4
                      }
                      className={`${thClass}`}
                    />
                  </tr>
                ) : (
                  <tr>
                    {/* --- Standard <th>s --- */}
                    <th
                      className={`${thClass} sticky left-0 z-[calc(var(--z-base)+2)] w-[52.5px] cursor-pointer bg-(--bg-grid-header) whitespace-nowrap transition-[background] duration-(--fast) hover:bg-(--bg-grid-header-hover)`}
                      onClick={c.toggleAllRows}
                      role="button"
                      aria-label={c.t("Unit/Open or collapse")}
                    >
                      <div className={iconButtonPrimaryClass}>
                        {c.allExpanded ? (
                          <Outline.ChevronDownIcon />
                        ) : (
                          <Outline.ChevronUpIcon />
                        )}
                      </div>
                    </th>
                    <th
                      className={`${thClass} sticky left-[52.5px] z-[calc(var(--z-base)+2)] w-[72px] bg-(--bg-grid-header) whitespace-nowrap`}
                    >
                      {c.t("Common/Time")}
                    </th>
                    <th
                      className={`${thClass} w-[72px] bg-(--bg-grid-header) whitespace-nowrap`}
                    >
                      {c.t("Common/Shift")}
                    </th>
                    <th
                      className={`${thClass} ${c.unitColumnNames.length > 0 ? "w-0" : ""} whitespace-nowrap`}
                    >
                      {c.t("Unit/Events")}
                    </th>

                    {c.unitColumnNames.map((col, i, arr) => (
                      <React.Fragment key={`head-${i}`}>
                        <th
                          className={`${thClass} ${
                            c.unitColumnDataTypes[i] === "Text" &&
                            c.unitColumnLargeColumnFlags[i]
                              ? "min-w-[64ch]"
                              : "min-w-[10ch]"
                          } whitespace-nowrap`}
                        >
                          {col}
                        </th>

                        {c.unitColumnDataTypes[i] === "Number" &&
                          c.unitColumnCompareFlags[i] && (
                            <th
                              className={`${thClass} w-0 min-w-[10ch] whitespace-nowrap`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span>{c.unitColumnComparisonTexts[i]}</span>
                                <CustomTooltip
                                  content={
                                    c.t("Unit/Tooltip comparison text") +
                                    c.unitColumnNames[i]
                                  }
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
                            </th>
                          )}
                      </React.Fragment>
                    ))}
                  </tr>
                )}
              </thead>
              <tbody>
                {c.isBootstrapping ? (
                  <tr>
                    {/* 960px = h-[tdClass] * 24 */}
                    <td
                      colSpan={
                        c.unitColumnNames.length + c.compareColsCount + 4
                      }
                      className={`${tdClass} h-[960px]`}
                    >
                      <Message icon="loading" content="content" />
                    </td>
                  </tr>
                ) : (
                  <>
                    {Array.from({ length: 24 }, (_, hour) => {
                      const isExpanded = c.expandedRows.includes(hour);

                      const hasMidnightChange = c.shiftChanges.some(
                        (c) => c.hour === 0 && (c.minute ?? 0) === 0,
                      );

                      const isCreationDay =
                        Boolean(c.unitCreationDate) &&
                        c.selectedDate === c.unitCreationDate;

                      const baseSynthetic =
                        hour === 0 &&
                        c.baseShiftId != null &&
                        !hasMidnightChange &&
                        isCreationDay
                          ? [
                              {
                                id: -1,
                                hour: 0,
                                minute: 0,
                                oldShiftId: c.baseShiftId,
                                newShiftId: c.baseShiftId,
                              } as ShiftChange,
                            ]
                          : [];

                      const changesThisHour = [
                        ...baseSynthetic,
                        ...c.shiftChanges.filter((c) => c.hour === hour),
                      ].sort(
                        (a, b) =>
                          a.hour - b.hour || (a.minute ?? 0) - (b.minute ?? 0),
                      );

                      return (
                        <React.Fragment key={hour}>
                          <tr
                            role="button"
                            onClick={(e) => {
                              if (c.editingCell) {
                                e.stopPropagation();
                                return;
                              }

                              c.toggleRow(hour);
                            }}
                            aria-label="Öppna/stäng"
                            className={`${hour % 2 === 0 ? "bg-(--bg-grid)" : "bg-(--bg-grid-zebra)"} group/row cursor-pointer transition-[background] duration-(--fast) hover:bg-(--bg-grid-header-hover)`}
                          >
                            {/* --- Standard <td>s --- */}
                            {/* --- Expand <td> --- */}
                            <td
                              className={`${tdClass} ${hour === 23 ? "border-b-0" : ""} ${hour % 2 === 0 ? "bg-(--bg-grid) group-hover/row:bg-(--bg-grid-header-hover)" : "bg-(--bg-grid-zebra) group-hover/row:bg-(--bg-grid-header-hover)"} sticky left-0 z-[calc(var(--z-base)+2)] w-[52.5px] border-l-0 whitespace-nowrap transition-[background] duration-(--fast)`}
                            >
                              <div className={iconButtonPrimaryClass}>
                                {isExpanded ? (
                                  <Outline.ChevronDownIcon />
                                ) : (
                                  <Outline.ChevronUpIcon />
                                )}
                              </div>
                            </td>

                            {/* --- Time <td> --- */}
                            <td
                              className={`${tdClass} ${hour === 23 ? "border-b-0" : ""} ${hour % 2 === 0 ? "bg-(--bg-grid) group-hover/row:bg-(--bg-grid-header-hover)" : "bg-(--bg-grid-zebra) group-hover/row:bg-(--bg-grid-header-hover)"} sticky left-[52.5px] z-[calc(var(--z-base)+2)] w-[72px] whitespace-nowrap transition-[background] duration-(--fast)`}
                            >
                              {hour.toString().padStart(2, "0")}:00
                            </td>

                            {/* --- Shift <td> --- */}
                            <td
                              className={`${tdClass} ${hour === 23 ? "border-b-0" : ""} whitespace-nowrap`}
                            >
                              {(() => {
                                const sid = c.resolveShiftIdForTime(hour, 0);

                                if (sid == null) {
                                  return "?";
                                }

                                const shift = c.shiftNames.find(
                                  (s) => s.id === sid,
                                );

                                if (!shift) {
                                  return "?";
                                }

                                const span = c.getTeamSpanForHour(sid, hour);
                                if (!span) {
                                  return "-";
                                }

                                return (
                                  <span
                                    className={`${badgeClass}`}
                                    style={
                                      span.reverseColor
                                        ? {
                                            boxShadow: `inset 0 0 0 1px ${
                                              c.currentTheme === "dark"
                                                ? span.darkColorHex
                                                : span.lightColorHex
                                            }`,
                                            backgroundColor: "transparent",
                                            color: "var(--text-main)",
                                          }
                                        : {
                                            backgroundColor:
                                              c.currentTheme === "dark"
                                                ? span.darkColorHex
                                                : span.lightColorHex,
                                            color:
                                              c.currentTheme === "dark"
                                                ? span.darkTextColorHex
                                                : span.lightTextColorHex,
                                          }
                                    }
                                  >
                                    {span.label}
                                  </span>
                                );
                              })()}
                            </td>

                            {/* --- Events <td> --- */}
                            <td
                              className={`${tdClass} ${hour === 23 ? "border-b-0" : ""} ${c.unitColumnNames.length > 0 ? "w-0" : "border-r-0"} whitespace-nowrap`}
                            >
                              {(() => {
                                const dayStart = new Date(
                                  `${c.selectedDate}T00:00:00`,
                                );
                                const hourStart = new Date(dayStart);
                                hourStart.setHours(hour, 0, 0, 0);
                                const hourEnd = new Date(dayStart);
                                hourEnd.setHours(hour + 1, 0, 0, 0);

                                const filteredReports = c.reports.filter(
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
                                  <div className="flex items-center gap-2">
                                    {filteredReports.length}{" "}
                                    {hasOngoing && (
                                      <CustomTooltip
                                        content={c.t("Unit/Ongoing event")}
                                        showOnTouch
                                      >
                                        <span className="group ml-1 min-h-4 min-w-4 cursor-help text-(--note-error)">
                                          <HoverIcon
                                            outline={
                                              Outline.ExclamationTriangleIcon
                                            }
                                            solid={
                                              Solid.ExclamationTriangleIcon
                                            }
                                            className="flex"
                                          />
                                        </span>
                                      </CustomTooltip>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>

                            {/* --- Unit Columns <td>s --- */}
                            {c.unitColumnNames.map((_, colIdx) => {
                              const columnId = c.unitColumnIds[colIdx];
                              const columnName = c.unitColumnNames[colIdx];
                              const dataType = c.unitColumnDataTypes[colIdx];
                              const hasCompare =
                                c.unitColumnCompareFlags[colIdx];
                              const compareLabel =
                                c.unitColumnComparisonTexts[colIdx];

                              const cell = c.unitCells.find(
                                (c) =>
                                  c.hour === hour &&
                                  c.columnName === columnName,
                              );

                              const displayValue =
                                dataType === "Boolean"
                                  ? cell?.value === true
                                    ? c.t("Common/Yes")
                                    : cell?.value === "false"
                                      ? c.t("Common/No")
                                      : ""
                                  : (cell?.intValue ?? cell?.value ?? "");

                              const numericCurrent =
                                dataType === "Number"
                                  ? c.getNumericCellValue(cell)
                                  : undefined;

                              const prevCell =
                                dataType === "Number"
                                  ? c.unitCells.find(
                                      (uc) =>
                                        uc.hour === hour - 1 &&
                                        uc.columnName === columnName,
                                    )
                                  : undefined;

                              const numericPrev =
                                dataType === "Number"
                                  ? c.getNumericCellValue(prevCell)
                                  : undefined;

                              const diff =
                                numericCurrent != null && numericPrev != null
                                  ? numericCurrent - numericPrev
                                  : undefined;

                              return (
                                <React.Fragment key={`col-${hour}-${colIdx}`}>
                                  <td
                                    className={`${tdClass} ${
                                      hour === 23 ? "border-b-0" : ""
                                    } ${
                                      hasCompare && dataType === "Number"
                                        ? ""
                                        : colIdx ===
                                            c.unitColumnNames.length - 1
                                          ? "border-r-0"
                                          : ""
                                    } ${
                                      c.unitColumnDataTypes[colIdx] ===
                                        "Text" &&
                                      c.unitColumnLargeColumnFlags[colIdx]
                                        ? "min-w-[28ch]"
                                        : "min-w-[10ch]"
                                    } group/cell break-normal!`}
                                  >
                                    <div className="flex gap-4">
                                      {c.editingCell?.hour === hour &&
                                      c.editingCell?.columnId === columnId ? (
                                        <Input
                                          compact
                                          focusOnMount
                                          type={
                                            dataType === "Number"
                                              ? "number"
                                              : "text"
                                          }
                                          value={String(c.editingValue ?? "")}
                                          onChange={(val) =>
                                            c.setEditingValue(
                                              dataType === "Number"
                                                ? val === ""
                                                  ? ""
                                                  : isNaN(Number(val))
                                                    ? ""
                                                    : Number(val)
                                                : val,
                                            )
                                          }
                                          onBlur={() => c.setEditingCell(null)}
                                          onKeyDown={(e) => {
                                            if (e.key === "Escape") {
                                              e.stopPropagation();
                                              c.setEditingCell(null);
                                            } else if (e.key === "Enter") {
                                              e.preventDefault();
                                              c.saveInlineEdit();
                                            }
                                          }}
                                          min={0}
                                          max={999999}
                                        />
                                      ) : (
                                        <>
                                          {displayValue}

                                          <CustomTooltip
                                            content={`${!props.isReporter ? c.t("Common/No access") : c.unitColumnNames.length > 0 ? c.t("Unit/Tooltip report this data") + c.t("Unit/Tooltip this hour") : c.t("Unit/No columns")}`}
                                            veryLongDelay={
                                              props.isReporter == true &&
                                              c.unitColumnNames.length > 0
                                            }
                                            showOnTouch
                                          >
                                            <button
                                              type="button"
                                              className={`${iconButtonPrimaryClass} group invisible ml-auto group-hover/cell:visible`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                // toggleUnitCellModal(hour);
                                                c.setEditingCell({
                                                  hour,
                                                  columnId,
                                                });
                                                c.setEditingValue(
                                                  cell?.value ??
                                                    cell?.intValue ??
                                                    "",
                                                );
                                              }}
                                              disabled={
                                                !props.isReporter ||
                                                c.unitColumnNames.length === 0
                                              }
                                            >
                                              <HoverIcon
                                                outline={Outline.PencilIcon}
                                                solid={Solid.PencilIcon}
                                                className="h-6 min-h-6 w-6 min-w-6"
                                              />
                                            </button>
                                          </CustomTooltip>
                                        </>
                                      )}
                                    </div>
                                  </td>

                                  {dataType === "Number" && hasCompare && (
                                    <td
                                      className={`${tdClass} ${hour === 23 ? "border-b-0" : ""} ${colIdx === c.unitColumnNames.length - 1 ? "border-r-0" : ""} ${dataType === "Number" ? "max-w-max" : "min-w-32"}`}
                                    >
                                      {numericPrev == null
                                        ? "0"
                                        : diff! >= 0
                                          ? `${diff}`
                                          : `0`}
                                    </td>
                                  )}
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
                                className="bg-(--bg-grid-note)"
                              >
                                <td
                                  className={`${tdClassSpecial} sticky left-0 z-[calc(var(--z-base)+2)] w-[52.5px] bg-(--bg-grid-note)`}
                                />
                                <td
                                  className={`${tdClassSpecial} sticky left-[52.5px] z-[calc(var(--z-base)+2)] w-[72px] bg-(--bg-grid-note)`}
                                >
                                  {c.toHm(change.hour, change.minute)}
                                </td>
                                <td
                                  colSpan={
                                    c.unitColumnNames.length +
                                    c.compareColsCount +
                                    4
                                  }
                                >
                                  <div className="flex items-center justify-center">
                                    <div className="flex w-full items-center justify-center">
                                      <>
                                        {!isSynthetic
                                          ? c.t("Unit/Shift changed") +
                                            c.getShiftLabel(change.newShiftId)
                                          : c.t("Unit/New unit shift changed") +
                                            c.getShiftLabel(change.newShiftId)}
                                      </>
                                    </div>
                                    <CustomTooltip
                                      content={`${!props.isReporter ? c.t("Common/No access") : isSynthetic ? c.t("Unit/Cannot be edited") : c.t("Unit/Update post")}`}
                                      veryLongDelay={
                                        props.isReporter == true && !isSynthetic
                                      }
                                      showOnTouch
                                    >
                                      <button
                                        ref={c.menuTriggerRef}
                                        className={`${iconButtonPrimaryClass} ${!props.isReporter ? "!cursor-not-allowed opacity-50" : ""} group mr-4 w-auto`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          c.menuTriggerRef.current =
                                            e.currentTarget as HTMLButtonElement;
                                          c.setEditChangeDate(c.selectedDate);
                                          c.setEditChangeTime(
                                            c.toHm(change.hour, change.minute),
                                          );
                                          c.setPendingShiftId(
                                            change.newShiftId,
                                          );
                                          c.setOpenChangeMenuId((prev) =>
                                            prev === change.id
                                              ? null
                                              : change.id,
                                          );
                                        }}
                                        aria-haspopup="menu"
                                        aria-expanded={c.shiftsOpen}
                                        disabled={
                                          !props.isReporter || isSynthetic
                                        }
                                      >
                                        <HoverIcon
                                          outline={Outline.PencilIcon}
                                          solid={Solid.PencilIcon}
                                          className="h-6 min-h-6 w-6 min-w-6 text-(--text-main)"
                                          active={
                                            c.openChangeMenuId === change.id
                                          }
                                        />
                                      </button>
                                    </CustomTooltip>

                                    <MenuDropdownAnchor
                                      triggerRef={c.menuTriggerRef}
                                      isOpen={c.openChangeMenuId === change.id}
                                      onClose={() => {
                                        c.setOpenChangeMenuId(null);
                                        c.setPendingShiftId(null);
                                      }}
                                      addSpacing={8}
                                    >
                                      <div className="flex w-full flex-col gap-4">
                                        {c.dropdownShifts.map((item) => (
                                          <div
                                            key={item.id}
                                            onClick={() =>
                                              c.setPendingShiftId(item.id)
                                            }
                                            role="menuitemradio"
                                            aria-checked={
                                              c.pendingShiftId === item.id
                                            }
                                            className="group flex cursor-pointer items-center justify-between gap-4"
                                          >
                                            <Input
                                              type="radio"
                                              name={`shift-selection-${item.id}`}
                                              checked={
                                                (c.pendingShiftId ??
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
                                            value={c.editChangeDate}
                                            onChange={(v) =>
                                              c.setEditChangeDate(String(v))
                                            }
                                            label={c.t("Common/Date")}
                                            onModal
                                            required
                                          />
                                          <Input
                                            type="time"
                                            value={c.editChangeTime}
                                            onChange={(v) =>
                                              c.setEditChangeTime(String(v))
                                            }
                                            label={c.t("Common/Time")}
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
                                            await c.handleEditShiftChange(
                                              change,
                                              {
                                                date: c.editChangeDate,
                                                time: c.editChangeTime,
                                                usePendingShift: true,
                                              },
                                            );
                                            // setPendingShiftDate(editChangeDate);
                                            // setPendingShiftTime(editChangeTime);
                                            c.setOpenChangeMenuId(null);
                                          }}
                                          disabled={
                                            !props.isReporter ||
                                            !c.editChangeDate ||
                                            !c.editChangeTime
                                          }
                                        >
                                          {c.t("Unit/Update post")}
                                        </button>
                                        <button
                                          className={`${buttonDeletePrimaryClass} !min-h-[32px] w-full rounded-full`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            c.setOpenChangeMenuId(null);
                                            c.toggleDeleteItemModal(
                                              String(change.id),
                                              "shiftChange",
                                            );
                                          }}
                                          disabled={!props.isReporter}
                                        >
                                          {c.t("Unit/Remove post")}
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
                              className={`${hour === 23 ? "border-b-0" : ""} ${hour % 2 === 0 ? "bg-(--bg-grid)" : "bg-(--bg-grid-zebra)"} border-y-1 border-y-(--border-secondary)`}
                            >
                              <td
                                colSpan={
                                  c.unitColumnNames.length +
                                  c.compareColsCount +
                                  4
                                }
                              >
                                <div className="flex flex-col gap-4 p-4">
                                  <CustomTooltip
                                    content={`${!props.isReporter ? c.t("Common/No access") : c.t("Unit/Tooltip report events") + c.t("Unit/Tooltip this hour")}`}
                                    veryLongDelay={props.isReporter == true}
                                    showOnTouch
                                  >
                                    <button
                                      className={`${iconButtonPrimaryClass} ml-auto flex items-center justify-center gap-2`}
                                      onClick={() => {
                                        const startDate = new Date(
                                          `${c.selectedDate}T${hour.toString().padStart(2, "0")}:00:00`,
                                        );

                                        c.toggleReportModal(
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
                                    const hourReports = c.reports.filter(
                                      (report) => {
                                        if (!report.startTime) {
                                          return false;
                                        }

                                        const dayStart = new Date(
                                          `${c.selectedDate}T00:00:00`,
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

                                    function toLocalDateString(
                                      startDate: Date,
                                    ): string | undefined {
                                      throw new Error(
                                        "Function not implemented.",
                                      );
                                    }

                                    return hourReports.map((report, index) => (
                                      <div
                                        key={`${report.id ?? "temp"}-${report.startTime ?? "unknown"}-${index}`}
                                        className="relative flex flex-col gap-4 rounded bg-(--bg-modal) p-4"
                                      >
                                        {report.categoryName && (
                                          <div className="flex justify-between gap-4">
                                            <div className="mb-2 flex flex-col">
                                              <div className="font-bold">
                                                {report.categoryName}
                                              </div>

                                              {report.subCategoryName && (
                                                <div className="text-sm text-(--text-secondary)">
                                                  <>{report.subCategoryName}</>
                                                </div>
                                              )}
                                            </div>

                                            {report.categoryId && (
                                              <div className="flex gap-2">
                                                <CustomTooltip
                                                  content={`${!props.isReporter ? c.t("Common/No access") : c.t("Unit/Edit event")}`}
                                                  veryLongDelay={
                                                    props.isReporter == true
                                                  }
                                                  showOnTouch
                                                >
                                                  <button
                                                    type="button"
                                                    className={`${iconButtonPrimaryClass} group`}
                                                    onClick={() => {
                                                      const startDate =
                                                        new Date(
                                                          report.startTime,
                                                        );

                                                      c.toggleReportModal(
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
                                                  content={`${!props.isReporter ? c.t("Common/No access") : c.t("Unit/Delete event")}`}
                                                  veryLongDelay={
                                                    props.isReporter == true
                                                  }
                                                  showOnTouch
                                                >
                                                  <button
                                                    type="button"
                                                    className={`${iconButtonPrimaryClass} group`}
                                                    onClick={() =>
                                                      c.toggleDeleteItemModal(
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
                                          <div className="text-sm text-(--text-secondary)">
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
                                                    `${diffDays} ${diffDays === 1 ? c.t("Common/day") : c.t("Common/days")}`,
                                                  );
                                                if (diffHours > 0)
                                                  parts.push(
                                                    `${diffHours} ${diffHours === 1 ? c.t("Common/hour") : c.t("Common/hours")}`,
                                                  );
                                                if (
                                                  diffMinutes > 0 ||
                                                  parts.length === 0
                                                )
                                                  parts.push(
                                                    `${diffMinutes} ${diffMinutes === 1 ? c.t("Common/minute") : c.t("Common/minutes")}`,
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
                                                <span className="font-semibold text-(--note-error)">
                                                  {c.t("Unit/ongoing")}
                                                </span>
                                              </>
                                            )}
                                          </div>

                                          {!report.categoryId && (
                                            <div className="flex gap-2">
                                              <CustomTooltip
                                                content={`${!props.isReporter ? c.t("Common/No access") : c.t("Unit/Edit event")}`}
                                                veryLongDelay={
                                                  props.isReporter == true
                                                }
                                                showOnTouch
                                              >
                                                <button
                                                  type="button"
                                                  className={`${iconButtonPrimaryClass} group`}
                                                  onClick={() => {
                                                    const startDate = new Date(
                                                      report.startTime,
                                                    );

                                                    c.toggleReportModal(
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
                                                content={`${!props.isReporter ? c.t("Common/No access") : c.t("Unit/Delete event")}`}
                                                veryLongDelay={
                                                  props.isReporter == true
                                                }
                                                showOnTouch
                                              >
                                                <button
                                                  type="button"
                                                  className={`${iconButtonPrimaryClass} group`}
                                                  onClick={() =>
                                                    c.toggleDeleteItemModal(
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

                                        <div className="mt-8 flex justify-end text-sm text-(--text-secondary)">
                                          <div className="flex flex-col text-right">
                                            {report.creationDate && (
                                              <div>
                                                <span className="font-semibold">
                                                  {c.t("Common/Created")}
                                                </span>{" "}
                                                {utcIsoToLocalDateTime(
                                                  report.creationDate,
                                                )}{" "}
                                                {c.t("Common/by")}{" "}
                                                {report.createdBy}
                                              </div>
                                            )}
                                            {report.updateDate && (
                                              <div>
                                                <span className="font-semibold">
                                                  {c.t("Common/Updated")}
                                                </span>{" "}
                                                {utcIsoToLocalDateTime(
                                                  report.updateDate,
                                                )}{" "}
                                                {c.t("Common/by")}{" "}
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
          <CustomTooltip
            content={c.t("Unit/Scroll to top")}
            veryLongDelay
            showOnTouch
          >
            <button
              className={`${buttonSecondaryClass} ml-auto`}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label={c.t("Unit/Scroll to top")}
            >
              <Outline.ChevronUpIcon className="min-h-full min-w-full" />
            </button>
          </CustomTooltip>
        </div>
      </>
    );
  }
};

export default UnitClient;
