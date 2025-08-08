"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import Input from "../../common/Input";
import { useToast } from "../../toast/ToastProvider";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
} from "@/app/styles/buttonClasses";
import ModalBase, { ModalBaseHandle } from "../ModalBase";
import {
  getDataTypeOptions,
  UnitColumnDataType,
} from "@/app/types/manageTypes";
import SingleDropdown from "../../common/SingleDropdown";
import { useTranslations } from "next-intl";
import { unitColumnConstraints } from "@/app/helpers/inputConstraints";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  itemId?: number | null;
  onItemUpdated: () => void;
};

const UnitColumnModal = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- Refs ---
  const formRef = useRef<HTMLFormElement>(null);
  const modalRef = useRef<ModalBaseHandle>(null);

  // --- States ---
  const [name, setName] = useState("");
  const [dataType, setDataType] = useState<UnitColumnDataType>();

  const [originalName, setOriginalName] = useState("");
  const [originalDataType, setOriginalDataType] =
    useState<UnitColumnDataType>();
  const [isDirty, setIsDirty] = useState(false);

  // --- Other ---
  const token = localStorage.getItem("token");
  const { notify } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!props.isOpen) {
      return;
    }

    if (props.itemId !== null && props.itemId !== undefined) {
      fetchUnitColumn();
    } else {
      setName("");
      setOriginalName("");

      setDataType(undefined);
      setOriginalDataType(undefined);
    }
  }, [props.isOpen, props.itemId]);

  // --- BACKEND ---
  // --- Add unit column ---
  const addUnitColumn = async (event: FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/unit-column/create`, {
        method: "POST",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          dataType,
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
      notify("success", t("Common/Column") + t("Modal/created"), 4000);
    } catch (err) {
      notify("error", String(err));
    }
  };

  // --- Fetch unit column ---
  const fetchUnitColumn = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/unit-column/fetch/${props.itemId}`,
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
        fillUnitColumnData(result);
      }
    } catch (err) {
      notify("error", String(err));
    }
  };

  const fillUnitColumnData = (result: any) => {
    setName(result.name ?? "");
    setOriginalName(result.name ?? "");

    setDataType(result.dataType ?? undefined);
    setOriginalDataType(result.dataType ?? undefined);
  };

  // --- Update unit column ---
  const updateUnitColumn = async (event: FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch(
        `${apiUrl}/unit-column/update/${props.itemId}`,
        {
          method: "PUT",
          headers: {
            "X-User-Language": localStorage.getItem("language") || "sv",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            dataType,
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
      notify("success", t("Common/Column") + t("Modal/updated"), 4000);
    } catch (err) {
      notify("error", String(err));
    }
  };

  const handleSaveClick = () => {
    formRef.current?.requestSubmit();
  };

  // --- SET/UNSET IS DIRTY ---
  useEffect(() => {
    if (props.itemId === null || props.itemId === undefined) {
      const dirty = name !== "" || dataType !== undefined;

      setIsDirty(dirty);
      return;
    }

    const dirty = name !== originalName || dataType !== originalDataType;
    setIsDirty(dirty);
  }, [name, dataType, originalName, originalDataType]);

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
              ? t("Common/Edit") + " " + t("Common/column")
              : t("Manage/Add") + " " + t("Common/column")
          }
          confirmOnClose
          isDirty={isDirty}
        >
          <form
            ref={formRef}
            className="relative flex flex-col gap-4"
            onSubmit={(e) =>
              props.itemId ? updateUnitColumn(e) : addUnitColumn(e)
            }
          >
            <div className="flex items-center gap-2">
              <hr className="w-12 text-[var(--border-tertiary)]" />
              <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                {t("ColumnModal/Info1")}
              </h3>
              <hr className="w-full text-[var(--border-tertiary)]" />
            </div>

            <div className="mb-8 flex w-full flex-col gap-6 sm:flex-row sm:gap-4">
              <div className="w-full sm:w-1/2">
                <Input
                  label={t("Common/Name")}
                  value={name}
                  onChange={(val) => setName(String(val))}
                  onModal
                  required
                  {...unitColumnConstraints.name}
                />
              </div>

              <div className="w-full sm:w-1/2">
                <SingleDropdown
                  id="dataType"
                  label={t("Columns/Data type")}
                  value={dataType ?? ""}
                  onChange={(val) => setDataType(val as UnitColumnDataType)}
                  onModal
                  options={getDataTypeOptions(t)}
                  required
                />
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

export default UnitColumnModal;
