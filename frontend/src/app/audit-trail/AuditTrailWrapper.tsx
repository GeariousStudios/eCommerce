"use client";

import dynamic from "next/dynamic";
import Message from "../components/common/Message";
import { useAuth } from "../context/AuthContext";

const AuditTrailClient = dynamic(() => import("./AuditTrailClient"), {
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

const AuditTrailWrapper = () => {
  const { isAuthReady, isConnected, isLoggedIn, isReporter, isAdmin, isDev } =
    useAuth();

  if (!isAuthReady) {
    return (
      <>
        <div className="hidden md:block">
          <Message icon="loading" content="loading" fullscreen />
        </div>

        <div className="block md:hidden">
          <Message
            icon="loading"
            content="loading"
            fullscreen
            withinContainer
          />
        </div>
      </>
    );
  }

  if (!isAdmin && !isDev && !isReporter) {
    return (
      <>
        <div className="hidden md:block">
          <Message icon="deny" content="deny" fullscreen />
        </div>

        <div className="block md:hidden">
          <Message icon="deny" content="deny" fullscreen withinContainer />
        </div>
      </>
    );
  }

  return (
    <AuditTrailClient
      isConnected={isConnected}
      isAuthReady={isAuthReady}
      isLoggedIn={isLoggedIn}
      isReporter={isReporter}
      isAdmin={isAdmin}
      isDev={isDev}
    />
  );
};

export default AuditTrailWrapper;
