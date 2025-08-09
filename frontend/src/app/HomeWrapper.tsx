"use client";

import dynamic from "next/dynamic";
import Message from "./components/common/Message";
import useAuthStatus from "./hooks/useAuthStatus";

const HomeClient = dynamic(() => import("./HomeClient"), {
  ssr: false,
  loading: () => (
    <>
      <div className="hidden md:block">
        <Message icon="loading" content="loading" fullscreen />
      </div>

      <div className="block md:hidden">
        <Message icon="loading" content="loading" fullscreen withinContainer />
      </div>
    </>
  ),
});

const HomeWrapper = () => {
  const { isAuthReady, isLoggedIn, isAdmin, isConnected } = useAuthStatus();

  if (!isAuthReady) {
    return (
      <>
        <div className="hidden md:block">
          <Message icon="loading" content="loading" fullscreen />
        </div>

        <div className="block md:hidden">
          <Message icon="loading" content="loading" fullscreen withinContainer />
        </div>
      </>
    );
  }

  return (
    <>
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
