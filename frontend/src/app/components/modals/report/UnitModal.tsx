"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import Input from "../../common/Input";
import { useToast } from "../../toast/ToastProvider";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  roundedButtonClass,
  switchClass,
  switchKnobClass,
} from "@/app/styles/buttonClasses";
import ModalBase, { ModalBaseHandle } from "../ModalBase";
import SingleDropdown from "../../common/SingleDropdown";
import MultiDropdown from "../../common/MultiDropdown";
import { XMarkIcon } from "@heroicons/react/20/solid";
import DragDrop from "../../common/DragDrop";
import { useTranslations } from "next-intl";

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

const UnitModal = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- Refs ---
  const formRef = useRef<HTMLFormElement>(null);
  const modalRef = useRef<ModalBaseHandle>(null);

  // --- States ---
  const [name, setName] = useState("");
  const [unitGroup, setUnitGroup] = useState("");
  const [unitColumnIds, setUnitColumnIds] = useState<number[]>([]);
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [isHidden, setIsHidden] = useState(false);
  const [unitGroups, setUnitGroups] = useState<UnitGroupOptions[]>([]);
  const [unitColumns, setUnitColumns] = useState<UnitColumnOptions[]>([]);
  const [categories, setCategories] = useState<CategoryOptions[]>([]);

  const [originalName, setOriginalName] = useState("");
  const [originalUnitGroup, setOriginalUnitGroup] = useState("");
  const [originalUnitColumnIds, setOriginalUnitColumnIds] = useState<number[]>(
    [],
  );
  const [originalCategoryIds, setOriginalCategoryIds] = useState<number[]>([]);
  const [originalIsHidden, setOriginalIsHidden] = useState(false);
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

    if (props.itemId !== null && props.itemId !== undefined) {
      fetchUnit();
    } else {
      setName("");
      setOriginalName("");

      setUnitGroup("");
      setOriginalUnitGroup("");

      setIsHidden(false);
      setOriginalIsHidden(false);

      setUnitColumnIds([]);
      setOriginalUnitColumnIds([]);

      setCategoryIds([]);
      setOriginalCategoryIds([]);
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
          unitGroupId: parseInt(unitGroup),
          isHidden,
          unitColumnIds: unitColumnIds,
          categoryIds: categoryIds,
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
      notify("error", String(err));
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
        notify("error", result.message);
      } else {
        setUnitColumns(result.items);
      }
    } catch (err) {
      notify("error", String(err));
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
        notify("error", result.message);
      } else {
        setCategories(result.items);
      }
    } catch (err) {
      notify("error", String(err));
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
        notify("error", result.message);
      } else {
        setUnitGroups(result.items);
      }
    } catch (err) {
      notify("error", String(err));
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
        notify("error", result.message);
      } else {
        fillUnitData(result);
      }
    } catch (err) {
      notify("error", String(err));
    }
  };

  const fillUnitData = (result: any) => {
    setName(result.name ?? "");
    setOriginalName(result.name ?? "");

    setUnitGroup(String(result.unitGroupId ?? ""));
    setOriginalUnitGroup(String(result.unitGroupId ?? ""));

    setIsHidden(result.isHidden ?? false);
    setOriginalIsHidden(result.isHidden ?? false);

    setUnitColumnIds(result.unitColumnIds ?? []);
    setOriginalUnitColumnIds(result.unitColumnIds ?? []);

    setCategoryIds(result.categoryIds ?? []);
    setOriginalCategoryIds(result.categoryIds ?? []);
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
          unitGroupId: parseInt(unitGroup),
          isHidden,
          unitColumnIds: unitColumnIds,
          categoryIds: categoryIds,
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
      notify("error", String(err));
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
        JSON.stringify(unitColumnIds) !==
          JSON.stringify(originalUnitColumnIds) ||
        JSON.stringify(categoryIds) !== JSON.stringify(originalCategoryIds);

      setIsDirty(dirty);
      return;
    }

    const dirty =
      name !== originalName ||
      unitGroup !== originalUnitGroup ||
      isHidden !== originalIsHidden;
    setIsDirty(dirty);
  }, [
    name,
    unitGroup,
    isHidden,
    unitColumnIds,
    categoryIds,
    originalName,
    originalUnitGroup,
    originalIsHidden,
    originalUnitColumnIds,
    originalCategoryIds,
  ]);

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
              ? t("Common/Edit") + " " + t("Common/unit")
              : t("Manage/Add") + " " + t("Common/unit")
          }
          confirmOnClose
          isDirty={isDirty}
        >
          <form
            ref={formRef}
            className="relative flex flex-col gap-4"
            onSubmit={(e) => (props.itemId ? updateUnit(e) : addUnit(e))}
          >
            <div className="flex items-center gap-2">
              <hr className="w-12 text-[var(--border-tertiary)]" />
              <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                {t("UnitModal/Info1")}
              </h3>
              <hr className="w-full text-[var(--border-tertiary)]" />
            </div>

            <div className="flex flex-col gap-6 sm:flex-row sm:gap-4">
              <Input
                label={t("Common/Name")}
                value={name}
                onChange={(val) => {
                  setName(String(val));
                }}
                onModal={true}
                required
              />

              <div className="flex w-full gap-6 sm:gap-4">
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
              </div>
            </div>

            <div className="mt-8 flex items-center gap-2">
              <hr className="w-12 text-[var(--border-tertiary)]" />
              <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                {t("UnitModal/Info2")}
              </h3>
              <hr className="w-full text-[var(--border-tertiary)]" />
            </div>

            <div className="flex gap-4">
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
            </div>

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
                  {t("UnitModal/Drag and drop1")}
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

            <div className="flex gap-4">
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
            </div>

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
                          setCategoryIds((prev) => prev.filter((v) => v !== id))
                        }
                      />
                    );
                  }}
                />
                <span className="text-sm text-[var(--text-secondary)] italic">
                  {t("UnitModal/Drag and drop2")}
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
                <span className="mb-0.5">{t("UnitModal/Hide unit")}</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={handleSaveClick}
                className={`${buttonPrimaryClass} w-full grow-2 sm:w-auto`}
              >
                {props.itemId ? t("Modal/Save") : t("Modal/Add")}
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

export default UnitModal;
