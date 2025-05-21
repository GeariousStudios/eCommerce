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
      <Navbar hasScrollbar={hasScrollbar} setHasScrollbar={setHasScrollbar} />
      <Topbar hasScrollbar={hasScrollbar} />
      <div className="flex">
        <div className="w-full max-w-[1920px] overflow-x-hidden p-6 pt-24 duration-[var(--medium)] md:ml-64">
          {props.children}
        </div>
      </div>
    </>
  );
};

export default LayoutWrapper;
