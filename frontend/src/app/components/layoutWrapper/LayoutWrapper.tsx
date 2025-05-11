"use client";

import { ReactNode, useState } from "react";
import Navbar from "../navbar/Navbar";

type Props = {
  children: ReactNode;
};

const LayoutWrapper = (props: Props) => {
  const [hasScrollbar, setHasScrollbar] = useState(false);

  return (
    <>
      <Navbar hasScrollbar={hasScrollbar} setHasScrollbar={setHasScrollbar} />
      <div className="flex">
        <div
          className={`${hasScrollbar ? "ml-21 md:ml-67" : "ml-18 md:ml-64"} w-full max-w-[1920px] overflow-x-hidden p-3 duration-[var(--medium)]`}
        >
          {props.children}
        </div>
      </div>
    </>
  );
};

export default LayoutWrapper;
