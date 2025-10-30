"use client";

import { FormEvent, use, useEffect, useRef, useState } from "react";
import SingleDropdown from "../common/SingleDropdown";
import RichTextEditor, {
  RichTextEditorRef,
} from "../richTextEditor/RichTextEditor";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import Input from "../common/Input";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
} from "@/app/styles/buttonClasses";
import { useToast } from "../toast/ToastProvider";
import ModalBase, { ModalBaseHandle } from "./ModalBase";
import { useTranslations } from "next-intl";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  newsId?: number | null;
  onNewsUpdated: () => void;
};

type NewsTypeOptions = {
  id: number;
  name: string;
};

const NewsModal = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- Refs ---
  const editorRef = useRef<RichTextEditorRef>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const modalRef = useRef<ModalBaseHandle>(null);
  const getScrollEl = () => modalRef.current?.getScrollEl() ?? null;
  const hasSetInitialContent = useRef(false);

  // --- States ---
  const [date, setDate] = useState("");
  const [typeId, setTypeId] = useState<string | number>("");
  const [typeName, setTypeName] = useState<string | number>("");
  const [headline, setHeadline] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [newsTypes, setNewsTypes] = useState<NewsTypeOptions[]>([]);

  const [originalDate, setOriginalDate] = useState("");
  const [originalTypeId, setOriginalTypeId] = useState<string | number>("");
  const [originalHeadline, setOriginalHeadline] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  const [isEditorReady, setIsEditorReady] = useState(false);
  // --- Other ---
  const token = localStorage.getItem("token");
  const { notify } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!props.isOpen) {
      return;
    }

    fetchNewsTypes();

    if (props.newsId !== null && props.newsId !== undefined) {
      fetchNewsItem(props.newsId);
    } else {
      setDate("");
      setOriginalDate("");

      setTypeId("");
      setOriginalTypeId("");

      setHeadline("");
      setOriginalHeadline("");

      setContent("");
      setOriginalContent("");
      editorRef.current?.setContent("");
      hasSetInitialContent.current = false;
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
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date,
          typeId,
          headline,
          content: currentContent,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        notify("error", result?.message ?? t("Modal/Unknown error"));
      } else {
        props.onClose();
        props.onNewsUpdated();
        notify("success", t("NewsModal/News item") + t("Modal/created"), 4000);
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Fetch news types ---
  const fetchNewsTypes = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/news-type?&sortBy=name&sortOrder=asc`,
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
        setNewsTypes(result.items);
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Fetch news item ---
  const fetchNewsItem = async (id: number) => {
    try {
      const response = await fetch(`${apiUrl}/news/fetch/${id}`, {
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        notify("error", result?.message ?? t("Modal/Unknown error"));
      } else {
        fillNewsItemData(result);
        hasSetInitialContent.current = false;
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
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

    setTypeId(result.typeId ?? "");
    setOriginalTypeId(result.typeId ?? "");

    const matchedType = newsTypes.find((t) => t.id === result.typeId);
    setTypeName(
      matchedType?.name ?? result.typeName ?? t("NewsModal/Unknown type"),
    );

    setHeadline(result.headline ?? "");
    setOriginalHeadline(result.headline ?? "");

    setContent(result.content ?? "");
    setOriginalContent(result.content ?? "");

    setAuthor(result.author ?? "");
    setAuthorId(result.authorId);

    if (editorRef.current && isEditorReady) {
      try {
        editorRef.current.setContent(result.content ?? "");
        hasSetInitialContent.current = false;
      } catch (e) {}
    }
  };

  // --- Update news item ---
  const updateNews = async (event: FormEvent, id: number) => {
    event.preventDefault();

    const currentContent = editorRef.current?.getContent() ?? "";

    try {
      const response = await fetch(`${apiUrl}/news/update/${id}`, {
        method: "PUT",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date,
          typeId,
          headline,
          content: currentContent,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        notify("error", result?.message ?? t("Modal/Unknown error"));
        return;
      }

      props.onClose();
      props.onNewsUpdated();
      notify("success", t("NewsModal/News item") + t("Modal/updated"), 4000);
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
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
      typeId !== originalTypeId ||
      headline !== originalHeadline ||
      (content !== originalContent &&
        !(content === "<p><br></p>" && originalContent === ""));
    setIsDirty(dirty);
  }, [
    date,
    typeId,
    headline,
    content,
    originalDate,
    originalTypeId,
    originalHeadline,
    originalContent,
  ]);

  useEffect(() => {
    if (
      !editorRef.current ||
      !isEditorReady ||
      !content ||
      hasSetInitialContent.current
    ) {
      return;
    }

    try {
      editorRef.current.setContent(content);
      hasSetInitialContent.current = true;
    } catch (e) {}
  }, [isEditorReady, content]);

  return (
    <>
      {!isEditorReady && (
        <div style={{ display: "none" }}>
          <RichTextEditor
            ref={editorRef}
            value=""
            name="editor-preload"
            onReady={() => setIsEditorReady(true)}
            onChange={() => {}}
          />
        </div>
      )}

      {props.isOpen && (
        <form
          ref={formRef}
          onSubmit={(e) =>
            props.newsId ? updateNews(e, props.newsId) : addNews(e)
          }
        >
          <ModalBase
            ref={modalRef}
            isOpen={props.isOpen}
            onClose={() => props.onClose()}
            icon={props.newsId ? PencilSquareIcon : PlusIcon}
            label={
              props.newsId
                ? t("Common/Edit") + " " + t("NewsModal/news item")
                : t("Common/Add") + " " + t("NewsModal/news item")
            }
            confirmOnClose
            isDirty={isDirty}
          >
            <ModalBase.Content>
              <div className="mt-2 mb-8 grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <Input
                    id="date"
                    type="date"
                    label={t("Common/Date")}
                    value={date}
                    onChange={(val) => setDate(String(val))}
                    onModal
                    required
                  />

                  <SingleDropdown
                    label={t("Common/News type")}
                    value={typeId}
                    onChange={setTypeId}
                    options={[
                      ...(newsTypes.some((t) => t.id === typeId) || !typeId
                        ? []
                        : [
                            {
                              value: typeId,
                              label: typeName || t("NewsModal/Unknown type"),
                            },
                          ]),
                      ...newsTypes.map((t) => ({
                        label: t.name,
                        value: t.id,
                      })),
                    ]}
                    onModal
                    required
                  />
                </div>

                <Input
                  id="headline"
                  label={t("NewsModal/Headline")}
                  value={headline}
                  onChange={(val) => setHeadline(String(val))}
                  onModal
                  required
                />

                {/* <RichTextEditor
                  ref={editorRef}
                  value={content}
                  name="content"
                  onReady={() => {
                    setIsEditorReady(true);
                  }}
                  onChange={(val) => setContent(val)}
                  required
                /> */}
                <RichTextEditor
                  ref={editorRef}
                  name="content"
                  onReady={() => setIsEditorReady(true)}
                  onChange={(val) => setContent(val)}
                  required
                />
              </div>
            </ModalBase.Content>

            <ModalBase.Footer>
              <button
                type="button"
                onClick={handleSaveClick}
                className={`${buttonPrimaryClass} xs:col-span-2 col-span-3`}
              >
                {props.newsId ? t("Modal/Update") : t("Common/Add")}
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

export default NewsModal;
