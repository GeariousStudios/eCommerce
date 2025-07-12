"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import Input from "../../common/Input";
import { useToast } from "../../toast/ToastProvider";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  roundedButtonClass,
} from "@/app/styles/buttonClasses";
import ModalBase, { ModalBaseHandle } from "../ModalBase";
import MultiDropdown from "../../common/MultiDropdown";
import { XMarkIcon } from "@heroicons/react/20/solid";
import DragDrop from "../../common/DragDrop";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  itemId?: number | null;
  onItemUpdated: () => void;
};

type UnitOptions = {
  id: number;
  name: string;
};

const CategoryModal = (props: Props) => {
  // --- VARIABLES ---
  // --- Refs ---
  const formRef = useRef<HTMLFormElement>(null);
  const modalRef = useRef<ModalBaseHandle>(null);

  // --- States ---
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<string[]>([]);
  const [subCategory, setSubCategory] = useState<string[]>([]);
  const [newSubCategory, setNewSubCategory] = useState("");
  const [units, setUnits] = useState<UnitOptions[]>([]);

  const [originalName, setOriginalName] = useState("");
  const [originalUnit, setOriginalUnit] = useState<string[]>([]);
  const [originalSubCategory, setOriginalSubCategory] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  const [isAnyDragging, setIsAnyDragging] = useState(false);

  // --- Other ---
  const token = localStorage.getItem("token");
  const { notify } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (props.isOpen) {
      fetchUnits();
    }
  }, [props.isOpen]);

  useEffect(() => {
    if (
      props.isOpen &&
      props.itemId !== null &&
      props.itemId !== undefined &&
      units.length > 0
    ) {
      fetchCategory();
    } else {
      setName("");
      setOriginalName("");

      setUnit([]);
      setOriginalUnit([]);

      setSubCategory([]);
      setOriginalSubCategory([]);

      setNewSubCategory("");
    }
  }, [props.isOpen, props.itemId, units]);

  // --- BACKEND ---
  // --- Add category ---
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
          units: unit.map(Number),
          subCategories: subCategory,
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
      props.onItemUpdated();
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
      const response = await fetch(`${apiUrl}/category/fetch/${props.itemId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

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
    setOriginalName(result.name ?? "");

    const unitIds = result.units
      ?.map((unitName: string) => {
        const found = units.find((u) => u.name === unitName);
        return found ? String(found.id) : null;
      })
      .filter(Boolean) as string[];

    setUnit(unitIds);
    setOriginalUnit(unitIds);

    setSubCategory(result.subCategories ?? []);
    setOriginalSubCategory(result.subCategories ?? []);
  };

  // --- Update category ---
  const updateCategory = async (event: FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch(
        `${apiUrl}/category/update/${props.itemId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            units: unit.map(Number),
            subCategories: subCategory,
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
      props.onItemUpdated();
      notify("success", "Kategori uppdaterad!", 4000);
    } catch (err) {
      notify("error", String(err));
    }
  };

  const handleSaveClick = () => {
    formRef.current?.requestSubmit();
  };

  const addSubCategory = () => {
    const trimmed = newSubCategory.trim();

    if (trimmed) {
      if (!subCategory.includes(trimmed)) {
        setSubCategory((prev) => [trimmed, ...prev]);
        setNewSubCategory("");
      } else {
        notify("error", "En underkategori med samma namn finns redan");
      }
    } else {
      notify("error", "Ange namnet på underkategorin först");
    }
  };

  // --- COMPONENTS ---
  // --- SubCategoryChip ---
  const SubCategoryChip = ({
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
  const areArraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) {
      return false;
    }

    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, index) => val === sortedB[index]);
  };

  useEffect(() => {
    if (props.itemId === null || props.itemId === undefined) {
      const dirty = name !== "" || unit.length > 0 || subCategory.length > 0;

      setIsDirty(dirty);
      return;
    }

    const dirty =
      name !== originalName ||
      !areArraysEqual(unit, originalUnit) ||
      !areArraysEqual(subCategory, originalSubCategory);
    setIsDirty(dirty);
  }, [
    name,
    unit,
    subCategory,
    originalName,
    originalUnit,
    originalSubCategory,
  ]);

  return (
    <>
      {props.isOpen && (
        <ModalBase
          ref={modalRef}
          isOpen={props.isOpen}
          onClose={() => props.onClose()}
          icon={props.itemId ? PencilSquareIcon : PlusIcon}
          label={props.itemId ? "Redigera kategori" : "Lägg till ny kategori"}
          confirmOnClose
          isDirty={isDirty}
        >
          <form
            ref={formRef}
            className="relative flex flex-col gap-4"
            onSubmit={(e) =>
              props.itemId ? updateCategory(e) : addCategory(e)
            }
          >
            <div className="flex items-center gap-2">
              <hr className="w-12 text-[var(--border-main)]" />
              <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                Uppgifter om kategorin
              </h3>
              <hr className="w-full text-[var(--border-main)]" />
            </div>

            <div className="mb-8 flex w-full flex-col gap-6 sm:flex-row sm:gap-4">
              <div className="w-full sm:w-1/2">
                <Input
                  label={"Namn"}
                  value={name}
                  onChange={(val) => setName(String(val))}
                  onModal={true}
                  required
                />
              </div>

              <div className="w-full sm:w-1/2">
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

            <div className="flex gap-4">
              <Input
                value={newSubCategory}
                onChange={(val) => setNewSubCategory(String(val))}
                onModal={true}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSubCategory();
                  }
                }}
                placeholder="Skapa underkategorier här..."
              />

              <button
                type="button"
                onClick={addSubCategory}
                className={`${buttonPrimaryClass}`}
              >
                <PlusIcon />
              </button>
            </div>

            {subCategory.length > 0 && (
              <DragDrop
                items={subCategory}
                getId={(item) => item}
                onReorder={(newList) => setSubCategory(newList)}
                onDraggingChange={setIsAnyDragging}
                renderItem={(item, isDragging) => (
                  <SubCategoryChip
                    label={item}
                    isDragging={isDragging}
                    dragging={isAnyDragging}
                    onDelete={() =>
                      setSubCategory((prev) => prev.filter((s) => s !== item))
                    }
                  />
                )}
              />
            )}

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={handleSaveClick}
                className={`${buttonPrimaryClass} w-full grow-2 sm:w-auto`}
              >
                {props.itemId ? "Uppdatera" : "Lägg till"}
              </button>
              <button
                type="button"
                onClick={() => modalRef.current?.requestClose()}
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
