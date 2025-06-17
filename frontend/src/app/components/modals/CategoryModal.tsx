"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { FocusTrap } from "focus-trap-react";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import Input from "../input/Input";
import { useToast } from "../toast/ToastProvider";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
} from "@/app/styles/buttonClasses";
import ModalBase from "./ModalBase";
import MultiDropdown from "../dropdowns/MultiDropdown";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  categoryId?: number | null;
  onCategoryUpdated: () => void;
};

type UnitOptions = {
  id: number;
  name: string;
};

const CategoryModal = (props: Props) => {
  // --- VARIABLES ---
  // --- Refs ---
  const formRef = useRef<HTMLFormElement>(null);

  // --- States ---
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<string[]>([]);
  const [isHidden, setIsHidden] = useState(false);

  const [units, setUnits] = useState<UnitOptions[]>([]);

  // --- Other ---
  const token = localStorage.getItem("token");
  const { notify } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!props.isOpen) {
      return;
    }

    fetchUnits();

    if (props.categoryId !== null && props.categoryId !== undefined) {
      fetchCategory();
    } else {
      setName("");
    }
  }, [props.isOpen, props.categoryId]);

  // --- BACKEND ---
  // --- Add unit ---
  const addCategory = async (event: FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/category/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
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
      props.onCategoryUpdated();
      notify("success", "Kategori skapad!", 4000);
    } catch (err) {
      notify("error", String(err));
    }
  };

  // --- Fetch units ---
  const fetchUnits = async () => {
    try {
      const response = await fetch(`${apiUrl}/unit`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        notify("error", result.message);
      } else {
        setUnits(result.items);
      }
    } catch (err) {
      notify("error", String(err));
    }
  };

  // --- Fetch category ---
  const fetchCategory = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/category/fetch/${props.categoryId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        notify("error", result.message);
      } else {
        fillCategoryData(result);
      }
    } catch (err) {
      notify("error", String(err));
    }
  };

  const fillCategoryData = (result: any) => {
    setName(result.name ?? "");
  };

  // --- Update category ---
  const updateCategory = async (event: FormEvent, id: number) => {
    event.preventDefault();

    try {
      const response = await fetch(
        `${apiUrl}/category/update/${props.categoryId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
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

        notify("error", "Ett okänt fel inträffade");
        return;
      }

      props.onClose();
      props.onCategoryUpdated();
      notify("success", "Kategori uppdaterad!", 4000);
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
          icon={props.categoryId ? PencilSquareIcon : PlusIcon}
          label={
            props.categoryId ? "Redigera kategori" : "Lägg till ny kategori"
          }
        >
          <form
            ref={formRef}
            className="relative flex flex-col gap-4"
            onSubmit={(e) =>
              props.categoryId
                ? updateCategory(e, props.categoryId)
                : addCategory(e)
            }
          >
            <div className="flex items-center gap-2">
              <hr className="w-12 text-[var(--border-main)]" />
              <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                Uppgifter om kategorin
              </h3>
              <hr className="w-full text-[var(--border-main)]" />
            </div>

            <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:gap-4">
              <Input
                label={"Namn"}
                value={name}
                onChange={(val) => setName(String(val))}
                onModal={true}
                required
              />

              <div className="flex w-full gap-6 sm:gap-4">
                <MultiDropdown
                  id="unitGroup"
                  label={"Enheter med åtkomst"}
                  value={unit}
                  onChange={(val: string[]) => setUnit(val)}
                  onModal
                  options={units.map((u) => ({
                    label: u.name,
                    value: String(u.id),
                  }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <hr className="w-12 text-[var(--border-main)]" />
              <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                Underkategorier
              </h3>
              <hr className="w-full text-[var(--border-main)]" />
            </div>

            <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:gap-4">
              <Input
                label={"Underkategori"}
                value={name}
                onChange={(val) => setName(String(val))}
                onModal={true}
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={handleSaveClick}
                className={`${buttonPrimaryClass} w-full grow-2 sm:w-auto`}
              >
                {props.categoryId ? "Uppdatera" : "Lägg till"}
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

export default CategoryModal;
