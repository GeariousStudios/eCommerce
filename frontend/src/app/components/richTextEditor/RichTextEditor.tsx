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

          // editor.clipboard.addMatcher(
          //   Node.ELEMENT_NODE,
          //   (_node: any, delta: any) => {
          //     delta.ops.forEach((op: any) => {
          //       if (op.attributes) {
          //         delete op.attributes;
          //       }
          //     });
          //     return delta;
          //   },
          // );

          // try {
          //   editor.format("size", DEFAULT_SIZE);
          // } catch {}

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
              if (!picker) {
                return;
              }

              const options = picker.querySelector(
                ".ql-picker-options",
              ) as HTMLElement | null;
              if (!options) {
                return;
              }

              if (options.querySelector('.ql-picker-item[data-value=""]')) {
                return;
              }

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

            const sizeBtn = container.querySelector(".ql-size");
            if (sizeBtn)
              sizeBtn.setAttribute("tooltip-title", t("toolbar.size"));

            const boldBtn = container.querySelector(".ql-bold");
            if (boldBtn)
              boldBtn.setAttribute("tooltip-title", t("toolbar.bold"));

            const italicBtn = container.querySelector(".ql-italic");
            if (italicBtn)
              italicBtn.setAttribute("tooltip-title", t("toolbar.italic"));

            const underlineBtn = container.querySelector(".ql-underline");
            if (underlineBtn)
              underlineBtn.setAttribute(
                "tooltip-title",
                t("toolbar.underline"),
              );

            const strikeBtn = container.querySelector(".ql-strike");
            if (strikeBtn)
              strikeBtn.setAttribute("tooltip-title", t("toolbar.strike"));

            const orderedListBtn = container.querySelector(
              '.ql-list[value="ordered"]',
            );
            if (orderedListBtn)
              orderedListBtn.setAttribute(
                "tooltip-title",
                t("toolbar.listOrdered"),
              );

            const bulletListBtn = container.querySelector(
              '.ql-list[value="bullet"]',
            );
            if (bulletListBtn)
              bulletListBtn.setAttribute(
                "tooltip-title",
                t("toolbar.listBullet"),
              );

            const cleanBtn = container.querySelector(".ql-clean");
            if (cleanBtn)
              cleanBtn.setAttribute("tooltip-title", t("toolbar.clean"));

            const colorPicker = container.querySelector(".ql-color");
            if (colorPicker)
              colorPicker.setAttribute("tooltip-title", t("toolbar.color"));

            const backgroundPicker = container.querySelector(".ql-background");
            if (backgroundPicker)
              backgroundPicker.setAttribute(
                "tooltip-title",
                t("toolbar.background"),
              );
          }, 100);
        }
      }, 50);

      return () => clearInterval(interval);
    }, [t]);

    const modules = {
      toolbar: [
        [{ size: [false, ...Size.whitelist] }],
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
      <>
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
        </div>
        
        <textarea
          ref={textareaRef}
          tabIndex={-1}
          autoComplete="off"
          onChange={() => {}}
          name={name}
          required={required}
          defaultValue=""
          style={{
            // position: "absolute",
            position: "fixed",
            width: "100%",
            bottom: "0",
            pointerEvents: "none",
            opacity: "0",
          }}
        />
      </>
    );
  },
);

export default RichTextEditor;
