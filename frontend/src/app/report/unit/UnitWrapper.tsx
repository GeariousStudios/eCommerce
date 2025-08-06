"use client";

import dynamic from "next/dynamic";
import Message from "../../components/common/Message";
import useAuthStatus from "../../hooks/useAuthStatus";

const UnitClient = dynamic(() => import("./UnitClient"), {
  ssr: false,
  loading: () => (
    <>
      <div className="hidden md:block">
        {/* <Message icon="loading" content="Kollar tillgänglighet..." fullscreen /> */}
        <Message icon="loading" content="reading" fullscreen />
      </div>

      <div className="block md:hidden">
        {/* <Message
          icon="loading"
          content="Kollar tillgänglighet..."
          fullscreen
          withinContainer
        /> */}
        <Message icon="loading" content="reading" fullscreen withinContainer />
      </div>
    </>
  ),
});

const UnitWrapper = () => {
  const { isAuthReady, isConnected, isLoggedIn, isReporter } = useAuthStatus();

  if (!isAuthReady) {
    return (
      <>
        <div className="hidden md:block">
          {/* <Message icon="loading" content="Laddar in sidan..." fullscreen /> */}
          <Message icon="loading" content="reading" fullscreen />
        </div>

        <div className="block md:hidden">
          {/* <Message
            icon="loading"
            content="Laddar in sidan..."
            fullscreen
            withinContainer
          /> */}
          <Message
            icon="loading"
            content="reading"
            fullscreen
            withinContainer
          />
        </div>
      </>
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
