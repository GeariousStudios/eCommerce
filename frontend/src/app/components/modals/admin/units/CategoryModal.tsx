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
  buttonPrimaryClass,
  buttonSecondaryClass,
  roundedButtonClass,
} from "@/app/styles/buttonClasses";
import ModalBase, { ModalBaseHandle } from "../../ModalBase";
import MultiDropdown from "../../../common/MultiDropdown";
import { XMarkIcon } from "@heroicons/react/20/solid";
import DragDrop from "../../../common/DragDrop";
import { useTranslations } from "next-intl";
import { categoryConstraints } from "@/app/helpers/inputConstraints";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  itemId?: number | null;
  onItemUpdated: () => void;
};

type SubCategoryDto = {
  id: number;
  name: string;
};

const CategoryModal = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- Refs ---
  const formRef = useRef<HTMLFormElement>(null);
  const modalRef = useRef<ModalBaseHandle>(null);
  const getScrollEl = () => modalRef.current?.getScrollEl() ?? null;
  const updatedSubCategoriesRef = useRef<SubCategoryDto[]>([]);

  // --- States ---
  const [name, setName] = useState("");
  const [subCategoryIds, setSubCategoryIds] = useState<number[]>([]);
  const [newSubCategory, setNewSubCategory] = useState("");

  const [originalName, setOriginalName] = useState("");
  const [originalSubCategoryIds, setOriginalSubCategoryIds] = useState<
    number[]
  >([]);

  const [subCategoryIdsToDelete, setSubCategoryIdsToDelete] = useState<
    number[]
  >([]);
  const [isDirty, setIsDirty] = useState(false);

  const [isAnyDragging, setIsAnyDragging] = useState(false);

  const [editingSubCategoryId, setEditingSubCategoryId] = useState<
    number | null
  >(null);
  const [editingName, setEditingName] = useState("");

  // --- Other ---
  const token = localStorage.getItem("token");
  const { notify } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (props.isOpen && props.itemId !== null && props.itemId !== undefined) {
      fetchCategory();
      fetchAllSubCategories();
    } else {
      setName("");
      setOriginalName("");

      setSubCategoryIds([]);
      setOriginalSubCategoryIds([]);

      setNewSubCategory("");
    }
  }, [props.isOpen, props.itemId]);

  // --- BACKEND ---
  // --- Create category ---
  const createCategory = async (event: FormEvent) => {
    event.preventDefault();

    const newSubCategoryNames = updatedSubCategoriesRef.current
      .filter((sc) => subCategoryIds.includes(sc.id) && sc.id < 0)
      .map((sc) => sc.name.trim());

    const newSubCategoryIds = subCategoryIds.filter((id) => id > 0);

    try {
      const response = await fetch(`${apiUrl}/category/create`, {
        method: "POST",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          subCategoryIds: newSubCategoryIds,
          newSubCategoryNames,
          subCategoryIdsToDelete,
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

      result.subCategories.forEach((sc: any) => {
        const existing = updatedSubCategoriesRef.current.find(
          (s) => s.name.toLowerCase() === sc.name.toLowerCase() && s.id < 0,
        );

        if (existing) {
          existing.id = sc.id;
        }
      });

      setSubCategoryIdsToDelete([]);
      props.onClose();
      props.onItemUpdated();
      notify("success", t("Common/Category") + t("Modal/created"), 4000);
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Update category ---
  const updateCategory = async (event: FormEvent) => {
    event.preventDefault();

    const newSubCategoryNames = updatedSubCategoriesRef.current
      .filter((sc) => subCategoryIds.includes(sc.id) && sc.id < 0)
      .map((sc) => sc.name.trim());

    const newSubCategoryIds = subCategoryIds.filter((id) => id > 0);

    const updatedExistingSubCategories = updatedSubCategoriesRef.current
      .filter((sc) => subCategoryIds.includes(sc.id) && sc.id > 0)
      .map((sc) => ({ id: sc.id, name: sc.name.trim() }));

    try {
      const response = await fetch(
        `${apiUrl}/category/update/${props.itemId}`,
        {
          method: "PUT",
          headers: {
            "X-User-Language": localStorage.getItem("language") || "sv",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            subCategoryIds: newSubCategoryIds,
            newSubCategoryNames,
            updatedExistingSubCategories,
            subCategoryIdsToDelete,
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

      result.subCategories.forEach((sc: any) => {
        const existing = updatedSubCategoriesRef.current.find(
          (s) => s.name.trim() === sc.name.trim() && s.id < 0,
        );

        if (existing) {
          existing.id = sc.id;
        }
      });

      setSubCategoryIdsToDelete([]);
      props.onClose();
      props.onItemUpdated();
      notify("success", t("Common/Category") + t("Modal/updated"), 4000);
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Fetch category & sub category ---
  const fetchCategory = async () => {
    try {
      const response = await fetch(`${apiUrl}/category/fetch/${props.itemId}`, {
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
        fillCategoryData(result);
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  const fillCategoryData = (result: any) => {
    setName(result.name ?? "");
    setOriginalName(result.name ?? "");

    const ids = Array.isArray(result.subCategories)
      ? result.subCategories.map((sc: any) => sc.id)
      : [];

    setSubCategoryIds(ids);
    setOriginalSubCategoryIds(ids);
  };

  const fetchAllSubCategories = async () => {
    try {
      const response = await fetch(`${apiUrl}/sub-category`, {
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
        updatedSubCategoriesRef.current = result;
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  const handleSaveClick = () => {
    formRef.current?.requestSubmit();
  };

  const createSubCategory = () => {
    const trimmed = newSubCategory.trim();

    if (!trimmed) {
      notify("error", t("CategoryModal/Error1"));
      return;
    }

    const match = updatedSubCategoriesRef.current.find(
      (sc) => sc.name.trim() === trimmed.trim(),
    );

    if (match) {
      if (subCategoryIds.includes(match.id)) {
        notify("error", t("CategoryModal/Error2"));
        return;
      }

      setSubCategoryIds((prev) => [match.id, ...prev]);
      setNewSubCategory("");
      return;
    }

    const tempId = -(Math.floor(Math.random() * 1000000) + 1);

    const tempSubCategory: SubCategoryDto = {
      id: tempId,
      name: trimmed,
    };

    updatedSubCategoriesRef.current = [
      tempSubCategory,
      ...updatedSubCategoriesRef.current,
    ];
    setSubCategoryIds((prev) => [tempId, ...prev]);
    setNewSubCategory("");
  };

  const deleteSubCategory = async (subCategoryId: number) => {
    setSubCategoryIds((prev) => prev.filter((id) => id !== subCategoryId));

    if (subCategoryId > 0) {
      setSubCategoryIdsToDelete((prev) => [...prev, subCategoryId]);
    } else {
      updatedSubCategoriesRef.current = updatedSubCategoriesRef.current.filter(
        (sc) => sc.id !== subCategoryId,
      );
    }
  };

  // --- COMPONENTS ---
  // --- SubCategoryChip ---
  const SubCategoryChip = ({
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
    onRename: (newName: string) => void;
    isDragging?: boolean;
    dragging?: boolean;
  }) => {
    const isEditing = editingSubCategoryId === id;

    return (
      <div
        className={`${roundedButtonClass} flex w-auto items-center gap-2 !bg-[var(--bg-modal-link)] px-4 transition-transform duration-[var(--fast)]`}
        style={{
          cursor: isEditing ? "text" : isDragging ? "grabbing" : "grab",
        }}
      >
        {isEditing ? (
          <input
            autoFocus
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onBlur={() => {
              const trimmed = editingName.trim();
              if (trimmed) onRename(trimmed);
              setEditingSubCategoryId(null);
              setEditingName("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const trimmed = editingName.trim();
                if (trimmed) onRename(trimmed);
                setEditingSubCategoryId(null);
                setEditingName("");
              } else if (e.key === "Escape") {
                setEditingSubCategoryId(null);
                setEditingName("");
              }
            }}
            {...categoryConstraints.subCategoryName}
            className="w-32 border-b border-[var(--border-primary)] bg-transparent outline-none"
          />
        ) : (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditingSubCategoryId(id);
                setEditingName(label);
              }}
              className="text-[var(--text-secondary)] transition-colors duration-[var(--fast)] hover:text-[var(--accent-color)]"
              style={{ cursor: "pointer" }}
            >
              <PencilIcon className="h-5 w-5" />
            </button>

            <span className="truncate font-semibold select-none">{label}</span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-[var(--text-secondary)] transition-colors duration-[var(--fast)] hover:text-[var(--accent-color)]"
              style={{ cursor: "pointer" }}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </>
        )}
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
      const dirty = name !== "" || subCategoryIds.length > 0;

      setIsDirty(dirty);
      return;
    }

    const dirty =
      name !== originalName ||
      !areArraysEqual(subCategoryIds, originalSubCategoryIds);
    setIsDirty(dirty);
  }, [name, subCategoryIds, originalName, originalSubCategoryIds]);

  return (
    <>
      {props.isOpen && (
        <form
          ref={formRef}
          onSubmit={(e) =>
            props.itemId ? updateCategory(e) : createCategory(e)
          }
        >
          <ModalBase
            ref={modalRef}
            isOpen={props.isOpen}
            onClose={() => {
              setSubCategoryIdsToDelete([]);
              props.onClose();
            }}
            icon={props.itemId ? PencilSquareIcon : PlusIcon}
            label={
              props.itemId
                ? t("Common/Edit") + " " + t("Common/category")
                : t("Common/Add") + " " + t("Common/category")
            }
            confirmOnClose
            isDirty={isDirty}
          >
            <ModalBase.Content>
              <div className="flex items-center gap-2">
                <hr className="w-12 text-[var(--border-tertiary)]" />
                <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                  {t("CategoryModal/Info1")}
                </h3>
                <hr className="w-full text-[var(--border-tertiary)]" />
              </div>

              <div className="xs:grid-cols-1 mb-8 grid grid-cols-1 gap-6">
                <div className="w-full">
                  <Input
                    label={t("Common/Name")}
                    value={name}
                    onChange={(val) => setName(String(val))}
                    onModal
                    required
                    {...categoryConstraints.name}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <hr className="w-12 text-[var(--border-tertiary)]" />
                <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                  {t("CategoryModal/Info2")}
                </h3>
                <hr className="w-full text-[var(--border-tertiary)]" />
              </div>

              <div className="flex gap-4">
                <Input
                  value={newSubCategory}
                  onChange={(val) => setNewSubCategory(String(val))}
                  onModal
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      createSubCategory();
                    }
                  }}
                  placeholder={t("CategoryModal/Placeholder text")}
                  {...categoryConstraints.subCategoryName}
                />

                <button
                  type="button"
                  onClick={createSubCategory}
                  className={`${buttonPrimaryClass}`}
                >
                  <PlusIcon />
                </button>
              </div>

              {subCategoryIds.length > 0 && (
                <>
                  <DragDrop
                    items={subCategoryIds}
                    getId={(id) => String(id)}
                    onReorder={(newIds) => setSubCategoryIds(newIds)}
                    onDraggingChange={setIsAnyDragging}
                    renderItem={(id, isDragging) => {
                      const label =
                        updatedSubCategoriesRef.current.find(
                          (sc) => sc.id === id,
                        )?.name ?? `#${id}`;

                      return (
                        <SubCategoryChip
                          id={id}
                          label={label}
                          isDragging={isDragging}
                          dragging={isAnyDragging}
                          onDelete={() => deleteSubCategory(id)}
                          onRename={(newName) => {
                            updatedSubCategoriesRef.current =
                              updatedSubCategoriesRef.current.map((sc) =>
                                sc.id === id ? { ...sc, name: newName } : sc,
                              );
                            setIsDirty(true);
                          }}
                        />
                      );
                    }}
                  />

                  <span className="text-sm text-[var(--text-secondary)] italic">
                    {t("Modal/Drag and drop1") +
                      t("Common/sub category") +
                      t("Modal/Drag and drop3")}
                  </span>
                </>
              )}

              <span className="mb-4" />
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

export default CategoryModal;
