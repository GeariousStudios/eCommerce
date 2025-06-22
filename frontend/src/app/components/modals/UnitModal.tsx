"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { FocusTrap } from "focus-trap-react";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import Input from "../input/Input";
import { useToast } from "../toast/ToastProvider";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  switchClass,
  switchKnobClass,
} from "@/app/styles/buttonClasses";
import MultiDropdown from "../dropdowns/MultiDropdown";
import ModalBase from "./ModalBase";
import SingleDropdown from "../dropdowns/SingleDropdown";
import router from "next/router";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  unitId?: number | null;
  onUnitUpdated: () => void;
};

type UnitGroupOptions = {
  id: number;
  name: string;
};

const UnitModal = (props: Props) => {
  // --- VARIABLES ---
  // --- Refs ---
  const formRef = useRef<HTMLFormElement>(null);

  // --- States ---
  const [name, setName] = useState("");
  const [unitGroup, setUnitGroup] = useState("");
  const [isHidden, setIsHidden] = useState(false);

  const [unitGroups, setUnitGroups] = useState<UnitGroupOptions[]>([]);

  // --- Other ---
  const token = localStorage.getItem("token");
  const { notify } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!props.isOpen) {
      return;
    }

    fetchUnitGroups();

    if (props.unitId !== null && props.unitId !== undefined) {
      fetchUnit();
    } else {
      setName("");
      setUnitGroup("");
      setIsHidden(false);
    }
  }, [props.isOpen, props.unitId]);

  // --- BACKEND ---
  // --- Add unit ---
  const addUnit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/unit/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          unitGroupId: parseInt(unitGroup),
          isHidden,
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

        notify("error", "Ett okänt fel inträffade");
        return;
      }

      props.onClose();
      props.onUnitUpdated();
      notify(
        "success",
        <>
          Enhet skapad! <p>Uppdatera sidan (F5) för att hitta den i menyn</p>
        </>,
        4000,
      );
    } catch (err) {
      notify("error", String(err));
    }
  };

  // --- Fetch unit groups ---
  const fetchUnitGroups = async () => {
    try {
      const response = await fetch(`${apiUrl}/unit-group`, {
        headers: {
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
      const response = await fetch(`${apiUrl}/unit/fetch/${props.unitId}`, {
        headers: {
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
    setUnitGroup(String(result.unitGroupId ?? ""));
    setIsHidden(result.isHidden ?? false);
  };

  // --- Update unit ---
  const updateUnit = async (event: FormEvent, id: number) => {
    event.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/unit/update/${props.unitId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          unitGroupId: parseInt(unitGroup),
          isHidden,
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

        notify("error", "Ett okänt fel inträffade");
        return;
      }

      props.onClose();
      props.onUnitUpdated();
      notify("success", "Enhet uppdaterad!", 4000);
    } catch (err) {
      notify("error", String(err));
    }
  };

  const handleSaveClick = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <>
      {props.isOpen && (
        <ModalBase
          isOpen={props.isOpen}
          onClose={() => props.onClose()}
          icon={props.unitId ? PencilSquareIcon : PlusIcon}
          label={props.unitId ? "Redigera enhet" : "Lägg till ny enhet"}
        >
          <form
            ref={formRef}
            className="relative flex flex-col gap-4"
            onSubmit={(e) =>
              props.unitId ? updateUnit(e, props.unitId) : addUnit(e)
            }
          >
            <div className="flex items-center gap-2">
              <hr className="w-12 text-[var(--border-main)]" />
              <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                Uppgifter om enheten
              </h3>
              <hr className="w-full text-[var(--border-main)]" />
            </div>

            <div className="flex flex-col gap-6 sm:flex-row sm:gap-4">
              <Input
                label={"Namn"}
                value={name}
                onChange={(val) => setName(String(val))}
                onModal={true}
                required
              />

              <div className="flex w-full gap-6 sm:gap-4">
                <SingleDropdown
                  id="unitGroup"
                  label={"Enhetsgrupp"}
                  value={unitGroup}
                  onChange={(val) => setUnitGroup(String(val))}
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
              <hr className="w-12 text-[var(--border-main)]" />
              <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                Status
              </h3>
              <hr className="w-full text-[var(--border-main)]" />
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
                <span className="mb-0.5">Göm enhet</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={handleSaveClick}
                className={`${buttonPrimaryClass} w-full grow-2 sm:w-auto`}
              >
                {props.unitId ? "Uppdatera" : "Lägg till"}
              </button>
              <button
                type="button"
                onClick={props.onClose}
                className={`${buttonSecondaryClass} w-full grow sm:w-auto`}
              >
                Ångra
              </button>
            </div>
          </form>
        </ModalBase>
      )}
    </>
  );
};

export default UnitModal;
