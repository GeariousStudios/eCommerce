"use client";

import { forwardRef } from "react";
import ReactQuill from "react-quill-new";
import ReactQuillProps from "react-quill-new";

const QuillWrapper = forwardRef<ReactQuill, ReactQuillProps>((props, ref) => {
  return <ReactQuill {...props} ref={ref} />;
});

QuillWrapper.displayName = "QuillWrapper";

export default QuillWrapper;
