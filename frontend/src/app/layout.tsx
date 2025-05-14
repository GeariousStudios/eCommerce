import { ReactNode } from "react";
import "./styles/globals.css";
import "./styles/variables.css";
import LayoutWrapper from "./components/helpers/LayoutWrapper";
import StorageProvider from "./components/helpers/StorageProvider";
import { NotificationProvider } from "./components/notification/NotificationProvider";

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
          <NotificationProvider>
            <LayoutWrapper>{props.children}</LayoutWrapper>
          </NotificationProvider>
        </StorageProvider>
        
      </body>
    </html>
  );
};

export default RootLayout;
