"use client";

import { forwardRef, useEffect } from "react";
import ReactQuill from "react-quill-new";
import ReactQuillProps from "react-quill-new";

type Props = ReactQuillProps & {
  shouldAutoFocus: boolean;
};

const QuillWrapper = forwardRef<ReactQuill, Props>((props, ref) => {
  useEffect(() => {
    if (ref && typeof ref !== "function" && ref.current) {
      const editor = ref.current.getEditor?.();

      if (editor) {
        editor.enable(false);

        setTimeout(() => {
          editor.enable(true);

          if (props.shouldAutoFocus) {
            editor.focus();
          }
        }, 10);
      }
    }
  }, [props.shouldAutoFocus, ref]);

  return <ReactQuill {...props} ref={ref} />;
});

QuillWrapper.displayName = "QuillWrapper";

export default QuillWrapper;
