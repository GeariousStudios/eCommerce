"use client";

import dynamic from "next/dynamic";
import Message from "../../components/common/Message";
import useAuthStatus from "../../hooks/useAuthStatus";

const UnitClient = dynamic(() => import("./UnitClient"), {
  ssr: false,
  loading: () => (
    <Message
      icon="loading"
      content="Kollar tillgänglighet..."
      fullscreen={true}
    />
  ),
});

const UnitWrapper = () => {
  const { isAuthReady, isConnected, isLoggedIn, isReporter } = useAuthStatus();

  if (!isAuthReady) {
    return (
      <Message icon="loading" content="Laddar in sidan..." fullscreen={true} />
    );
  }

  return (
    <UnitClient
      isConnected={isConnected}
      isAuthReady={isAuthReady}
      isLoggedIn={isLoggedIn}
      isReporter={isReporter}
    />
  );
};

export default UnitWrapper;
