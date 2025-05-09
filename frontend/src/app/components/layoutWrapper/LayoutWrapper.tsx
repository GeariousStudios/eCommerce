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
          className={`${hasScrollbar ? "ml-24 md:ml-70" : "ml-21 md:ml-67"} mt-3 mr-3 mb-3 w-full max-w-7xl transition-all duration-[var(--medium)]`}
        >
          {props.children}
        </div>
      </div>
    </>
  );
};

export default LayoutWrapper;
