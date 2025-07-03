"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import SingleDropdown from "../dropdowns/SingleDropdown";
import RichTextEditor, {
  RichTextEditorRef,
} from "../richTextEditor/RichTextEditor";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import Input from "../input/Input";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
} from "@/app/styles/buttonClasses";
import { useToast } from "../toast/ToastProvider";
import ModalBase, { ModalBaseHandle } from "./ModalBase";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  newsId?: number | null;
  onNewsUpdated: () => void;
};

const NewsModal = (props: Props) => {
  // --- VARIABLES ---
  // --- Refs ---
  const editorRef = useRef<RichTextEditorRef>(null);
  const formRef = useRef<HTMLFormElement>(null);
    const modalRef = useRef<ModalBaseHandle>(null);

  // --- States ---
  const [date, setDate] = useState("");
  const [type, setType] = useState("");
  const [headline, setHeadline] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [hasPreloadedEditor, setHasPreloadedEditor] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const [originalDate, setOriginalDate] = useState("");
  const [originalType, setOriginalType] = useState("");
  const [originalHeadline, setOriginalHeadline] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  // --- Other ---
  const token = localStorage.getItem("token");
  const { notify } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

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
      setOriginalDate("");

      setType("");
      setOriginalType("");

      setHeadline("");
      setOriginalHeadline("");

      setContent("");
      setOriginalContent("");
      editorRef.current?.setContent("");
    }
  }, [props.isOpen, props.newsId]);

  // --- BACKEND ---
  // --- Add news item ---
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

  // --- Fetch news item ---
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
    setOriginalDate(formattedDate);

    setType(result.type ?? "");
    setOriginalType(result.type ?? "");

    setHeadline(result.headline ?? "");
    setOriginalHeadline(result.headline ?? "");

    setContent(result.content ?? "");
    setOriginalContent(result.content ?? "");

    setAuthor(result.author ?? "");
    setAuthorId(result.authorId);
  };

  // --- Update news item ---
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

  // --- SET/UNSET IS DIRTY ---
  useEffect(() => {
    if (!editorRef.current || !isEditorReady) {
      return;
    }

    const dirty =
      date !== originalDate ||
      type !== originalType ||
      headline !== originalHeadline ||
      (content !== originalContent &&
        !(content === "<p><br></p>" && originalContent === ""));
    setIsDirty(dirty);
  }, [
    date,
    type,
    headline,
    content,
    originalDate,
    originalType,
    originalHeadline,
    originalContent,
  ]);

  return (
    <>
      {hasPreloadedEditor && (
        <div style={{ display: "none" }}>
          <RichTextEditor ref={editorRef} value="" name="editor-preload" />
        </div>
      )}

      {props.isOpen && (
        <ModalBase
          ref={modalRef}
          isOpen={props.isOpen}
          onClose={() => props.onClose()}
          icon={props.newsId ? PencilSquareIcon : PlusIcon}
          label={props.newsId ? "Redigera nyhet" : "Lägg till nyhet"}
          confirmOnClose
          isDirty={isDirty}
        >
          <form
            ref={formRef}
            className="relative flex flex-col gap-8"
            onSubmit={(e) =>
              props.newsId ? updateNews(e, props.newsId) : addNews(e)
            }
          >
            <Input
              id="date"
              type="date"
              label={"Datum"}
              value={date}
              onChange={(val) => setDate(String(val))}
              onModal
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
              onModal
              required
            />

            <Input
              id="headline"
              label={"Rubrik"}
              value={headline}
              onChange={(val) => setHeadline(String(val))}
              onModal
              required
            />

            <RichTextEditor
              ref={editorRef}
              value={content}
              name="content"
              onReady={() => setIsEditorReady(true)}
              onChange={(val) => setContent(val)}
              required
            />

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={handleSaveClick}
                className={`${buttonPrimaryClass} w-full grow-2 sm:w-auto`}
              >
                {props.newsId ? "Uppdatera" : "Lägg till"}
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

export default NewsModal;
