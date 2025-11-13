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
import MultiDropdown from "@/app/components/common/MultiDropdown";

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

type MasterPlanFieldOptions = {
  id: number;
  name: string;
};

const MasterPlanModal = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- Refs ---
  const formRef = useRef<HTMLFormElement>(null);
  const modalRef = useRef<ModalBaseHandle>(null);
  const getScrollEl = () => modalRef.current?.getScrollEl() ?? null;

  // --- States ---
  const [name, setName] = useState("");
  const [unitGroup, setUnitGroup] = useState("");
  const [unitGroups, setUnitGroups] = useState<UnitGroupOptions[]>([]);
  const [isHidden, setIsHidden] = useState(false);
  const [allowRemovingElements, setAllowRemovingElements] = useState(false);
  const [masterPlanFieldIds, setMasterPlanFieldIds] = useState<number[]>([]);
  const [masterPlanFields, setMasterPlanFields] = useState<
    MasterPlanFieldOptions[]
  >([]);

  const [originalName, setOriginalName] = useState("");
  const [originalUnitGroup, setOriginalUnitGroup] = useState("");
  const [originalIsHidden, setOriginalIsHidden] = useState(false);
  const [originalAllowRemovingElements, setOriginalAllowRemovingElements] =
    useState(false);
  const [originalMasterPlanFieldIds, setOriginalMasterPlanFieldIds] = useState<
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
    fetchMasterPlanFields();

    if (props.isOpen && props.itemId !== null && props.itemId !== undefined) {
      fetchMasterPlan();
    } else {
      setName("");
      setOriginalName("");

      setUnitGroup("");
      setOriginalUnitGroup("");

      setIsHidden(false);
      setOriginalIsHidden(false);

      setAllowRemovingElements(false);
      setOriginalAllowRemovingElements(false);

      setMasterPlanFieldIds([]);
      setOriginalMasterPlanFieldIds([]);
    }
  }, [props.isOpen, props.itemId]);

  // --- BACKEND ---
  // --- Create master plan ---
  const createMasterPlan = async (event: FormEvent) => {
    event.preventDefault();

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
          allowRemovingElements,
          masterPlanFieldIds,
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
      window.dispatchEvent(new Event("master-plan-list-updated"));
      notify("success", t("Common/Master plan") + t("Modal/created1"), 4000);
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

    setAllowRemovingElements(result.allowRemovingElements ?? false);
    setOriginalAllowRemovingElements(result.allowRemovingElements ?? false);

    const fieldIds = result.fields?.map((f: any) => f.id) ?? [];

    setMasterPlanFieldIds(fieldIds);
    setOriginalMasterPlanFieldIds(fieldIds);
  };

  const fetchMasterPlanFields = async () => {
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
        const visibleItems = result.items.filter((x: any) => !x.isHidden);
        setMasterPlanFields(visibleItems);
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Update master plan ---
  const updateMasterPlan = async (event: FormEvent) => {
    event.preventDefault();

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
            allowRemovingElements,
            masterPlanFieldIds,
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
      window.dispatchEvent(new Event("master-plan-list-updated"));
      notify("success", t("Common/Master plan") + t("Modal/updated1"), 4000);
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
          className={`${roundedButtonClass} group w-auto gap-2 bg-(--bg-modal-link)! px-4`}
          onClick={onDelete}
        >
          <span
            className={`${disableHover ? "" : !isDragging && "group-hover:text-(--accent-color)"} truncate font-semibold transition-colors duration-(--fast)`}
          >
            {label}
          </span>
          <XMarkIcon
            className={`${disableHover ? "" : !isDragging && "group-hover:text-(--accent-color)"} h-6 w-6 transition-[color,rotate] duration-(--fast)`}
          />
        </button>
      </>
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
        allowRemovingElements !== false ||
        JSON.stringify(masterPlanFieldIds) !==
          JSON.stringify(originalMasterPlanFieldIds);

      setIsDirty(dirty);
      return;
    }

    const dirty =
      name !== originalName ||
      unitGroup !== originalUnitGroup ||
      isHidden !== originalIsHidden ||
      allowRemovingElements !== originalAllowRemovingElements ||
      JSON.stringify(masterPlanFieldIds) !==
        JSON.stringify(originalMasterPlanFieldIds);

    setIsDirty(dirty);
  }, [
    props.itemId,
    name,
    unitGroup,
    isHidden,
    allowRemovingElements,
    masterPlanFieldIds,
    originalName,
    originalUnitGroup,
    originalIsHidden,
    originalAllowRemovingElements,
    originalMasterPlanFieldIds,
  ]);

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
                <hr className="w-12 text-(--border-tertiary)" />
                <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                  {t("MasterPlanModal/Info1")}
                </h3>
                <hr className="w-full text-(--border-tertiary)" />
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
                <hr className="w-12 text-(--border-tertiary)" />
                <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                  {t("MasterPlanModal/Info2")}
                </h3>
                <hr className="w-full text-(--border-tertiary)" />
              </div>

              <MultiDropdown
                label={t("Common/Master plan fields")}
                value={masterPlanFieldIds.map(String)}
                onChange={(val: string[]) =>
                  setMasterPlanFieldIds(val.map(Number))
                }
                options={masterPlanFields.map((f) => ({
                  label: f.name,
                  value: String(f.id),
                }))}
                onModal
                required
              />

              {masterPlanFieldIds.length > 0 && (
                <>
                  <DragDrop
                    items={masterPlanFieldIds}
                    getId={(id) => String(id)}
                    onReorder={(newList) => setMasterPlanFieldIds(newList)}
                    onDraggingChange={setIsAnyDragging}
                    renderItem={(id, isDragging) => {
                      const field = masterPlanFields.find((f) => f.id === id);
                      if (!field) {
                        return null;
                      }

                      return (
                        <DragChip
                          label={field.name}
                          isDragging={isDragging}
                          dragging={isAnyDragging}
                          onDelete={() =>
                            setMasterPlanFieldIds((prev) =>
                              prev.filter((v) => v !== id),
                            )
                          }
                        />
                      );
                    }}
                  />
                  <span className="text-sm text-(--text-secondary) italic">
                    {t("Modal/Drag and drop1") +
                      t("Common/master plan field") +
                      t("Modal/Drag and drop3")}
                  </span>
                </>
              )}
              <span className="mb-4" />

              <div className="flex items-center gap-2">
                <hr className="w-12 text-(--border-tertiary)" />
                <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                  {t("Common/Status")}
                </h3>
                <hr className="w-full text-(--border-tertiary)" />
              </div>

              <div className="flex justify-between gap-6">
                <div className="flex items-center gap-2 truncate">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={allowRemovingElements}
                    className={switchClass(allowRemovingElements)}
                    onClick={() => setAllowRemovingElements((prev) => !prev)}
                  >
                    <div className={switchKnobClass(allowRemovingElements)} />
                  </button>
                  <span className="mb-0.5">
                    {t("MasterPlanModal/Allow removing elements")}
                  </span>
                </div>
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
