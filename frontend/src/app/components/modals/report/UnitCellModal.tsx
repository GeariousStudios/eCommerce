"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import Input from "../../common/Input";
import { useToast } from "../../toast/ToastProvider";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
} from "@/app/styles/buttonClasses";
import ModalBase, { ModalBaseHandle } from "../ModalBase";
import SingleDropdown from "../../common/SingleDropdown";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useTranslations } from "next-intl";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  unitId: number | undefined;
  selectedDate: string;
  selectedHour: string;
  onItemUpdated: () => void;
};

type UnitColumnOptions = {
  id: number;
  name: string;
};

const UnitCellModal = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- Refs ---
  const formRef = useRef<HTMLFormElement>(null);
  const modalRef = useRef<ModalBaseHandle>(null);
  const getScrollEl = () => modalRef.current?.getScrollEl() ?? null;

  // --- States ---
  const [unitColumns, setUnitColumns] = useState<UnitColumnOptions[]>([]);
  const [unitCells, setUnitCells] = useState<
    Record<number, string | number | boolean>
  >({});
  const [unitColumnDataTypes, setUnitColumnDataTypes] = useState<
    Record<number, string>
  >({});

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedHour, setSelectedHour] = useState<string>("");

  // --- Other ---
  const token = localStorage.getItem("token");
  const { notify } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // --- Fetch data ---
  useEffect(() => {
    if (!props.isOpen) {
      return;
    }

    setSelectedHour(props.selectedHour ?? "");
    setSelectedDate(props.selectedDate);
    setUnitCells({});

    fetchUnitColumnsForUnit();
  }, [props.isOpen]);

  useEffect(() => {
    if (
      !props.unitId ||
      !selectedDate ||
      !selectedHour ||
      Object.keys(unitColumnDataTypes).length === 0
    ) {
      return;
    }

    fetchUnitCellsForHour(selectedDate, selectedHour);
  }, [props.unitId, selectedDate, selectedHour, unitColumnDataTypes]);

  // --- BACKEND ---
  // --- Fetch unit columns ---
  const fetchUnitColumnsForUnit = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/unit-column/unit/${props.unitId}`,
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

      const dataTypes: Record<number, string> = {};
      const defaultValues: Record<number, string | number | boolean> = {};
      result.forEach((col: any) => {
        dataTypes[col.id] = col.dataType;
        defaultValues[col.id] = col.dataType === "Boolean" ? false : "";
      });

      setUnitColumns(result);
      setUnitColumnDataTypes(dataTypes);
      setUnitCells(defaultValues);
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Fetch unit cells ---
  const fetchUnitCellsForHour = async (date: string, hour: string) => {
    if (!date || !hour) {
      return;
    }

    try {
      const response = await fetch(
        `${apiUrl}/unit-cell/${props.unitId}/${date}/${hour}`,
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

      const newValues: Record<number, string | number | boolean> = {};
      for (const [id, type] of Object.entries(unitColumnDataTypes)) {
        newValues[Number(id)] = type === "Boolean" ? false : "";
      }

      for (const cell of result) {
        const dataType = unitColumnDataTypes[cell.columnId];
        if (!dataType) {
          continue;
        }

        newValues[cell.columnId] =
          dataType === "Boolean"
            ? cell.value === "true"
            : dataType === "Number"
              ? (cell.intValue ?? undefined)
              : (cell.value ?? "");
      }

      setUnitCells(newValues);
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Update unit cells ---
  const values = Object.entries(unitCells).map(([columnId, value]) => {
    const type = unitColumnDataTypes[Number(columnId)];

    return {
      columnId: Number(columnId),
      value:
        type === "Boolean"
          ? value === true
            ? "true"
            : "false"
          : typeof value === "string"
            ? value
            : undefined,
      intValue:
        type === "Number" && typeof value === "number" ? value : undefined,
    };
  });

  const updateUnitCells = async (event: FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch(
        `${apiUrl}/unit-cell/update-all/${props.unitId}`,
        {
          method: "PUT",
          headers: {
            "X-User-Language": localStorage.getItem("language") || "sv",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            unitId: props.unitId,
            date: selectedDate,
            hour: Number(selectedHour),
            values,
          }),
        },
      );

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
      notify("success", t("Common/Changes saved"), 4000);
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  const handleSaveClick = () => {
    formRef.current?.requestSubmit();
  };

  // --- 24 HOUR LIST ---
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

  return (
    <>
      {props.isOpen && (
        <form ref={formRef} onSubmit={(e) => updateUnitCells(e)}>
          <ModalBase
            ref={modalRef}
            isOpen={props.isOpen}
            onClose={() => {
              props.onClose();
            }}
            icon={DocumentTextIcon}
            label={`${t("Unit/Report data")}: ${selectedDate}`}
            confirmOnClose
          >
            <ModalBase.Content>
              <div className="flex items-center gap-2">
                <hr className="w-12 text-[var(--border-tertiary)]" />
                <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                  {t("UnitCellModal/Info1")}
                </h3>
                <hr className="w-full text-[var(--border-tertiary)]" />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                  addSpacer={unitColumns.length < 2}
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
                className={`${selectedHour && selectedDate ? "" : "pointer-events-none opacity-25"} flex flex-col gap-6`}
              >
                <div className="mt-8 flex items-center gap-2">
                  <hr className="w-12 text-[var(--border-tertiary)]" />
                  <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                    {t("UnitCellModal/Info2")}
                  </h3>
                  <hr className="w-full text-[var(--border-tertiary)]" />
                </div>

                <div className="flex flex-col gap-6">
                  {unitColumns.map((col) => {
                    const value = unitCells[col.id];
                    const type = unitColumnDataTypes[col.id];

                    if (type === "Boolean") {
                      return (
                        <SingleDropdown
                          key={col.id}
                          id={`col-${col.id}`}
                          label={col.name}
                          value={String(value)}
                          options={[
                            { label: t("Common/Yes"), value: "true" },
                            { label: t("Common/No"), value: "false" },
                          ]}
                          onChange={(val) =>
                            setUnitCells((prev) => ({
                              ...prev,
                              [col.id]: val === "true",
                            }))
                          }
                          onModal
                          tabIndex={selectedHour && selectedDate ? 0 : -1}
                        />
                      );
                    }

                    return (
                      <Input
                        key={col.id}
                        id={`col-${col.id}`}
                        label={col.name}
                        type={type === "Number" ? "number" : "text"}
                        value={value === undefined ? "" : String(value)}
                        onChange={(val) =>
                          setUnitCells((prev) => ({
                            ...prev,
                            [col.id]:
                              type === "Number"
                                ? val === "" || Number(val)
                                : val,
                          }))
                        }
                        onModal
                        tabIndex={selectedHour && selectedDate ? 0 : -1}
                      />
                    );
                  })}
                </div>
              </div>

              <span className="mb-4" />
            </ModalBase.Content>

            <ModalBase.Footer>
              <button
                type="button"
                onClick={handleSaveClick}
                className={`${buttonPrimaryClass} xs:col-span-2 col-span-3`}
              >
                {t("Modal/Save")}
              </button>
              <button
                type="button"
                onClick={() => modalRef.current?.requestClose()}
                className={`${buttonSecondaryClass} xs:col-span-1 col-span-3`}
              >
                {t("Modal/Abort")}
              </button>
            </ModalBase.Footer>
          </ModalBase>
        </form>
      )}
    </>
  );
};

export default UnitCellModal;
