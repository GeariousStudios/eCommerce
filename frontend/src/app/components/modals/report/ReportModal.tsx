"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ExclamationTriangleIcon,
  PlusIcon as OutlinePlusIcon,
  XMarkIcon as OutlineXMarkIcon,
  PencilIcon as OutlinePencilIcon,
  TrashIcon as OutlineTrashIcon,
  InformationCircleIcon as OutlineInformationCircleIcon,
} from "@heroicons/react/24/outline";
import {
  PlusIcon as SolidPlusIcon,
  XMarkIcon as SolidXMarkIcon,
  PencilIcon as SolidPencilIcon,
  TrashIcon as SolidTrashIcon,
  InformationCircleIcon as SolidInformationCircleIcon,
} from "@heroicons/react/24/solid";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import Input from "../../common/Input";
import { useToast } from "../../toast/ToastProvider";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  iconButtonPrimaryClass,
} from "@/app/styles/buttonClasses";
import ModalBase, { ModalBaseHandle } from "../ModalBase";
import SingleDropdown from "../../common/SingleDropdown";
import RichTextEditor, {
  RichTextEditorRef,
} from "../../richTextEditor/RichTextEditor";
import HoverIcon from "../../common/HoverIcon";
import {
  localDateTimeToUtcIso,
  utcIsoToLocalDateTime,
} from "@/app/helpers/timeUtils";
import { start } from "repl";
import DeleteModal from "../DeleteModal";
import { useTranslations } from "next-intl";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  unitId: number | undefined;
  selectedDate: string;
  selectedHour: string;
  onItemUpdated: () => void;
  reportId?: number;
  categoryIds: number[];
};

type Report = {
  id?: string;
  categoryId?: string;
  subCategoryId?: string;
  categoryName?: string;
  subCategoryName?: string;
  startTime: string;
  stopTime: string;
  content: string;
  hour?: string;
  date?: string;
  creationDate?: string;
  createdBy?: string;
  updateDate?: string;
  updatedBy?: string;
};

type Category = {
  id: string;
  name: string;
  subCategories: {
    id: string;
    name: string;
    categoryId: string;
  }[];
};

const ReportModal = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- Refs ---
  const editorRef = useRef<RichTextEditorRef>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const modalRef = useRef<ModalBaseHandle>(null);
  const getScrollEl = () => modalRef.current?.getScrollEl() ?? null;
  const hasSetInitialContent = useRef(false);

  // --- States ---
  const [isDirty, setIsDirty] = useState(false);

  const [reports, setReports] = useState<Report[]>([]);
  const [currentReport, setCurrentReport] = useState<Report>({
    id: "",
    categoryId: "",
    subCategoryId: "",
    startTime: "",
    stopTime: "",
    content: "",
    hour: "",
    date: "",
  });
  const [isAddingReport, setIsAddingReport] = useState(false);
  const [isEditingExistingReport, setIsEditingExistingReport] = useState(false);
  const [canAddReport, setCanAddReport] = useState(true);
  const [hiddenReportId, setHiddenReportId] = useState<string | null>(null);
  const [backupEditedReport, setBackupEditedReport] = useState<Report | null>(
    null,
  );
  const [conflictReport, setConflictReport] = useState<Report | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedHour, setSelectedHour] = useState<string>("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | undefined>();

  // --- Other ---
  const token = localStorage.getItem("token");
  const { notify } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // --- Fetch data ---
  useEffect(() => {
    if (!props.unitId || !selectedHour || !selectedDate) {
      return;
    }

    checkIfCanAddReport();
    fetchReportsForHour();
  }, [props.unitId, selectedHour, selectedDate]);

  useEffect(() => {
    if (!props.isOpen) {
      return;
    }

    fetchCategories();

    setReports([]);
    setSelectedHour(props.selectedHour);
    setSelectedDate(props.selectedDate);
    setIsAddingReport(false);
    setCanAddReport(true);
    setIsDirty(false);
    hasSetInitialContent.current = false;
    editorRef.current?.setContent("");

    if (!isEditingExistingReport) {
      setCurrentReport({
        categoryId: "",
        subCategoryId: "",
        categoryName: "",
        subCategoryName: "",
        startTime: "",
        stopTime: "",
        content: "",
        hour: "",
        date: "",
      });

      setIsEditingExistingReport(false);
    }

    const initEditExistingReport = async () => {
      if (
        !props.reportId ||
        !props.unitId ||
        !props.selectedDate ||
        !props.selectedHour
      ) {
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/report/${props.reportId}`, {
          headers: {
            "X-User-Language": localStorage.getItem("language") || "sv",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          notify("error", result.message);
          return;
        }

        setSelectedHour(props.selectedHour);
        setSelectedDate(props.selectedDate);

        setIsEditingExistingReport(true);
        setIsAddingReport(true);
        setBackupEditedReport({ ...result, id: String(result.id) });
        setHiddenReportId(result.id);
      } catch (err) {
        notify("error", t("Manage/Failed to fetch") + t("Common/report"));
      }
    };

    initEditExistingReport();
  }, [props.isOpen]);

  // --- POPULATE FIELDS ---
  useEffect(() => {
    if (isEditingExistingReport && backupEditedReport) {
      setCurrentReport({
        ...backupEditedReport,
        startTime: backupEditedReport.startTime.slice(0, 16),
        stopTime: backupEditedReport.stopTime
          ? backupEditedReport.stopTime.slice(0, 16)
          : "",
        content: backupEditedReport.content ?? "",
      });
      editorRef.current?.setContent(backupEditedReport.content);
      hasSetInitialContent.current = true;
    }
  }, [isEditingExistingReport, backupEditedReport]);

  // --- BACKEND ---
  // --- Fetch reports ---
  const fetchReportsForHour = async () => {
    if (!selectedHour) {
      return;
    }

    try {
      const response = await fetch(
        `${apiUrl}/report/${props.unitId}/${selectedDate}/${selectedHour}`,
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
        return;
      }

      setReports(result);
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Fetch categories ---
  const fetchCategories = async () => {
    if (!props.unitId) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/category/unit/${props.unitId}`, {
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        notify("error", result?.message ?? t("Modal/Unknown error"));
        return;
      }

      if (Array.isArray(result) && result.length > 0) {
        const sorted = [...result].sort((a, b) => {
          return (
            props.categoryIds.indexOf(Number(a.id)) -
            props.categoryIds.indexOf(Number(b.id))
          );
        });
        setCategories(sorted);
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Report check and create/update ---
  const checkIfCanAddReport = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/report/can-add/${props.unitId}/${selectedDate}/${selectedHour}`,
        {
          headers: {
            "X-User-Language": localStorage.getItem("language") || "sv",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();
      setCanAddReport(result.canAdd);
      setConflictReport(result.conflictReport || null);
    } catch (err) {
      notify("error", t("ReportModal/Failed to check"));
    }
  };

  const createReport = async (report: Report) => {
    const startTimeIso = localDateTimeToUtcIso(report.startTime);
    const date = report.startTime.slice(0, 10);
    const hour = parseInt(report.startTime.slice(11, 13), 10);

    try {
      const response = await fetch(`${apiUrl}/report/create`, {
        method: "POST",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          unitId: props.unitId,
          startTime: startTimeIso,
          stopTime: report.stopTime || null,
          categoryId: report.categoryId || null,
          subCategoryId: report.subCategoryId || null,
          categoryName: report.categoryName || null,
          subCategoryName: report.subCategoryName || null,
          content: report.content,
          date,
          hour,
        }),
      });

      const result = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        return false;
      }

      if (!response.ok) {
        notify("error", result?.message ?? t("Modal/Unknown error"));
        return false;
      }

      await fetchReportsForHour();
      props.onItemUpdated();
      notify(
        "success",
        t("ReportModal/Disruption report") + t("Modal/created"),
      );
      return true;
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
      return false;
    }
  };

  const updateReport = async (report: Report) => {
    const startTimeIso = localDateTimeToUtcIso(report.startTime);
    const date = report.startTime.slice(0, 10);
    const hour = parseInt(report.startTime.slice(11, 13), 10);

    try {
      const response = await fetch(`${apiUrl}/report/update/${report.id}`, {
        method: "PUT",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startTime: startTimeIso,
          stopTime: report.stopTime || null,
          categoryId: report.categoryId || null,
          subCategoryId: report.subCategoryId || null,
          content: report.content,
          date,
          hour,
        }),
      });

      const result = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        return false;
      }

      if (!response.ok) {
        notify("error", result?.message ?? t("Modal/Unknown error"));
        return false;
      }

      await fetchReportsForHour();
      props.onItemUpdated();
      notify(
        "success",
        t("ReportModal/Disruption report") + t("Modal/updated"),
      );
      return true;
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
      return false;
    }
  };

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
      props.onItemUpdated();
      notify(
        "success",
        t("ReportModal/Disruption report") + t("Manage/deleted1"),
      );
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Update reports ---
  const updateReports = async (event: FormEvent) => {
    event.preventDefault();
    props.onClose();
    props.onItemUpdated();
    notify("success", t("Common/Changes saved"), 4000);
  };

  // const handleSaveClick = () => {
  //   resetReport();
  //   formRef.current?.requestSubmit();
  // };

  const handleConflictClick = () => {
    if (!conflictReport?.id) {
      return;
    }

    const newDate = String(conflictReport.date);
    const newHour = String(conflictReport.hour);

    setSelectedDate(newDate);
    setSelectedHour(newHour);

    fetchReportsForHour();
  };

  const resetReport = () => {
    if (isEditingExistingReport && backupEditedReport) {
      setReports((prev) =>
        prev.map((r) =>
          r.id === backupEditedReport.id ? backupEditedReport : r,
        ),
      );
    }

    setValidationError(null);
    setIsEditingExistingReport(false);
    setIsAddingReport(false);
    setHiddenReportId(null);
    setCurrentReport({
      id: "",
      categoryId: "",
      subCategoryId: "",
      categoryName: "",
      subCategoryName: "",
      startTime: "",
      stopTime: "",
      content: "",
      hour: "",
      date: "",
    });
    editorRef.current?.setContent("");
  };

  // --- Validate times ---
  const validateTimes = async (
    unitId: number,
    startTime: string,
    stopTime: string,
    reportId?: string,
  ) => {
    try {
      const params = new URLSearchParams({
        unitId: String(unitId),
        startTime: localDateTimeToUtcIso(startTime),
        ...(stopTime ? { stopTime: localDateTimeToUtcIso(stopTime) } : {}),
        ...(reportId ? { reportId: String(reportId) } : {}),
      });

      const response = await fetch(`${apiUrl}/report/validate-time?${params}`, {
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Serverfel: ${text || response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      return { isValid: true };
    }
  };

  useEffect(() => {
    // const delay = setTimeout(() => {
    if (!currentReport.startTime || !props.unitId) {
      return;
    }

    validateTimes(
      props.unitId,
      currentReport.startTime,
      currentReport.stopTime,
      currentReport.id ? currentReport.id : "",
    ).then((result) => {
      if (!result.isValid) {
        setValidationError(result.message);
      } else {
        setValidationError(null);
      }
    });
    // }, 50);

    // return () => clearTimeout(delay);
  }, [currentReport.startTime, currentReport.stopTime, currentReport.id]);

  // --- SET/UNSET IS DIRTY ---
  useEffect(() => {
    const dirty =
      currentReport.content !== "" &&
      currentReport.content !== "<p><br></p>" &&
      currentReport.content !== backupEditedReport?.content;

    setIsDirty(dirty);
  }, [currentReport.content]);

  useEffect(() => {
    if (
      !editorRef.current ||
      !isEditorReady ||
      !currentReport.content ||
      hasSetInitialContent.current
    ) {
      return;
    }

    try {
      editorRef.current.setContent(currentReport.content);
      hasSetInitialContent.current = true;
    } catch (e) {}
  }, [isEditorReady, currentReport.content]);

  // --- 24 HOUR LIST / 59 MINUTE LIST ---
  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    label: `${i.toString().padStart(2, "0")}:00`,
    value: String(i),
  }));

  // --- DATE SELECTOR ---
  const goToPreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  // --- TOGGLE MODAL(S) ---
  // --- Delete ---
  const toggleDeleteItemModal = (id?: string) => {
    setDeletingItemId(id);
    setIsDeleteModalOpen((prev) => !prev);
  };

  return (
    <>
      {!isEditorReady && (
        <div style={{ display: "none" }}>
          <RichTextEditor
            ref={editorRef}
            value=""
            name="editor-preload"
            onReady={() => setIsEditorReady(true)}
            onChange={() => {}}
          />
        </div>
      )}

      {props.isOpen && (
        <>
          <form ref={formRef} onSubmit={(e) => updateReports(e)}>
            <ModalBase
              ref={modalRef}
              isOpen={props.isOpen}
              onClose={() => {
                resetReport();
                props.onClose();
              }}
              icon={ExclamationTriangleIcon}
              label={`${t("Unit/Report disruptions")}: ${selectedDate}`}
              confirmOnClose
              isDirty={isDirty}
              disableClickOutside={isDeleteModalOpen}
            >
              <ModalBase.Content>
                <div className="flex items-center gap-2">
                  <hr className="w-12 text-[var(--border-tertiary)]" />
                  <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                    {t("ReportModal/Info1")}
                  </h3>
                  <hr className="w-full text-[var(--border-tertiary)]" />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4">
                  <div className="ml-auto flex w-full items-center">
                    <button
                      type="button"
                      className={`${buttonSecondaryClass} rounded-r-none`}
                      onClick={goToPreviousDay}
                      aria-label={t("Unit/Previous day")}
                    >
                      <ChevronLeftIcon className="min-h-full min-w-full" />
                    </button>
                    <Input
                      type="date"
                      id="selectedDate"
                      label={t("Common/Date")}
                      value={selectedDate}
                      onChange={(val) => setSelectedDate(String(val))}
                      onModal
                      required
                      notRounded
                    />
                    <button
                      type="button"
                      className={`${buttonSecondaryClass} rounded-l-none`}
                      onClick={goToNextDay}
                      aria-label={t("Unit/Next day")}
                    >
                      <ChevronRightIcon className="min-h-full min-w-full" />
                    </button>
                  </div>

                  <SingleDropdown
                    addSpacer={reports.length === 0}
                    scrollContainer={getScrollEl}
                    customSpace={3}
                    id="selectedHour"
                    label={t("Common/Hour")}
                    value={selectedHour}
                    onChange={(val) => setSelectedHour(String(val))}
                    onModal
                    required
                    options={hourOptions}
                  />
                </div>

                <div
                  className={`${selectedHour && selectedDate ? "" : "pointer-events-none opacity-25"} flex flex-col gap-4`}
                >
                  <div className="mt-8 flex items-center gap-2">
                    <hr className="w-12 text-[var(--border-tertiary)]" />
                    <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                      {t("ReportModal/Info2")}
                    </h3>
                    <hr className="w-full text-[var(--border-tertiary)]" />
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:gap-6">
                    {!canAddReport &&
                    conflictReport?.startTime.slice(0, 13) !==
                      `${selectedDate}T${selectedHour.padStart(2, "0")}` ? (
                      <div className="text-sm text-[var(--note-error)]">
                        {t("ReportModal/Blocking stop")}
                        <br />
                        <button
                          type="button"
                          onClick={handleConflictClick}
                          className="cursor-pointer font-semibold underline"
                        >
                          {conflictReport?.stopTime ? (
                            `${conflictReport?.startTime.slice(0, 16).replace("T", " ")} - ${conflictReport.stopTime.slice(0, 16).replace("T", " ")}`
                          ) : (
                            <>
                              {" "}
                              {conflictReport?.startTime
                                .slice(0, 16)
                                .replace("T", " ")}{" "}
                              - <span className="">{t("Unit/ongoing")}</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      !isAddingReport && (
                        <button
                          className={`${buttonPrimaryClass} flex w-full items-center justify-center gap-2`}
                          onClick={() => {
                            setCurrentReport({
                              id: "",
                              categoryId: "",
                              subCategoryId: "",
                              categoryName: "",
                              subCategoryName: "",
                              content: "",
                              startTime: `${selectedDate}T${selectedHour.padStart(2, "0")}:00`,
                              stopTime: "",
                              hour: "",
                              date: "",
                            });
                            setIsAddingReport(true);
                          }}
                          tabIndex={selectedHour && selectedDate ? 0 : -1}
                          // disabled={!selectedDate || !selectedHour}
                        >
                          <HoverIcon
                            outline={OutlinePlusIcon}
                            solid={SolidPlusIcon}
                            className="h-6 min-h-6 w-6 min-w-6"
                          />
                          {t("ReportModal/Report new disruption")}
                        </button>
                      )
                    )}

                    {!isAddingReport && reports.length > 0 && (
                      <>
                        {reports
                          .filter((r) => r.id !== hiddenReportId)
                          .map((report, index) => (
                            <div
                              key={report.id}
                              className="relative flex flex-col gap-4 rounded-2xl bg-[var(--bg-main)] p-4"
                            >
                              {report.categoryId && (
                                <div className="flex justify-between gap-4">
                                  <div className="mb-2 flex flex-col">
                                    <div className="font-bold">
                                      {categories.find(
                                        (c) =>
                                          String(c.id) ===
                                          String(report.categoryId),
                                      )?.name ?? report.categoryName}
                                    </div>

                                    <div className="text-sm text-[var(--text-secondary)]">
                                      {report.subCategoryId && (
                                        <>
                                          {categories
                                            .find(
                                              (c) =>
                                                String(c.id) ===
                                                String(report.categoryId),
                                            )
                                            ?.subCategories.find(
                                              (sc) =>
                                                String(sc.id) ===
                                                String(report.subCategoryId),
                                            )?.name ?? report.subCategoryName}
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      className={`${iconButtonPrimaryClass} group`}
                                      onClick={() => {
                                        setIsEditingExistingReport(true);
                                        setIsAddingReport(true);
                                        setBackupEditedReport(report);
                                      }}
                                      tabIndex={
                                        selectedHour && selectedDate ? 0 : -1
                                      }
                                    >
                                      <HoverIcon
                                        outline={OutlinePencilIcon}
                                        solid={SolidPencilIcon}
                                        className="h-6 min-h-6 w-6 min-w-6"
                                      />
                                    </button>
                                    <button
                                      type="button"
                                      className={`${iconButtonPrimaryClass} group`}
                                      onClick={() =>
                                        toggleDeleteItemModal(report.id)
                                      }
                                      tabIndex={
                                        selectedHour && selectedDate ? 0 : -1
                                      }
                                    >
                                      <HoverIcon
                                        outline={OutlineTrashIcon}
                                        solid={SolidTrashIcon}
                                        className="h-6 min-h-6 w-6 min-w-6"
                                      />
                                    </button>
                                  </div>
                                </div>
                              )}
                              <div className="flex justify-between gap-2">
                                <div className="text-sm text-[var(--text-secondary)]">
                                  {report.stopTime ? (
                                    (() => {
                                      const start = new Date(report.startTime);
                                      const stop = new Date(report.stopTime);
                                      const diffMs =
                                        stop.getTime() - start.getTime();
                                      const totalMinutes = Math.floor(
                                        diffMs / (1000 * 60),
                                      );
                                      const diffDays = Math.floor(
                                        totalMinutes / (60 * 24),
                                      );
                                      const diffHours = Math.floor(
                                        (totalMinutes % (60 * 24)) / 60,
                                      );
                                      const diffMinutes = totalMinutes % 60;

                                      const parts: string[] = [];
                                      if (diffDays > 0)
                                        parts.push(
                                          `${diffDays} ${diffDays === 1 ? t("Common/day") : t("Common/days")}`,
                                        );
                                      if (diffHours > 0)
                                        parts.push(
                                          `${diffHours} ${diffHours === 1 ? t("Common/hour") : t("Common/hours")}`,
                                        );
                                      if (diffMinutes > 0 || parts.length === 0)
                                        parts.push(
                                          `${diffMinutes} ${diffMinutes === 1 ? t("Common/minute") : t("Common/minutes")}`,
                                        );

                                      const duration = parts.join(" ");

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
                                    <button
                                      type="button"
                                      className={`${iconButtonPrimaryClass} group`}
                                      onClick={() => {
                                        setIsEditingExistingReport(true);
                                        setBackupEditedReport(report);
                                        setIsAddingReport(true);
                                        if (report.id) {
                                          setHiddenReportId(report.id);
                                        }
                                      }}
                                    >
                                      <HoverIcon
                                        outline={OutlinePencilIcon}
                                        solid={SolidPencilIcon}
                                        className="h-6 min-h-6 w-6 min-w-6"
                                      />
                                    </button>
                                    <button
                                      type="button"
                                      className={`${iconButtonPrimaryClass} group`}
                                      onClick={() =>
                                        toggleDeleteItemModal(report.id)
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
                                        {t("Common/Created")}
                                      </span>{" "}
                                      {utcIsoToLocalDateTime(
                                        report.creationDate,
                                      )}{" "}
                                      {t("Common/by")} {report.createdBy}
                                    </div>
                                  )}
                                  {report.updateDate && (
                                    <div>
                                      <span className="font-semibold">
                                        {t("Common/Updated")}
                                      </span>{" "}
                                      {utcIsoToLocalDateTime(report.updateDate)}{" "}
                                      {t("Common/by")} {report.updatedBy}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </>
                    )}

                    {isAddingReport && (
                      <div className="flex flex-col gap-6 rounded-2xl bg-[var(--bg-main)] p-8">
                        {categories.length > 0 && (
                          <div
                            className={`${currentReport.categoryId && categories.map((s) => (s.subCategories.length > 0 ? "sm:grid-cols-2" : "sm:grid-cols-1"))} grid grid-cols-1 gap-6 sm:gap-4`}
                          >
                            <SingleDropdown
                              id="category"
                              label={t("Common/Category")}
                              value={
                                currentReport.categoryId
                                  ? String(currentReport.categoryId)
                                  : ""
                              }
                              options={[
                                {
                                  label: t("ReportModal/Choose category"),
                                  value: "",
                                },
                                ...categories.map((c) => ({
                                  label: c.name,
                                  value: String(c.id),
                                })),
                              ]}
                              onChange={(val) =>
                                setCurrentReport((prev) => ({
                                  ...prev,
                                  categoryId: String(val),
                                  categoryName:
                                    categories.find((c) => String(c.id) === val)
                                      ?.name ?? "",
                                }))
                              }
                              emptyOption
                            />
                            {(() => {
                              const selectedCategory = categories.find(
                                (c) =>
                                  String(c.id) ===
                                  String(currentReport.categoryId),
                              );
                              const subs =
                                selectedCategory?.subCategories ?? [];

                              return subs.length > 0 ? (
                                <SingleDropdown
                                  id="subCategory"
                                  label={t("Common/Sub category")}
                                  value={
                                    currentReport.subCategoryId
                                      ? String(currentReport.subCategoryId)
                                      : ""
                                  }
                                  onChange={(val) =>
                                    setCurrentReport((prev) => ({
                                      ...prev,
                                      subCategoryId: String(val),
                                      subCategoryName:
                                        categories
                                          .find(
                                            (c) =>
                                              String(c.id) ===
                                              String(currentReport.categoryId),
                                          )
                                          ?.subCategories.find(
                                            (sc) => String(sc.id) === val,
                                          )?.name ?? "",
                                    }))
                                  }
                                  options={[
                                    {
                                      label: t(
                                        "ReportModal/Choose sub category",
                                      ),
                                      value: "",
                                    },
                                    ...subs
                                      .filter(
                                        (sc) =>
                                          sc.id !== undefined &&
                                          sc.name !== undefined,
                                      )
                                      .map((sc) => ({
                                        label: sc.name,
                                        value: String(sc.id),
                                      })),
                                  ]}
                                  emptyOption
                                />
                              ) : null;
                            })()}
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4">
                          <Input
                            type="datetime-local"
                            id="startTime"
                            label={t("ReportModal/Start time")}
                            value={
                              currentReport.startTime === ""
                                ? `${selectedDate}T${selectedHour.padStart(2, "0")}:00`
                                : String(currentReport.startTime)
                            }
                            onChange={(val) => {
                              const start = String(val);
                              setCurrentReport((prev) => {
                                const updated = {
                                  ...prev,
                                  startTime: start,
                                };

                                validateTimes(
                                  props.unitId!,
                                  updated.startTime,
                                  updated.stopTime,
                                  updated.id ? updated.id : undefined,
                                ).then((result) => {
                                  if (!result.isValid) {
                                    setValidationError(result.message);
                                  } else {
                                    setValidationError(null);
                                  }
                                });
                                return updated;
                              });
                            }}
                            required
                          />

                          <Input
                            type="datetime-local"
                            id="stopTime"
                            label={t("ReportModal/Stop time")}
                            value={String(currentReport.stopTime) || ""}
                            onChange={(val) => {
                              const stop = String(val);
                              setCurrentReport((prev) => {
                                const updated = {
                                  ...prev,
                                  stopTime: stop,
                                };

                                validateTimes(
                                  props.unitId!,
                                  updated.startTime,
                                  updated.stopTime,
                                  updated.id ? updated.id : undefined,
                                ).then((result) => {
                                  if (!result.isValid) {
                                    setValidationError(result.message);
                                  } else {
                                    setValidationError(null);
                                  }
                                });
                                return updated;
                              });
                            }}
                          />
                        </div>

                        <RichTextEditor
                          ref={editorRef}
                          value={currentReport.content}
                          name="content"
                          onReady={() => {
                            setIsEditorReady(true);
                          }}
                          onChange={(val) =>
                            setCurrentReport((prev) => ({
                              ...prev,
                              content: val,
                            }))
                          }
                        />

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-4">
                          <button
                            className={`${buttonPrimaryClass} col-span-1 flex w-full items-center justify-center gap-2 sm:col-span-2`}
                            type="button"
                            onClick={async () => {
                              if (!currentReport.startTime) {
                                currentReport.startTime = `${selectedDate}T${selectedHour.padStart(2, "0")}:00`;
                              }

                              let success = false;

                              if (currentReport.id) {
                                success = await updateReport(currentReport);
                              } else {
                                success = await createReport(currentReport);
                              }

                              if (!success) {
                                return;
                              }

                              setCurrentReport({
                                categoryId: "",
                                subCategoryId: "",
                                categoryName: "",
                                subCategoryName: "",
                                startTime: "",
                                stopTime: "",
                                content: "",
                                id: "",
                              });
                              editorRef.current?.setContent("");

                              setHiddenReportId(null);
                              setIsAddingReport(false);
                            }}
                            disabled={!!validationError}
                          >
                            <HoverIcon
                              outline={OutlinePlusIcon}
                              solid={SolidPlusIcon}
                              className="h-6 min-h-6 w-6 min-w-6"
                            />
                            {currentReport.id
                              ? t("Modal/Save")
                              : t("Common/Add")}
                          </button>

                          <button
                            className={`${buttonSecondaryClass} flex w-full items-center justify-center gap-2`}
                            type="button"
                            onClick={() => {
                              resetReport();
                            }}
                          >
                            <HoverIcon
                              outline={OutlineXMarkIcon}
                              solid={SolidXMarkIcon}
                              className="h-6 min-h-6 w-6 min-w-6"
                            />
                            {t("Modal/Abort")}
                          </button>
                        </div>

                        {validationError && (
                          <div
                            className="-mt-3 text-sm font-semibold text-[var(--note-error)]"
                            dangerouslySetInnerHTML={{
                              __html: validationError,
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <span className="mb-4" />
              </ModalBase.Content>

              <ModalBase.Footer>
                {/* <button
                type="button"
                onClick={handleSaveClick}
                className={`${buttonPrimaryClass} xs:col-span-2 col-span-3`}
              >
                Spara
              </button>
              <button
                type="button"
                onClick={() => modalRef.current?.requestClose()}
                className={`${buttonSecondaryClass} xs:col-span-1 col-span-3`}
              >
                Avbryt
              </button> */}
                <button
                  type="button"
                  onClick={() => modalRef.current?.requestClose()}
                  className={`${buttonSecondaryClass} col-span-3`}
                >
                  {t("Common/Close")}
                </button>
              </ModalBase.Footer>
            </ModalBase>
          </form>

          <DeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              toggleDeleteItemModal();
              setDeletingItemId(undefined);
            }}
            onConfirm={() => {
              deleteReport(String(deletingItemId));
              setReports((prev) => prev.filter((r) => r.id !== deletingItemId));
              toggleDeleteItemModal();
            }}
            nestedModal
          />
        </>
      )}
    </>
  );
};

export default ReportModal;
