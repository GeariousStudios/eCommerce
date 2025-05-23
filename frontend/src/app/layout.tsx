import { ReactNode } from "react";
import "./styles/tailwind.css";
import "./styles/globals.scss";
import "./styles/variables.css";
import LayoutWrapper from "./components/helpers/LayoutWrapper";
import StorageProvider from "./components/helpers/StorageProvider";
import { ToastProvider } from "./components/toast/ToastProvider";

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
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Karla:ital,wght@0,400..700;1,400..700&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: setInitialTheme }} />
      </head>
      <body>
        <StorageProvider>
          <ToastProvider>
            <LayoutWrapper>{props.children}</LayoutWrapper>
          </ToastProvider>
        </StorageProvider>
      </body>
    </html>
  );
};

export default RootLayout;
