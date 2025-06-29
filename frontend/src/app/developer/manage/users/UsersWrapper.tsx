"use client";

import dynamic from "next/dynamic";
import Message from "../../../components/message/Message";
import useAuthStatus from "../../../hooks/useAuthStatus";

const UsersClient = dynamic(() => import("./UsersClient"), {
  ssr: false,
  loading: () => (
    <Message icon="loading" content="Laddar in sidan..." fullscreen={true} />
  ),
});

const UsersWrapper = () => {
  const { isAuthReady, isDev, isConnected } = useAuthStatus();

  if (!isAuthReady) {
    return <Message icon="loading" content="auth" fullscreen={true} />;
  }

  if (!isDev) {
    return <Message icon="deny" content="deny" fullscreen={true} />;
  }

  return <UsersClient isConnected={isConnected} />;
};

export default UsersWrapper;
