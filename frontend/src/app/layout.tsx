import { ReactNode } from "react";
import "./styles/globals.scss";
import "./styles/variables.scss";
import LayoutWrapper from "./components/layoutWrapper/LayoutWrapper";
import StorageProvider from "./components/storageProvider/StorageProvider";

type Props = {
  children: ReactNode;
};

const RootLayout = (props: Props) => {
  const setInitialTheme = `
    (function() {
      try {
        const theme = localStorage.getItem("theme");
        if (theme) {
          document.documentElement.setAttribute("data-theme", theme);
        } else {
          document.documentElement.setAttribute("data-theme", dark);
        }
      } catch(e) {}
    })();
  `;

  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: setInitialTheme }} />
      </head>
      <body>
        <StorageProvider>
          <LayoutWrapper>{props.children}</LayoutWrapper>
        </StorageProvider>
      </body>
    </html>
  );
};

export default RootLayout;
