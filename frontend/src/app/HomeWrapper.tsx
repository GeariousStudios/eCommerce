"use client";

import dynamic from "next/dynamic";
import Message from "./components/common/Message";
import useAuthStatus from "./hooks/useAuthStatus";

const HomeClient = dynamic(() => import("./HomeClient"), {
  ssr: false,
  loading: () => (
    <>
      <div className="hidden md:block">
        <Message icon="loading" content="Laddar in sidan..." fullscreen />
      </div>

      <div className="block md:hidden">
        <Message icon="loading" content="Laddar in sidan..." fullscreen withinContainer />
      </div>
    </>
  ),
});

const HomeWrapper = () => {
  const { isAuthReady, isLoggedIn, isAdmin, isConnected } = useAuthStatus();

  if (!isAuthReady) {
    return (
      <>
        {/* <h1 className="mb-4 text-2xl font-semibold uppercase transition-[font-size] duration-[var(--medium)]">
          Dashboard
        </h1> */}
        <div className="hidden md:block">
          <Message icon="loading" content="auth" fullscreen />
        </div>

        <div className="block md:hidden">
          <Message icon="loading" content="auth" fullscreen withinContainer />
        </div>
      </>
    );
  }

  return (
    <>
      {/* <h1 className="mb-4 text-2xl font-semibold uppercase transition-[font-size] duration-[var(--medium)]">
        Dashboard
      </h1> */}

      <HomeClient
        isAuthReady={isAuthReady}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        isConnected={isConnected}
      />
    </>
  );
};

export default HomeWrapper;
