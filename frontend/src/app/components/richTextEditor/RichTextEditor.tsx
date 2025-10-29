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
    const [initialHtml, setInitialHtml] = useState(value ?? "<p><br></p>");

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
        }
      },
      getTextarea: () => textareaRef.current,
    }));

    // initiera editorn
    useEffect(() => {
      const check = setInterval(() => {
        const editor = quillRef.current?.getEditor?.();
        if (editor) {
          clearInterval(check);
          setIsEditorReady(true);
          onReady?.();
          const html = value?.trim() ? value : "<p><br></p>";
          editor.clipboard.dangerouslyPasteHTML(html, "silent");
        }
      }, 50);
      return () => clearInterval(check);
    }, []);

    // uppdatera vid value-ändring (utan att påverka fokus)
    useEffect(() => {
      if (!isEditorReady) return;
      const editor = quillRef.current?.getEditor?.();
      if (!editor) return;
      const current = editor.root.innerHTML;
      const incoming = value?.trim() || "<p><br></p>";
      if (current !== incoming) {
        const selection = editor.getSelection();
        editor.clipboard.dangerouslyPasteHTML(incoming, "silent");
        if (selection) editor.setSelection(selection);
      }
    }, [value, isEditorReady]);

    const modules = {
      toolbar: [
        [{ size: [false, ...SIZE_WHITELIST] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["clean"],
      ],
      keyboard: { bindings: { tab: false } },
      history: { delay: 1000, maxStack: 100, userOnly: true },
    };

    return (
      <div className="focus-within:z-[calc(var(--z-base)+1)] relative w-full rounded border border-[var(--border-tertiary)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--accent-color)]">
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
