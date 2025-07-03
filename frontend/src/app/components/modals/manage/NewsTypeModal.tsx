"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import Input from "../../input/Input";
import { useToast } from "../../toast/ToastProvider";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
} from "@/app/styles/buttonClasses";
import ModalBase, { ModalBaseHandle } from "../ModalBase";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  itemId?: number | null;
  onItemUpdated: () => void;
};

const NewsTypeModal = (props: Props) => {
  // --- VARIABLES ---
  // --- Refs ---
  const formRef = useRef<HTMLFormElement>(null);
  const modalRef = useRef<ModalBaseHandle>(null);

  // --- States ---
  const [name, setName] = useState("");

  const [originalName, setOriginalName] = useState("");
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
      fetchNewsType();
    } else {
      setName("");
      setOriginalName("");
    }
  }, [props.isOpen, props.itemId]);

  // --- BACKEND ---
  // --- Add news type ---
  const addNewsType = async (event: FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/news-type/create`, {
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
      props.onItemUpdated();
      notify("success", "Nyhetstyp skapad!", 4000);
    } catch (err) {
      notify("error", String(err));
    }
  };

  // --- Fetch news type ---
  const fetchNewsType = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/news-type/fetch/${props.itemId}`,
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
        fillNewsTypeData(result);
      }
    } catch (err) {
      notify("error", String(err));
    }
  };

  const fillNewsTypeData = (result: any) => {
    setName(result.name ?? "");
    setOriginalName(result.name ?? "");
  };

  // --- Update news type ---
  const updateNewsType = async (event: FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch(
        `${apiUrl}/news-type/update/${props.itemId}`,
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
      props.onItemUpdated();
      notify("success", "Nyhetstyp uppdaterad!", 4000);
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
      const dirty = name !== "";

      setIsDirty(dirty);
      return;
    }

    const dirty = name !== originalName;
    setIsDirty(dirty);
  }, [name, originalName]);

  return (
    <>
      {props.isOpen && (
        <ModalBase
          ref={modalRef}
          isOpen={props.isOpen}
          onClose={() => props.onClose()}
          icon={props.itemId ? PencilSquareIcon : PlusIcon}
          label={props.itemId ? "Redigera nyhetstyp" : "Lägg till ny nyhetstyp"}
          confirmOnClose
          isDirty={isDirty}
        >
          <form
            ref={formRef}
            className="relative flex flex-col gap-4"
            onSubmit={(e) =>
              props.itemId ? updateNewsType(e) : addNewsType(e)
            }
          >
            <div className="flex items-center gap-2">
              <hr className="w-12 text-[var(--border-main)]" />
              <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                Uppgifter om nyhetstypen
              </h3>
              <hr className="w-full text-[var(--border-main)]" />
            </div>

            <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:gap-4">
              <Input
                label={"Namn"}
                value={name}
                onChange={(val) => {
                  setName(String(val));
                }}
                onModal={true}
                required
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
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

export default NewsTypeModal;
