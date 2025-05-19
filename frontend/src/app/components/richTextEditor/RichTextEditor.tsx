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
} from "react";

const QuillWrapper = dynamic(() => import("../helpers/QuillWrapper"), {
  ssr: false,
}) as ForwardRefExoticComponent<
  ReactQuill["props"] & React.RefAttributes<ReactQuill>
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
};

const RichTextEditor = forwardRef<RichTextEditorRef, Props>(
  ({ value, name, required }, ref) => {
    const quillRef = useRef<any>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      getContent: () => {
        return quillRef.current?.getEditor()?.root?.innerHTML ?? "";
      },
      getContentText: () => {
        return quillRef.current?.getEditor()?.getText() ?? "";
      },
      setContent: (value: string) => {
        const editor = quillRef.current?.getEditor();
        if (editor) {
          editor.clipboard.dangerouslyPasteHTML(value, "silent");
        }
      },
      getTextarea: () => {
        return textareaRef.current;
      },
    }));

    // --- PASTE HTML FROM ITEM ---
    useEffect(() => {
      const interval = setInterval(() => {
        const editor = quillRef.current?.getEditor();
        if (editor && editor.root.innerHTML !== value) {
          editor.clipboard.dangerouslyPasteHTML(value, "silent");
          document.activeElement instanceof HTMLElement &&
            document.activeElement.blur();

          clearInterval(interval);
        }
      }, 50);

      return () => clearInterval(interval);
    }, [value]);

    const modules = {
      toolbar: [
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["clean"],
      ],
      keyboard: {
        bindings: {
          tab: {
            key: 9,
            handler: function () {
              const nextElement = document.querySelector(":focus + *");
              if (nextElement) {
                (nextElement as HTMLElement).focus();
                return true;
              }
              return false;
            },
          },
        },
      },
    };

    return (
      <div className="focus-within:z-[calc(var(--z-base)+1) relative w-full rounded border-1 border-[var(--border-main)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--accent-color)]">
        <QuillWrapper
          ref={quillRef}
          id="quill-editor"
          theme="snow"
          placeholder=" "
          modules={modules}
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
