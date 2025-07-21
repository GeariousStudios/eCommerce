"use client";

import dynamic from "next/dynamic";
import Message from "../../../components/common/Message";
import useAuthStatus from "../../../hooks/useAuthStatus";

const NewsTypesClient = dynamic(() => import("./NewsTypesClient"), {
  ssr: false,
  loading: () => (
    <>
      <div className="hidden md:block">
        <Message icon="loading" content="Laddar in sidan..." fullscreen />
      </div>

      <div className="block md:hidden">
        <Message
          icon="loading"
          content="Laddar in sidan..."
          fullscreen
          withinContainer
        />
      </div>
    </>
  ),
});

const NewsTypesWrapper = () => {
  const { isAuthReady, isAdmin, isConnected } = useAuthStatus();

  if (!isAuthReady) {
    return (
      <>
        <div className="hidden md:block">
          <Message icon="loading" content="auth" fullscreen />
        </div>

        <div className="block md:hidden">
          <Message icon="loading" content="auth" fullscreen withinContainer />
        </div>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <div className="hidden md:block">
          <Message icon="deny" content="auth" fullscreen />
        </div>

        <div className="block md:hidden">
          <Message icon="deny" content="auth" fullscreen withinContainer />
        </div>
      </>
    );
  }

  return <NewsTypesClient isConnected={isConnected} />;
};

export default NewsTypesWrapper;
