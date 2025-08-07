"use client";

import dynamic from "next/dynamic";
import "quill/dist/quill.snow.css";
import type ReactQuill from "react-quill-new";
import {
  forwardRef,
  ForwardRefExoticComponent,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";

const QuillWrapper = dynamic(() => import("../../helpers/QuillWrapper"), {
  ssr: false,
}) as ForwardRefExoticComponent<
  (ReactQuill["props"] & { shouldAutoFocus?: boolean }) &
    React.RefAttributes<ReactQuill>
>;

export type RichTextEditorRef = {
  getContent: () => string;
  getContentText: () => string;
  setContent: (value: string) => void;
  getTextarea: () => HTMLTextAreaElement | null;
};

type Props = {
  value: string;
  name?: string;
  required?: boolean;
  onReady?: () => void;
  onChange?: (val: string) => void;
  shouldAutoFocus?: boolean;
};

const RichTextEditor = forwardRef<RichTextEditorRef, Props>(
  ({ value, name, required, onReady, onChange, shouldAutoFocus }, ref) => {
    const t = useTranslations();
    const quillRef = useRef<any>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isEditorReady, setIsEditorReady] = useState(false);

    useImperativeHandle(ref, () => ({
      getContent: () => {
        try {
          return quillRef.current?.getEditor()?.root?.innerHTML ?? "";
        } catch {
          return "";
        }
      },
      getContentText: () => {
        try {
          return quillRef.current?.getEditor()?.getText() ?? "";
        } catch {
          return "";
        }
      },
      setContent: (value: string) => {
        const editor = quillRef.current?.getEditor();
        if (editor) {
          editor.clipboard.dangerouslyPasteHTML(value, "silent");
          editor.root.blur();
        }
      },
      getTextarea: () => {
        return textareaRef.current;
      },
    }));

    // --- PASTE HTML FROM ITEM ---
    useEffect(() => {
      const interval = setInterval(() => {
        const editor = quillRef.current?.getEditor?.();
        if (editor) {
          setIsEditorReady(true);
          onReady?.();
          clearInterval(interval);

          editor.clipboard.addMatcher(
            Node.ELEMENT_NODE,
            (_node: any, delta: any) => {
              delta.ops.forEach((op: any) => {
                if (op.attributes) {
                  delete op.attributes;
                }
              });
              return delta;
            },
          );

          setTimeout(() => {
            const toolbar = editor.getModule("toolbar");
            const container = toolbar.container;

            const boldBtn = container.querySelector(".ql-bold");
            if (boldBtn) boldBtn.setAttribute("tooltip-title", t("toolbar.bold"));

            const italicBtn = container.querySelector(".ql-italic");
            if (italicBtn) italicBtn.setAttribute("tooltip-title", t("toolbar.italic"));

            const underlineBtn = container.querySelector(".ql-underline");
            if (underlineBtn)
              underlineBtn.setAttribute("tooltip-title", t("toolbar.underline"));

            const strikeBtn = container.querySelector(".ql-strike");
            if (strikeBtn) strikeBtn.setAttribute("tooltip-title", t("toolbar.strike"));

            const orderedListBtn = container.querySelector(
              '.ql-list[value="ordered"]',
            );
            if (orderedListBtn)
              orderedListBtn.setAttribute("tooltip-title", t("toolbar.listOrdered"));

            const bulletListBtn = container.querySelector(
              '.ql-list[value="bullet"]',
            );
            if (bulletListBtn)
              bulletListBtn.setAttribute("tooltip-title", t("toolbar.listBullet"));

            const cleanBtn = container.querySelector(".ql-clean");
            if (cleanBtn) cleanBtn.setAttribute("tooltip-title", t("toolbar.clean"));

            const colorPicker = container.querySelector(
              ".ql-color",
            );
            if (colorPicker)
              colorPicker.setAttribute("tooltip-title", t("toolbar.color"));

            const backgroundPicker = container.querySelector(
              ".ql-background",
            );
            if (backgroundPicker)
              backgroundPicker.setAttribute("tooltip-title", t("toolbar.background"));
          }, 100);
        }
      }, 50);

      return () => clearInterval(interval);
    }, [t]);

    const modules = {
      toolbar: [
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["clean"],
      ],
      keyboard: {
        bindings: {
          tab: false,
        },
      },
      history: { delay: 1000, maxStack: 100, userOnly: true },
    };

    return (
      <div className="focus-within:z-[calc(var(--z-base)+1) relative w-full rounded border-1 border-[var(--border-tertiary)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--accent-color)]">
        <QuillWrapper
          ref={quillRef}
          id="quill-editor"
          theme="snow"
          placeholder=" "
          modules={modules}
          shouldAutoFocus={shouldAutoFocus ?? false}
          onChange={(val) => {
            onChange?.(val);
          }}
        />

        <textarea
          ref={textareaRef}
          tabIndex={-1}
          autoComplete="off"
          onChange={() => {}}
          name={name}
          required={required}
          defaultValue=""
          style={{
            position: "absolute",
            width: "100%",
            bottom: "0",
            pointerEvents: "none",
            opacity: "0",
          }}
        />
      </div>
    );
  },
);

export default RichTextEditor;
