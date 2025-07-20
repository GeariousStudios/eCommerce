import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  children: ReactNode;
};

const PortalWrapper = (props: Props) => {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const element = document.getElementById("portal-root");
    if (element) {
      setPortalElement(element);
    }
  }, []);

  if (!portalElement) {
    return null;
  }

  return createPortal(props.children, portalElement);
};

export default PortalWrapper;
