"use client";

import dynamic from "next/dynamic";
import Message from "./components/message/Message";
import useAuthStatus from "./hooks/useAuthStatus";

const HomeClient = dynamic(() => import("./HomeClient"), {
  ssr: false,
  loading: () => (
    <Message icon="loading" content="Laddar in sidan..." fullscreen={true} />
  ),
});

const HomeWrapper = () => {
  const { isAuthReady, isLoggedIn, isAdmin, isConnected } = useAuthStatus();

  if (!isAuthReady) {
    return (
      <>
        <h1 className="mb-4 text-2xl font-semibold uppercase transition-[font-size] duration-[var(--medium)]">
          Dashboard
        </h1>
        <Message icon="loading" content="auth" fullscreen={true} />
      </>
    );
  }

  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold uppercase transition-[font-size] duration-[var(--medium)]">
        Dashboard
      </h1>

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
