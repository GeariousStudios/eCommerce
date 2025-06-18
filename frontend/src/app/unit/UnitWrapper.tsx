"use client";

import dynamic from "next/dynamic";
import Message from "../components/message/Message";
import useAuthStatus from "../hooks/useAuthStatus";

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
  const { isAuthReady, isConnected } = useAuthStatus();

  if (!isAuthReady) {
    return (
      <Message icon="loading" content="Laddar in sidan..." fullscreen={true} />
    );
  }

  return <UnitClient isConnected={isConnected} isAuthReady={isAuthReady} />;
};

export default UnitWrapper;
