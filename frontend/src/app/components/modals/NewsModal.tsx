"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import SingleDropdown from "../dropdowns/SingleDropdown";
import { FocusTrap } from "focus-trap-react";
import RichTextEditor, {
  RichTextEditorRef,
} from "../richTextEditor/RichTextEditor";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import Input from "../input/Input";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
} from "@/app/styles/buttonClasses";
import { useNotification } from "../notification/NotificationProvider";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  newsId?: number | null;
  onNewsUpdated: () => void;
};

const NewsModal = (props: Props) => {
  // Refs.
  const editorRef = useRef<RichTextEditorRef>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // States.
  const [date, setDate] = useState("");
  const [type, setType] = useState("");
  const [headline, setHeadline] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [hasPreloadedEditor, setHasPreloadedEditor] = useState(false);

  // Other variables.
  const token = localStorage.getItem("token");
  const { notify } = useNotification();

  useEffect(() => {
    if (!hasPreloadedEditor) {
      setHasPreloadedEditor(true);
    }
  }, []);

  useEffect(() => {
    if (!props.isOpen) return;

    if (props.newsId !== null && props.newsId !== undefined) {
      fetchNewsItem(props.newsId);
    } else {
      setDate("");
      setType("");
      setHeadline("");
      setContent("");
      editorRef.current?.setContent("");
    }
  }, [props.isOpen, props.newsId]);

  // Handle news editing/adding.
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const addNews = async (event: FormEvent) => {
    event.preventDefault();

    const currentContent = editorRef.current?.getContent() ?? "";

    try {
      const response = await fetch(`${apiUrl}/news/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ date, type, headline, content: currentContent }),
      });

      const result = await response.json();

      if (!response.ok) {
        notify("error", result.message);
      } else {
        props.onClose();
        props.onNewsUpdated();
        notify("success", "Nyhet skapad!", 4000);
      }
    } catch (err) {
      notify("error", String(err));
    }
  };

  const fetchNewsItem = async (id: number) => {
    try {
      const response = await fetch(`${apiUrl}/news/fetch/${id}`, {
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (!response.ok) {
        notify("error", result.message);
      } else {
        fillNewsItemData(result);
      }
    } catch (err) {
      notify("error", String(err));
    }
  };

  const fillNewsItemData = (result: any) => {
    const serverDate = result.date ? new Date(result.date) : null;
    const formattedDate = serverDate
      ? `${serverDate.getFullYear()}-${String(serverDate.getMonth() + 1).padStart(2, "0")}-${String(
          serverDate.getDate(),
        ).padStart(2, "0")}`
      : "";

    setDate(formattedDate);
    setType(result.type ?? "");
    setHeadline(result.headline ?? "");
    setContent(result.content ?? "");
    setAuthor(result.author ?? "");
    setAuthorId(result.authorId);
  };

  const updateNews = async (event: FormEvent, id: number) => {
    event.preventDefault();

    const currentContent = editorRef.current?.getContent() ?? "";

    try {
      const response = await fetch(`${apiUrl}/news/update/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ date, type, headline, content: currentContent }),
      });

      const result = await response.json();

      if (!response.ok) {
        notify("error", result.message);
        return;
      }

      props.onClose();
      props.onNewsUpdated();
      notify("success", "Nyhet uppdaterad!", 4000);
    } catch (err) {
      notify("error", String(err));
    }
  };

  const handleSaveClick = () => {
    const editorText = editorRef.current?.getContentText() ?? "";

    const textarea = editorRef.current?.getTextarea();
    if (textarea) {
      textarea.value = editorText.trim() !== "" ? "filled" : "";
    }

    setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 0);
  };

  return (
    <>
      {hasPreloadedEditor && (
        <div style={{ display: "none" }}>
          <RichTextEditor ref={editorRef} value="" name="editor-preload" />
        </div>
      )}

      {props.isOpen && (
        <div className="fixed inset-0 z-[var(--z-overlay)] h-svh w-screen bg-black/50">
          <FocusTrap
            focusTrapOptions={{ initialFocus: false, allowOutsideClick: true }}
          >
            <form
              ref={formRef}
              className="relative top-1/2 left-1/2 z-[var(--z-modal)] flex max-h-[90svh] w-[90vw] max-w-3xl -translate-1/2 flex-col gap-8 overflow-y-auto rounded border-2 border-[var(--border-main)] bg-[var(--bg-modal)] p-4"
              onSubmit={(e) =>
                props.newsId ? updateNews(e, props.newsId) : addNews(e)
              }
            >
              <h2 className="mb-4 flex items-center text-2xl font-semibold">
                <span className="mr-2 h-6 w-6 text-[var(--accent-color)]">
                  {props.newsId ? <PencilSquareIcon /> : <PlusIcon />}
                </span>
                <span>
                  {props.newsId ? "Redigera nyhet" : "Lägg till nyhet"}
                </span>
              </h2>

              <Input
                id="date"
                type="date"
                label={"Datum"}
                value={date}
                onChange={(val) => setDate(String(val))}
                onModal={true}
                required
              />

              <SingleDropdown
                label="Nyhetstyp"
                value={type}
                onChange={setType}
                options={[
                  { value: "Release", label: "Release" },
                  { value: "Hotfix", label: "Hotfix" },
                ]}
                onModal={true}
                required
              />

              <Input
                id="headline"
                label={"Rubrik"}
                value={headline}
                onChange={(val) => setHeadline(String(val))}
                onModal={true}
                required
              />

              <RichTextEditor
                ref={editorRef}
                value={content}
                name="content"
                required
              />

              <div className="flex justify-between gap-4">
                <button
                  type="button"
                  onClick={props.onClose}
                  className={`${buttonSecondaryClass} grow`}
                >
                  Ångra
                </button>
                <button
                  type="button"
                  onClick={handleSaveClick}
                  className={`${buttonPrimaryClass} grow-2`}
                >
                  {props.newsId ? "Uppdatera" : "Lägg till"}
                </button>
              </div>
            </form>
          </FocusTrap>
        </div>
      )}
    </>
  );
};

export default NewsModal;
