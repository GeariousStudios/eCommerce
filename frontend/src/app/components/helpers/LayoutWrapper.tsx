"use client";

import { ReactNode, useState } from "react";
import Navbar from "../navbar/Navbar";
import Topbar from "../topbar/Topbar";

type Props = {
  children: ReactNode;
};

const LayoutWrapper = (props: Props) => {
  const [hasScrollbar, setHasScrollbar] = useState(false);

  return (
    <>
      <Topbar />
      <Navbar hasScrollbar={hasScrollbar} setHasScrollbar={setHasScrollbar} />
      <div className="flex">
        <div
          className={`${hasScrollbar ? "ml-22 md:ml-67" : "ml-19 md:ml-64"} w-full max-w-[1920px] overflow-x-hidden p-4 pt-22 duration-[var(--medium)]`}
        >
          {props.children}
        </div>
      </div>
    </>
  );
};

export default LayoutWrapper;
