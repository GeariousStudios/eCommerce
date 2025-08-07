"use client";

import dynamic from "next/dynamic";
import Message from "../../../components/common/Message";
import useAuthStatus from "../../../hooks/useAuthStatus";

const CategoriesClient = dynamic(() => import("./CategoriesClient"), {
  ssr: false,
  loading: () => (
    <>
      <div className="hidden md:block">
        {/* <Message icon="loading" content="Laddar in sidan..." fullscreen /> */}
        <Message icon="loading" content="loading" fullscreen />
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
          content="loading"
          fullscreen
          withinContainer
        />
      </div>
    </>
  ),
});

const CategoriesWrapper = () => {
  const { isAuthReady, isAdmin, isConnected } = useAuthStatus();

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

  if (!isAdmin) {
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

  return <CategoriesClient isConnected={isConnected} />;
};

export default CategoriesWrapper;
