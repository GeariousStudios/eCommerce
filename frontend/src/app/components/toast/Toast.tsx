"use client";

import {
  CheckCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { ReactNode, useEffect, useState } from "react";

type Props = {
  content: string | ReactNode;
  duration?: number;
  type?: "success" | "error" | "info";
  onDone?: () => void;
};

const Toast = (props: Props) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(handleClose, props.duration ?? 3000);
    return () => clearTimeout(timeout);
  }, [props.duration]);

  const handleClose = () => {
    if (!isVisible) {
      return;
    }

    setIsVisible(false);
    setTimeout(() => {
      props.onDone?.();
    }, 500);
  };

  const backgroundColor =
    props.type === "success"
      ? "bg-(--note-success) hover:bg-(--note-success-hover) active:bg-(--note-success-active)"
      : props.type === "error"
        ? "bg-(--note-error) hover:bg-(--note-error-hover) active:bg-(--note-error-active)"
        : "bg-(--note-info) hover:bg-(--note-info-hover) active:bg-(--note-info-active)";

  const Icon =
    props.type === "success"
      ? CheckCircleIcon
      : props.type === "error"
        ? XCircleIcon
        : InformationCircleIcon;

  return (
    <div
      className={`${isVisible ? "opacity-100" : "opacity-0"} ${backgroundColor} text-(--text-main-reverse) flex cursor-pointer items-center gap-4 rounded p-4 font-semibold shadow-[0_0_16px_0_rgba(0,0,0,0.125)] transition-[opacity,background]`}
      style={{ transitionDuration: "500ms, 200ms" }}
      onClick={handleClose}
    >
      <Icon className="h-8 min-h-8 w-8 min-w-8" />
      <div className="">
        {typeof props.content === "string" ? (
          <div dangerouslySetInnerHTML={{ __html: props.content }} />
        ) : (
          props.content
        )}
      </div>
    </div>
  );
};

export default Toast;
