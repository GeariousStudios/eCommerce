"use client";

import dynamic from "next/dynamic";
import Message from "../components/message/Message";
import useAuthStatus from "../hooks/useAuthStatus";

const UnitsClient = dynamic(() => import("./UnitsClient"), {
  ssr: false,
  loading: () => (
    <Message icon="loading" content="Laddar in sidan..." fullscreen={true} />
  ),
});

const UnitsWrapper = () => {
  const { isAuthReady, isAdmin, isConnected } = useAuthStatus();

  if (!isAuthReady) {
    return <Message icon="loading" content="auth" fullscreen={true} />;
  }

  if (!isAdmin) {
    return <Message icon="deny" content="deny" fullscreen={true} />;
  }

  return <UnitsClient isConnected={isConnected} />;
};

export default UnitsWrapper;
