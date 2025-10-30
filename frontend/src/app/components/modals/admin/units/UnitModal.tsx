"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import Input from "../../../common/Input";
import { useToast } from "../../../toast/ToastProvider";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  roundedButtonClass,
  switchClass,
  switchKnobClass,
} from "@/app/styles/buttonClasses";
import ModalBase, { ModalBaseHandle } from "../../ModalBase";
import SingleDropdown from "../../../common/SingleDropdown";
import MultiDropdown from "../../../common/MultiDropdown";
import { XMarkIcon } from "@heroicons/react/20/solid";
import DragDrop from "../../../common/DragDrop";
import { useTranslations } from "next-intl";
import { unitConstraints } from "@/app/helpers/inputConstraints";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  itemId?: number | null;
  onItemUpdated: () => void;
};

type UnitGroupOptions = {
  id: number;
  name: string;
};

type UnitColumnOptions = {
  id: number;
  name: string;
};

type CategoryOptions = {
  id: number;
  name: string;
};

type ShiftOptions = {
  id: number;
  name: string;
};

type StopTypeOptions = {
  id: number;
  name: string;
};

const UnitModal = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- Refs ---
  const formRef = useRef<HTMLFormElement>(null);
  const modalRef = useRef<ModalBaseHandle>(null);
  const getScrollEl = () => modalRef.current?.getScrollEl() ?? null;

  // --- States ---
  const [name, setName] = useState("");
  const [isHidden, setIsHidden] = useState(false);
  const [lightColorHex, setLightColorHex] = useState("#212121");
  const [darkColorHex, setDarkColorHex] = useState("#e0e0e0");
  const [unitGroup, setUnitGroup] = useState("");
  const [unitColumnIds, setUnitColumnIds] = useState<number[]>([]);
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [shiftIds, setShiftIds] = useState<number[]>([]);
  const [stopTypeIds, setStopTypeIds] = useState<number[]>([]);
  const [unitGroups, setUnitGroups] = useState<UnitGroupOptions[]>([]);
  const [unitColumns, setUnitColumns] = useState<UnitColumnOptions[]>([]);
  const [categories, setCategories] = useState<CategoryOptions[]>([]);
  const [shifts, setShifts] = useState<ShiftOptions[]>([]);
  const [stopTypes, setStopTypes] = useState<StopTypeOptions[]>([]);

  const [originalName, setOriginalName] = useState("");
  const [originalUnitGroup, setOriginalUnitGroup] = useState("");
  const [originalUnitColumnIds, setOriginalUnitColumnIds] = useState<number[]>(
    [],
  );
  const [originalCategoryIds, setOriginalCategoryIds] = useState<number[]>([]);
  const [originalShiftIds, setOriginalShiftIds] = useState<number[]>([]);
  const [originalStopTypeIds, setOriginalStopTypeIds] = useState<number[]>([]);
  const [originalIsHidden, setOriginalIsHidden] = useState(false);
  const [originalLightColorHex, setOriginalLightColorHex] = useState("#212121");
  const [originalDarkColorHex, setOriginalDarkColorHex] = useState("#e0e0e0");
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

    fetchUnitGroups();
    fetchUnitColumns();
    fetchCategories();
    fetchShifts();
    fetchStopTypes();

    if (props.itemId !== null && props.itemId !== undefined) {
      fetchUnit();
    } else {
      setName("");
      setOriginalName("");

      setIsHidden(false);
      setOriginalIsHidden(false);

      setLightColorHex("#212121");
      setOriginalLightColorHex("#212121");

      setDarkColorHex("#e0e0e0");
      setOriginalDarkColorHex("#e0e0e0");

      setUnitGroup("");
      setOriginalUnitGroup("");

      setUnitColumnIds([]);
      setOriginalUnitColumnIds([]);

      setCategoryIds([]);
      setOriginalCategoryIds([]);

      setShiftIds([]);
      setOriginalShiftIds([]);

      setStopTypeIds([]);
      setOriginalStopTypeIds([]);
    }
  }, [props.isOpen, props.itemId]);

  // --- BACKEND ---
  // --- Add unit ---
  const addUnit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/unit/create`, {
        method: "POST",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          lightColorHex,
          darkColorHex,
          unitGroupId: parseInt(unitGroup),
          isHidden,
          unitColumnIds,
          categoryIds,
          shiftIds,
          stopTypeIds,
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
      window.dispatchEvent(new Event("unit-list-updated"));
      notify("success", t("Common/Unit") + t("Modal/created"), 4000);
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Fetch unit groups ---
  const fetchUnitGroups = async () => {
    try {
      const response = await fetch(`${apiUrl}/unit-group`, {
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
        setUnitGroups(result.items);
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Fetch unit columns ---
  const fetchUnitColumns = async () => {
    try {
      const response = await fetch(`${apiUrl}/unit-column`, {
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
        setUnitColumns(result.items);
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Fetch categories ---
  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/category?sortBy=name&sortOrder=asc`,
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
      } else {
        setCategories(result.items);
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Fetch shifts ---
  const fetchShifts = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/shift?sortBy=name&sortOrder=asc`,
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
      } else {
        setShifts(result.items);
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Fetch stop types ---
  const fetchStopTypes = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/stop-type?sortBy=name&sortOrder=asc`,
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
      } else {
        setStopTypes(result.items);
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Fetch unit ---
  const fetchUnit = async () => {
    try {
      const response = await fetch(`${apiUrl}/unit/fetch/${props.itemId}`, {
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
        fillUnitData(result);
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  const fillUnitData = (result: any) => {
    setName(result.name ?? "");
    setOriginalName(result.name ?? "");

    setUnitGroup(String(result.unitGroupId ?? ""));
    setOriginalUnitGroup(String(result.unitGroupId ?? ""));

    setIsHidden(result.isHidden ?? false);
    setOriginalIsHidden(result.isHidden ?? false);

    setLightColorHex(result.lightColorHex ?? "#212121");
    setOriginalLightColorHex(result.lightColorHex ?? "#212121");

    setDarkColorHex(result.darkColorHex ?? "#e0e0e0");
    setOriginalDarkColorHex(result.darkColorHex ?? "#e0e0e0");

    setUnitColumnIds(result.unitColumnIds ?? []);
    setOriginalUnitColumnIds(result.unitColumnIds ?? []);

    setCategoryIds(result.categoryIds ?? []);
    setOriginalCategoryIds(result.categoryIds ?? []);

    setShiftIds(result.shiftIds ?? []);
    setOriginalShiftIds(result.shiftIds ?? []);

    setStopTypeIds(result.stopTypeIds ?? []);
    setOriginalStopTypeIds(result.stopTypeIds ?? []);
  };

  // --- Update unit ---
  const updateUnit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/unit/update/${props.itemId}`, {
        method: "PUT",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          lightColorHex,
          darkColorHex,
          unitGroupId: parseInt(unitGroup),
          isHidden,
          unitColumnIds,
          categoryIds,
          shiftIds,
          stopTypeIds,
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
      window.dispatchEvent(new Event("unit-list-updated"));
      notify("success", t("Common/Unit") + t("Modal/updated"), 4000);
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
        unitGroup !== "" ||
        isHidden !== false ||
        lightColorHex !== "#212121" ||
        darkColorHex !== "#e0e0e0" ||
        JSON.stringify(unitColumnIds) !==
          JSON.stringify(originalUnitColumnIds) ||
        JSON.stringify(categoryIds) !== JSON.stringify(originalCategoryIds) ||
        JSON.stringify(shiftIds) !== JSON.stringify(originalShiftIds) ||
        JSON.stringify(stopTypeIds) !== JSON.stringify(originalStopTypeIds);

      setIsDirty(dirty);
      return;
    }

    const dirty =
      name !== originalName ||
      unitGroup !== originalUnitGroup ||
      isHidden !== originalIsHidden ||
      lightColorHex !== originalLightColorHex ||
      darkColorHex !== originalDarkColorHex ||
      JSON.stringify(unitColumnIds) !== JSON.stringify(originalUnitColumnIds) ||
      JSON.stringify(categoryIds) !== JSON.stringify(originalCategoryIds) ||
      JSON.stringify(shiftIds) !== JSON.stringify(originalShiftIds) ||
      JSON.stringify(stopTypeIds) !== JSON.stringify(originalStopTypeIds);
    setIsDirty(dirty);
  }, [
    name,
    unitGroup,
    isHidden,
    lightColorHex,
    darkColorHex,
    unitColumnIds,
    categoryIds,
    shiftIds,
    stopTypeIds,
    originalName,
    originalUnitGroup,
    originalIsHidden,
    originalLightColorHex,
    originalDarkColorHex,
    originalUnitColumnIds,
    originalCategoryIds,
    originalShiftIds,
    originalStopTypeIds,
  ]);

  return (
    <>
      {props.isOpen && (
        <form
          ref={formRef}
          onSubmit={(e) => (props.itemId ? updateUnit(e) : addUnit(e))}
        >
          <ModalBase
            ref={modalRef}
            isOpen={props.isOpen}
            onClose={() => props.onClose()}
            icon={props.itemId ? PencilSquareIcon : PlusIcon}
            label={
              props.itemId
                ? t("Common/Edit") + " " + t("Common/unit")
                : t("Common/Add") + " " + t("Common/unit")
            }
            confirmOnClose
            isDirty={isDirty}
          >
            <ModalBase.Content>
              <div className="flex items-center gap-2">
                <hr className="w-12 text-[var(--border-tertiary)]" />
                <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                  {t("UnitModal/Info1")}
                </h3>
                <hr className="w-full text-[var(--border-tertiary)]" />
              </div>

              <div className="xs:grid-cols-2 grid grid-cols-1 gap-6">
                <Input
                  label={t("Common/Name")}
                  value={name}
                  onChange={(val) => {
                    setName(String(val));
                  }}
                  onModal
                  required
                  {...unitConstraints.name}
                />

                <SingleDropdown
                  id="unitGroup"
                  label={t("Common/Group")}
                  value={unitGroup}
                  onChange={(val) => {
                    setUnitGroup(String(val));
                  }}
                  onModal
                  required
                  options={unitGroups.map((ug) => ({
                    label: ug.name,
                    value: String(ug.id),
                  }))}
                />

                <Input
                  label={t("Common/Light color")}
                  type="color"
                  value={lightColorHex}
                  onChange={(val) => setLightColorHex(String(val))}
                  pattern="^#([0-9A-Fa-f]{6})$"
                  onModal
                />

                <Input
                  label={t("Common/Dark color")}
                  type="color"
                  value={darkColorHex}
                  onChange={(val) => setDarkColorHex(String(val))}
                  pattern="^#([0-9A-Fa-f]{6})$"
                  onModal
                />
              </div>

              <div className="mt-8 flex items-center gap-2">
                <hr className="w-12 text-[var(--border-tertiary)]" />
                <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                  {t("UnitModal/Info2")}
                </h3>
                <hr className="w-full text-[var(--border-tertiary)]" />
              </div>

              <MultiDropdown
                label={t("Common/Columns")}
                value={unitColumnIds.map(String)}
                onChange={(val: string[]) => setUnitColumnIds(val.map(Number))}
                options={unitColumns.map((c) => ({
                  label: c.name,
                  value: String(c.id),
                }))}
                onModal
              />

              {unitColumnIds.length > 0 && (
                <>
                  <DragDrop
                    items={unitColumnIds}
                    getId={(id) => String(id)}
                    onReorder={(newList) => setUnitColumnIds(newList)}
                    onDraggingChange={setIsAnyDragging}
                    renderItem={(id, isDragging) => {
                      const col = unitColumns.find((c) => c.id === id);
                      if (!col) {
                        return null;
                      }

                      return (
                        <DragChip
                          label={col.name}
                          isDragging={isDragging}
                          dragging={isAnyDragging}
                          onDelete={() =>
                            setUnitColumnIds((prev) =>
                              prev.filter((v) => v !== id),
                            )
                          }
                        />
                      );
                    }}
                  />
                  <span className="text-sm text-[var(--text-secondary)] italic">
                    {t("Modal/Drag and drop1") +
                      t("Common/column") +
                      t("Modal/Drag and drop3")}
                  </span>
                </>
              )}

              <div className="mt-8 flex items-center gap-2">
                <hr className="w-12 text-[var(--border-tertiary)]" />
                <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                  {t("UnitModal/Info3")}
                </h3>
                <hr className="w-full text-[var(--border-tertiary)]" />
              </div>

              <MultiDropdown
                label={t("Common/Categories")}
                value={categoryIds.map(String)}
                onChange={(val: string[]) => setCategoryIds(val.map(Number))}
                options={categories.map((c) => ({
                  label: c.name,
                  value: String(c.id),
                }))}
                onModal
              />

              {categoryIds.length > 0 && (
                <>
                  <DragDrop
                    items={categoryIds}
                    getId={(id) => String(id)}
                    onReorder={(newList) => setCategoryIds(newList)}
                    onDraggingChange={setIsAnyDragging}
                    renderItem={(id, isDragging) => {
                      const col = categories.find((c) => c.id === id);
                      if (!col) {
                        return null;
                      }

                      return (
                        <DragChip
                          label={col.name}
                          isDragging={isDragging}
                          dragging={isAnyDragging}
                          onDelete={() =>
                            setCategoryIds((prev) =>
                              prev.filter((v) => v !== id),
                            )
                          }
                        />
                      );
                    }}
                  />
                  <span className="text-sm text-[var(--text-secondary)] italic">
                    {t("Modal/Drag and drop1") +
                      t("Common/category") +
                      t("Modal/Drag and drop3")}
                  </span>
                </>
              )}

              <div className="mt-8 flex items-center gap-2">
                <hr className="w-12 text-[var(--border-tertiary)]" />
                <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                  {t("UnitModal/Info4")}
                </h3>
                <hr className="w-full text-[var(--border-tertiary)]" />
              </div>

              <MultiDropdown
                scrollContainer={getScrollEl}
                label={t("Common/Shifts")}
                value={shiftIds.map(String)}
                onChange={(val: string[]) => setShiftIds(val.map(Number))}
                options={shifts.map((c) => ({
                  label: c.name,
                  value: String(c.id),
                }))}
                onModal
              />

              {shiftIds.length > 0 && (
                <>
                  <DragDrop
                    items={shiftIds}
                    getId={(id) => String(id)}
                    onReorder={(newList) => setShiftIds(newList)}
                    onDraggingChange={setIsAnyDragging}
                    renderItem={(id, isDragging) => {
                      const col = shifts.find((c) => c.id === id);
                      if (!col) {
                        return null;
                      }

                      return (
                        <DragChip
                          label={col.name}
                          isDragging={isDragging}
                          dragging={isAnyDragging}
                          onDelete={() =>
                            setShiftIds((prev) => prev.filter((v) => v !== id))
                          }
                        />
                      );
                    }}
                  />
                  <span className="text-sm text-[var(--text-secondary)] italic">
                    {t("Modal/Drag and drop2") +
                      t("Common/shift") +
                      t("Modal/Drag and drop3")}
                  </span>
                </>
              )}

              <div className="mt-8 flex items-center gap-2">
                <hr className="w-12 text-[var(--border-tertiary)]" />
                <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                  {t("UnitModal/Info5")}
                </h3>
                <hr className="w-full text-[var(--border-tertiary)]" />
              </div>

              <MultiDropdown
                addSpacer={stopTypeIds.length === 0 && stopTypes.length > 3}
                scrollContainer={getScrollEl}
                label={t("Common/Stop types")}
                value={stopTypeIds.map(String)}
                onChange={(val: string[]) => setStopTypeIds(val.map(Number))}
                options={stopTypes.map((c) => ({
                  label: c.name,
                  value: String(c.id),
                }))}
                onModal
              />

              {stopTypeIds.length > 0 && (
                <>
                  <DragDrop
                    items={stopTypeIds}
                    getId={(id) => String(id)}
                    onReorder={(newList) => setStopTypeIds(newList)}
                    onDraggingChange={setIsAnyDragging}
                    renderItem={(id, isDragging) => {
                      const col = stopTypes.find((c) => c.id === id);
                      if (!col) {
                        return null;
                      }

                      return (
                        <DragChip
                          label={col.name}
                          isDragging={isDragging}
                          dragging={isAnyDragging}
                          onDelete={() =>
                            setStopTypeIds((prev) =>
                              prev.filter((v) => v !== id),
                            )
                          }
                        />
                      );
                    }}
                  />
                  <span className="text-sm text-[var(--text-secondary)] italic">
                    {t("Modal/Drag and drop2") +
                      t("Common/stop type") +
                      t("Modal/Drag and drop3")}
                  </span>
                </>
              )}

              <div className="mt-8 flex items-center gap-2">
                <hr className="w-12 text-[var(--border-tertiary)]" />
                <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                  {t("Common/Status")}
                </h3>
                <hr className="w-full text-[var(--border-tertiary)]" />
              </div>

              <div className="mb-8">
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
                  <span className="mb-0.5">{t("UnitModal/Hide unit")}</span>
                </div>
              </div>
            </ModalBase.Content>

            <ModalBase.Footer>
              <button
                type="button"
                onClick={handleSaveClick}
                className={`${buttonPrimaryClass} xs:col-span-2 col-span-3`}
              >
                {props.itemId ? t("Modal/Save") : t("Common/Add")}
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

export default UnitModal;
