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
        <header className="width-full mb-3 flex h-32 items-center justify-center rounded border-2 border-[var(--border-main)] bg-[var(--bg-grid-header)] text-center">
          <h1 className="text-4xl transition-[font-size] duration-[var(--medium)] md:text-5xl">
            Admin Dashboard
          </h1>
        </header>
        <Message icon="loading" content="auth" fullscreen={true} />
      </>
    );
  }

  return (
    <>
      <header className="width-full mb-3 flex h-32 items-center justify-center rounded border-2 border-[var(--border-main)] bg-[var(--bg-grid-header)] text-center">
        <h1 className="text-4xl transition-[font-size] duration-[var(--medium)] md:text-5xl">
          Admin Dashboard
        </h1>
      </header>

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
