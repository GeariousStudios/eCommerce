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
        }
      }, 50);

      return () => clearInterval(interval);
    }, []);

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
