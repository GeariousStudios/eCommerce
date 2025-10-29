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
import { Quill } from "react-quill-new";

const QuillWrapper = dynamic(() => import("../../helpers/QuillWrapper"), {
  ssr: false,
}) as ForwardRefExoticComponent<
  (ReactQuill["props"] & { shouldAutoFocus?: boolean }) &
    React.RefAttributes<ReactQuill>
>;

export type RichTextEditorRef = {
  getContent: () => string;
  setContent: (value: string) => void;
};

type Props = {
  value?: string;
  onChange?: (val: string) => void;
  shouldAutoFocus?: boolean;
};

const SIZE_WHITELIST = ["12px", "16px", "20px", "24px"];

const RichTextEditor = forwardRef<RichTextEditorRef, Props>(
  ({ value, onChange, shouldAutoFocus }, ref) => {
    const quillRef = useRef<any>(null);

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
      setContent: (html: string) => {
        const editor = quillRef.current?.getEditor();
        if (editor) editor.clipboard.dangerouslyPasteHTML(html, "silent");
      },
    }));

    useEffect(() => {
      const timer = setInterval(() => {
        const editor = quillRef.current?.getEditor?.();
        if (editor) {
          clearInterval(timer);
          const initial = value?.trim()
            ? value
            : "<p><br></p>";

          // sätt initial HTML
          editor.clipboard.dangerouslyPasteHTML(initial, "silent");

          // sätt cursor i början (stabilt även i prod)
          requestAnimationFrame(() => {
            try {
              editor.focus();
              editor.setSelection(0, 0);
            } catch {}
          });
        }
      }, 30);

      return () => clearInterval(timer);
    }, [value]);

    const modules = {
      toolbar: [
        [{ size: [false, ...SIZE_WHITELIST] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["clean"],
      ],
    };

    return (
      <div className="relative w-full border border-[var(--border-tertiary)] rounded">
        <QuillWrapper
          ref={quillRef}
          theme="snow"
          placeholder=" "
          modules={modules}
          shouldAutoFocus={shouldAutoFocus ?? false}
          onChange={(val) => onChange?.(val)}
        />
      </div>
    );
  },
);

export default RichTextEditor;
