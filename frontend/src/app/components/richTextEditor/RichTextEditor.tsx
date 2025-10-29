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
import { Quill } from "react-quill-new";

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

const SIZE_WHITELIST = ["12px", "16px", "20px", "24px"];

const RichTextEditor = forwardRef<RichTextEditorRef, Props>(
  ({ value, name, required, onReady, onChange, shouldAutoFocus }, ref) => {
    const t = useTranslations();
    const quillRef = useRef<any>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isEditorReady, setIsEditorReady] = useState(false);

    const Size = Quill.import("attributors/style/size") as any;
    Size.whitelist = SIZE_WHITELIST;
    Quill.register(Size, true);

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
      getTextarea: () => textareaRef.current,
    }));

    useEffect(() => {
      const interval = setInterval(() => {
        const editor = quillRef.current?.getEditor?.();
        if (editor) {
          clearInterval(interval);
          setIsEditorReady(true);
          onReady?.();

          // 🟢 sätt initial HTML manuellt (produktionstabilt)
          requestAnimationFrame(() => {
            try {
              const html = value?.trim() ? value : "<p><br></p>";
              editor.clipboard.dangerouslyPasteHTML(html, "silent");

              // 🔹 endast auto-fokusera om det begärts
              if (shouldAutoFocus) {
                editor.focus();
                editor.setSelection(editor.getLength(), 0);
              }
            } catch {}
          });

          // --- tooltips och toolbar ---
          setTimeout(() => {
            const toolbar = editor.getModule("toolbar");
            const container = toolbar.container;

            const addResetOption = (
              pickerSelector: string,
              formatName: "color" | "background",
            ) => {
              const picker = container.querySelector(
                pickerSelector,
              ) as HTMLElement | null;
              if (!picker) return;

              const options = picker.querySelector(
                ".ql-picker-options",
              ) as HTMLElement | null;
              if (!options) return;

              if (options.querySelector('.ql-picker-item[data-value=""]'))
                return;

              const resetItem = document.createElement("span");
              resetItem.className = "ql-picker-item";
              resetItem.setAttribute("data-value", "");
              resetItem.setAttribute(
                "tooltip-title",
                t("toolbar.reset") ?? "Reset",
              );

              options.append(resetItem);

              resetItem.addEventListener("click", () => {
                editor.format(formatName, false);
              });
            };

            addResetOption(".ql-color", "color");
            addResetOption(".ql-background", "background");

            const map = {
              ".ql-size": "size",
              ".ql-bold": "bold",
              ".ql-italic": "italic",
              ".ql-underline": "underline",
              ".ql-strike": "strike",
              '.ql-list[value="ordered"]': "listOrdered",
              '.ql-list[value="bullet"]': "listBullet",
              ".ql-clean": "clean",
              ".ql-color": "color",
              ".ql-background": "background",
            };

            for (const [selector, key] of Object.entries(map)) {
              const el = container.querySelector(selector);
              if (el) el.setAttribute("tooltip-title", t(`toolbar.${key}`));
            }
          }, 100);
        }
      }, 50);

      return () => clearInterval(interval);
    }, [t, value, onReady]);

    const modules = {
      toolbar: [
        [{ size: [false, ...Size.whitelist] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["clean"],
      ],
      keyboard: { bindings: { tab: false } },
      history: { delay: 1000, maxStack: 100, userOnly: true },
    };

    return (
      <div className="relative w-full rounded border border-[var(--border-tertiary)] focus-within:z-[calc(var(--z-base)+1)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--accent-color)]">
        <QuillWrapper
          ref={quillRef}
          id="quill-editor"
          theme="snow"
          placeholder=" "
          modules={modules}
          shouldAutoFocus={shouldAutoFocus ?? false}
          onChange={(val) => onChange?.(val)}
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
