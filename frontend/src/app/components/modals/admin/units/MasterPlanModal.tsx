"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  PencilIcon,
  PencilSquareIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import Input from "../../../common/Input";
import { useToast } from "../../../toast/ToastProvider";
import {
  buttonDeletePrimaryClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
  iconButtonPrimaryClass,
  roundedButtonClass,
  switchClass,
  switchKnobClass,
} from "@/app/styles/buttonClasses";
import {
  getMasterPlanFieldDataTypeOptions,
  MasterPlanFieldDataType,
} from "@/app/types/manageTypes";
import ModalBase, { ModalBaseHandle } from "../../ModalBase";
import { useTranslations } from "next-intl";
import { masterPlanConstraints } from "@/app/helpers/inputConstraints";
import { EllipsisVerticalIcon, XMarkIcon } from "@heroicons/react/20/solid";
import DragDrop from "@/app/components/common/DragDrop";
import SingleDropdown from "@/app/components/common/SingleDropdown";
import MenuDropdown from "@/app/components/common/MenuDropdown/MenuDropdown";

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

type MasterPlanFieldDto = {
  id: number;
  name: string;
  dataType: MasterPlanFieldDataType;
  alignment: "Left" | "Center" | "Right";
  isHidden: boolean;
};

const MasterPlanModal = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- Refs ---
  const formRef = useRef<HTMLFormElement>(null);
  const modalRef = useRef<ModalBaseHandle>(null);
  const getScrollEl = () => modalRef.current?.getScrollEl() ?? null;
  const updatedMasterPlanFieldsRef = useRef<MasterPlanFieldDto[]>([]);

  // --- States ---
  const [name, setName] = useState("");
  const [unitGroup, setUnitGroup] = useState("");
  const [unitGroups, setUnitGroups] = useState<UnitGroupOptions[]>([]);
  const [isHidden, setIsHidden] = useState(false);
  const [masterPlanFieldIds, setMasterPlanFieldIds] = useState<number[]>([]);
  const [newMasterPlanField, setNewMasterPlanField] = useState("");

  const [originalName, setOriginalName] = useState("");
  const [originalUnitGroup, setOriginalUnitGroup] = useState("");
  const [originalIsHidden, setOriginalIsHidden] = useState(false);
  const [originalMasterPlanFieldIds, setOriginalMasterPlanFieldIds] = useState<
    number[]
  >([]);
  const [masterPlanFieldIdsToDelete, setMasterPlanFieldIdsToDelete] = useState<
    number[]
  >([]);
  const [isDirty, setIsDirty] = useState(false);

  const [isAnyDragging, setIsAnyDragging] = useState(false);

  const [updateTick, setUpdateTick] = useState(0);

  // --- Other ---
  const token = localStorage.getItem("token");
  const { notify } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!props.isOpen) {
      return;
    }

    fetchUnitGroups();

    if (props.isOpen && props.itemId !== null && props.itemId !== undefined) {
      fetchAllMasterPlanFields();
      fetchMasterPlan();
    } else {
      setName("");
      setOriginalName("");

      setUnitGroup("");
      setOriginalUnitGroup("");

      setIsHidden(false);
      setOriginalIsHidden(false);

      setMasterPlanFieldIds([]);
      setOriginalMasterPlanFieldIds([]);

      setNewMasterPlanField("");
    }
  }, [props.isOpen, props.itemId]);

  // --- BACKEND ---
  // --- Create master plan ---
  const createMasterPlan = async (event: FormEvent) => {
    event.preventDefault();

    const newMasterPlanFields = updatedMasterPlanFieldsRef.current
      .filter((mpf) => masterPlanFieldIds.includes(mpf.id) && mpf.id < 0)
      .map((mpf) => ({
        name: mpf.name.trim(),
        dataType: mpf.dataType,
        alignment: mpf.alignment,
        isHidden: mpf.isHidden,
      }));

    const newMasterPlanFieldIds = masterPlanFieldIds.filter((id) => id > 0);

    try {
      const response = await fetch(`${apiUrl}/master-plan/create`, {
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
          masterPlanFieldIds: newMasterPlanFieldIds,
          newMasterPlanFields,
          masterPlanFieldIdsToDelete,
          orderedMasterPlanFieldIds: masterPlanFieldIds,
          tempMasterPlanFieldNames,
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

      (result.fields ?? []).forEach((mpf: any) => {
        const existing = updatedMasterPlanFieldsRef.current.find(
          (f) => f.name.trim() === mpf.name.trim() && f.id < 0,
        );

        if (existing) {
          existing.id = mpf.id;
        }
      });

      setMasterPlanFieldIdsToDelete([]);
      props.onClose();
      props.onItemUpdated();
      window.dispatchEvent(new Event("master-plan-list-updated"));
      notify("success", t("Common/Master plan") + t("Modal/created"), 4000);
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

  // --- Fetch master plan & master plan fields ---
  const fetchMasterPlan = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/master-plan/fetch/${props.itemId}`,
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
        fillMasterPlanData(result);
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  const fillMasterPlanData = (result: any) => {
    setName(result.name ?? "");
    setOriginalName(result.name ?? "");

    setUnitGroup(String(result.unitGroupId ?? ""));
    setOriginalUnitGroup(String(result.unitGroupId ?? ""));

    setIsHidden(result.isHidden ?? false);
    setOriginalIsHidden(result.isHidden ?? false);

    const ids = Array.isArray(result.fields)
      ? result.fields.map((mpf: any) => mpf.id)
      : [];

    setMasterPlanFieldIds(ids);
    setOriginalMasterPlanFieldIds(ids);

    if (Array.isArray(result.fields)) {
      result.fields.forEach((mpf: any) => {
        const found = updatedMasterPlanFieldsRef.current.find(
          (f) => f.id === mpf.id,
        );
        if (found) {
          found.alignment = mpf.alignment ?? "Left";
          found.dataType = mpf.dataType ?? "Text";
          found.isHidden = mpf.isHidden ?? false;
        }
      });
    }
  };

  const fetchAllMasterPlanFields = async () => {
    try {
      const response = await fetch(`${apiUrl}/master-plan-field`, {
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
        updatedMasterPlanFieldsRef.current = result;
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Update master plan ---
  const updateMasterPlan = async (event: FormEvent) => {
    event.preventDefault();

    const newMasterPlanFields = updatedMasterPlanFieldsRef.current
      .filter((mpf) => masterPlanFieldIds.includes(mpf.id) && mpf.id < 0)
      .map((mpf) => ({
        name: mpf.name.trim(),
        dataType: mpf.dataType,
        alignment: mpf.alignment,
        isHidden: mpf.isHidden,
      }));

    const updatedExistingMasterPlanFields = updatedMasterPlanFieldsRef.current
      .filter((mpf) => masterPlanFieldIds.includes(mpf.id) && mpf.id > 0)
      .map((mpf) => ({
        id: mpf.id,
        name: mpf.name.trim(),
        dataType: mpf.dataType,
        alignment: mpf.alignment,
        isHidden: mpf.isHidden,
      }));

    try {
      const response = await fetch(
        `${apiUrl}/master-plan/update/${props.itemId}`,
        {
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
            masterPlanFieldIds,
            newMasterPlanFields,
            updatedExistingMasterPlanFields,
            masterPlanFieldIdsToDelete,
            orderedMasterPlanFieldIds: masterPlanFieldIds,
            tempMasterPlanFieldNames,
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

      (result.fields ?? []).forEach((mpf: any) => {
        const existing = updatedMasterPlanFieldsRef.current.find(
          (s) => s.name.toLowerCase() === mpf.name.toLowerCase() && s.id < 0,
        );

        if (existing) {
          existing.id = mpf.id;
        }
      });

      setMasterPlanFieldIdsToDelete([]);
      props.onClose();
      props.onItemUpdated();
      window.dispatchEvent(new Event("master-plan-list-updated"));
      notify("success", t("Common/Master plan") + t("Modal/updated"), 4000);
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  const handleSaveClick = () => {
    formRef.current?.requestSubmit();
  };

  const createMasterPlanField = () => {
    const trimmed = newMasterPlanField.trim();

    if (!trimmed) {
      notify("error", t("MasterPlanModal/Error1"));
      return;
    }

    const match = updatedMasterPlanFieldsRef.current.find(
      (mpf) => mpf.name.trim().toLowerCase() === trimmed.toLowerCase(),
    );

    if (match) {
      if (masterPlanFieldIds.includes(match.id)) {
        notify("error", t("MasterPlanModal/Error2"));
        return;
      }

      setMasterPlanFieldIds((prev) => [...prev, match.id]);
      setNewMasterPlanField("");
      return;
    }

    const tempId = -(Math.floor(Math.random() * 1000000) + 1);

    const tempMasterPlanField: MasterPlanFieldDto = {
      id: tempId,
      name: trimmed,
      dataType: "Text",
      alignment: "Left",
      isHidden: false,
    };

    updatedMasterPlanFieldsRef.current = [
      ...updatedMasterPlanFieldsRef.current,
      tempMasterPlanField,
    ];
    setMasterPlanFieldIds((prev) => [...prev, tempId]);
    setNewMasterPlanField("");
  };

  const deleteMasterPlanField = async (masterPlanFieldId: number) => {
    setMasterPlanFieldIds((prev) =>
      prev.filter((id) => id !== masterPlanFieldId),
    );

    if (masterPlanFieldId > 0) {
      setMasterPlanFieldIdsToDelete((prev) => [...prev, masterPlanFieldId]);
    } else {
      updatedMasterPlanFieldsRef.current =
        updatedMasterPlanFieldsRef.current.filter(
          (mpf) => mpf.id !== masterPlanFieldId,
        );
    }
  };

  const MasterPlanFieldChip = ({
    id,
    label,
    onDelete,
    onRename,
    isDragging = false,
    dragging = false,
  }: {
    id: number;
    label: string;
    onDelete: () => void;
    onRename: (id: number, value: string) => void;

    isDragging?: boolean;
    dragging?: boolean;
  }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isHiddenField, setIsHiddenField] = useState(false);
    const [dataTypeField, setDataTypeField] =
      useState<MasterPlanFieldDataType>("Text");
    const [localNameField, setLocalNameField] = useState(label);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [alignmentField, setAlignmentField] = useState<
      "Left" | "Center" | "Right"
    >("Left");

    useEffect(() => {
      setLocalNameField(label);
    }, [label]);

    useEffect(() => {
      const found = updatedMasterPlanFieldsRef.current.find(
        (mpf) => mpf.id === id,
      );
      if (found) {
        setIsHiddenField(found.isHidden);
        setDataTypeField(found.dataType);
        setAlignmentField(found.alignment);
      }
    }, [id]);

    const handleHiddenChange = (value: boolean) => {
      setIsHiddenField(value);
      updatedMasterPlanFieldsRef.current =
        updatedMasterPlanFieldsRef.current.map((mpf) =>
          mpf.id === id ? { ...mpf, isHidden: value } : mpf,
        );
      setIsDirty(true);
    };

    const handleDataTypeChange = (value: MasterPlanFieldDataType) => {
      setDataTypeField(value);
      updatedMasterPlanFieldsRef.current =
        updatedMasterPlanFieldsRef.current.map((mpf) =>
          mpf.id === id ? { ...mpf, dataType: value } : mpf,
        );
      setIsDirty(true);
    };

    const handleAlignmentChange = (value: "Left" | "Center" | "Right") => {
      setAlignmentField(value);
      updatedMasterPlanFieldsRef.current =
        updatedMasterPlanFieldsRef.current.map((mpf) =>
          mpf.id === id ? { ...mpf, alignment: value } : mpf,
        );
      setIsDirty(true);
    };

    return (
      <div
        className={`${roundedButtonClass} relative flex w-auto items-center gap-2 !bg-[var(--bg-modal-link)] px-4 transition-transform duration-[var(--fast)]`}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <span className="truncate font-semibold select-none">{label}</span>

        <button
          ref={triggerRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
          className={`${iconButtonPrimaryClass}`}
        >
          <EllipsisVerticalIcon className="h-5 w-5" />
        </button>

        <MenuDropdown
          isOpen={menuOpen}
          onClose={() => {
            setMenuOpen(false);
            onRename(id, localNameField);
          }}
          triggerRef={triggerRef}
          // closeOnScroll
          onModal
        >
          <div className="flex flex-col gap-6">
            <span className="text-lg font-semibold">{localNameField}</span>

            <Input
              id={`rename-${id}`}
              label={t("Common/Name")}
              value={localNameField}
              onChange={(value) => setLocalNameField(value as string)}
              onBlur={() => {
                if (localNameField.trim() === "") {
                  setLocalNameField(label);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const trimmed = localNameField.trim();

                  if (!trimmed) {
                    setLocalNameField(label);
                    return;
                  }

                  onRename(id, trimmed);
                }
              }}
              onModal
              {...masterPlanConstraints.masterPlanFieldName}
            />

            <SingleDropdown
              id={`datatype-${id}`}
              label={t("MasterPlanModal/Data type")}
              value={dataTypeField}
              onChange={(val) =>
                handleDataTypeChange(val as MasterPlanFieldDataType)
              }
              options={getMasterPlanFieldDataTypeOptions(t).map((opt) => ({
                label: opt.label,
                value: opt.value,
              }))}
              onModal
            />

            <SingleDropdown
              id={`alignment-${id}`}
              label={t("MasterPlanModal/Alignment")}
              value={alignmentField}
              onChange={(val) =>
                handleAlignmentChange(val as "Left" | "Center" | "Right")
              }
              options={[
                { label: t("Common/Left"), value: "Left" },
                { label: t("Common/Center"), value: "Center" },
                { label: t("Common/Right"), value: "Right" },
              ]}
              onModal
            />

            <div className="mb-6 flex justify-between gap-6">
              <div className="flex items-center gap-2 truncate">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isHiddenField}
                  className={switchClass(isHiddenField)}
                  onClick={() => handleHiddenChange(!isHiddenField)}
                >
                  <div className={switchKnobClass(isHiddenField)} />
                </button>
                <span className="mb-0.5">
                  {t("MasterPlanModal/Hide master plan field")}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
              className={buttonDeletePrimaryClass}
            >
              {t("MasterPlanModal/Delete field")}
            </button>
          </div>
        </MenuDropdown>
      </div>
    );
  };

  // --- SET/UNSET IS DIRTY ---
  const areArraysEqual = function <T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) {
      return false;
    }

    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, index) => val === sortedB[index]);
  };

  useEffect(() => {
    if (props.itemId === null || props.itemId === undefined) {
      const dirty =
        name !== "" ||
        unitGroup !== "" ||
        isHidden !== false ||
        masterPlanFieldIds.length > 0;

      setIsDirty(dirty);
      return;
    }

    const dirty =
      name !== originalName ||
      unitGroup !== originalUnitGroup ||
      isHidden !== originalIsHidden ||
      !areArraysEqual(masterPlanFieldIds, originalMasterPlanFieldIds);

    setIsDirty(dirty);
  }, [
    props.itemId,
    name,
    unitGroup,
    isHidden,
    masterPlanFieldIds,
    originalName,
    originalUnitGroup,
    originalIsHidden,
    originalMasterPlanFieldIds,
  ]);

  // --- HELPERS ---
  const tempMasterPlanFieldNames: Record<number, string> = {};
  updatedMasterPlanFieldsRef.current
    .filter((mpf) => mpf.id < 0)
    .forEach((mpf) => (tempMasterPlanFieldNames[mpf.id] = mpf.name.trim()));

  return (
    <>
      {props.isOpen && (
        <form
          ref={formRef}
          onSubmit={(e) =>
            props.itemId ? updateMasterPlan(e) : createMasterPlan(e)
          }
        >
          <ModalBase
            ref={modalRef}
            isOpen={props.isOpen}
            onClose={() => {
              setMasterPlanFieldIdsToDelete([]);
              props.onClose();
            }}
            icon={props.itemId ? PencilSquareIcon : PlusIcon}
            label={
              props.itemId
                ? t("Common/Edit") + " " + t("Common/master plan")
                : t("Common/Add") + " " + t("Common/master plan")
            }
            confirmOnClose
            isDirty={isDirty}
          >
            <ModalBase.Content>
              <div className="flex items-center gap-2">
                <hr className="w-12 text-[var(--border-tertiary)]" />
                <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                  {t("MasterPlanModal/Info1")}
                </h3>
                <hr className="w-full text-[var(--border-tertiary)]" />
              </div>

              <div className="xs:grid-cols-2 mb-8 grid grid-cols-1 gap-6">
                <Input
                  label={t("Common/Name")}
                  value={name}
                  onChange={(val) => setName(String(val))}
                  onModal
                  required
                  {...masterPlanConstraints.name}
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
              </div>

              <div className="flex items-center gap-2">
                <hr className="w-12 text-[var(--border-tertiary)]" />
                <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                  {t("MasterPlanModal/Info2")}
                </h3>
                <hr className="w-full text-[var(--border-tertiary)]" />
              </div>

              <div className="flex gap-4">
                <Input
                  value={newMasterPlanField}
                  onChange={(val) => setNewMasterPlanField(String(val))}
                  onModal
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      createMasterPlanField();
                    }
                  }}
                  // placeholder={t("MasterPlanModal/Placeholder text")}
                  // showAsterixOnPlaceholder
                  label={
                    t("Common/Add") +
                    " " +
                    t("Common/master plan field") +
                    "..."
                  }
                  showAsterix
                  {...masterPlanConstraints.masterPlanFieldName}
                />

                <button
                  type="button"
                  onClick={createMasterPlanField}
                  className={`${buttonPrimaryClass}`}
                >
                  <PlusIcon />
                </button>
              </div>

              {masterPlanFieldIds.length > 0 && (
                <>
                  <DragDrop
                    items={masterPlanFieldIds}
                    getId={(id) => String(id)}
                    onReorder={(newIds) => setMasterPlanFieldIds(newIds)}
                    onDraggingChange={setIsAnyDragging}
                    renderItem={(id, isDragging) => {
                      const label =
                        updatedMasterPlanFieldsRef.current.find(
                          (mpf) => mpf.id === id,
                        )?.name ?? `#${id}`;

                      return (
                        <MasterPlanFieldChip
                          key={id + updateTick}
                          id={id}
                          label={label}
                          isDragging={isDragging}
                          dragging={isAnyDragging}
                          onDelete={() => deleteMasterPlanField(id)}
                          onRename={(id, newName) => {
                            const trimmed = newName.trim();

                            if (!trimmed) return;

                            const duplicate =
                              updatedMasterPlanFieldsRef.current.some(
                                (mpf) =>
                                  mpf.id !== id &&
                                  mpf.name.trim().toLowerCase() ===
                                    trimmed.toLowerCase(),
                              );

                            if (duplicate) {
                              notify("error", t("MasterPlanModal/Error2"));
                              return;
                            }

                            updatedMasterPlanFieldsRef.current =
                              updatedMasterPlanFieldsRef.current.map((mpf) =>
                                mpf.id === id ? { ...mpf, name: trimmed } : mpf,
                              );

                            setIsDirty(true);
                            setUpdateTick((prev) => prev + 1);
                          }}
                        />
                      );
                    }}
                  />

                  <span className="text-sm text-[var(--text-secondary)] italic">
                    {t("Modal/Drag and drop2") +
                      t("Common/master plan field") +
                      t("Modal/Drag and drop3")}
                  </span>
                </>
              )}
              <span className="mb-4" />

              <div className="flex items-center gap-2">
                <hr className="w-12 text-[var(--border-tertiary)]" />
                <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                  {t("Common/Status")}
                </h3>
                <hr className="w-full text-[var(--border-tertiary)]" />
              </div>

              <div className="mb-8 flex justify-between gap-6">
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
                  <span className="mb-0.5">
                    {t("MasterPlanModal/Hide master plan")}
                  </span>
                </div>
              </div>
            </ModalBase.Content>

            <ModalBase.Footer>
              <button
                type="button"
                onClick={handleSaveClick}
                className={`${buttonPrimaryClass} xs:col-span-2 col-span-3`}
              >
                {props.itemId ? t("Modal/Update") : t("Common/Add")}
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

export default MasterPlanModal;
