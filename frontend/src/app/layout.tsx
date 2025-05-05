import { ReactNode } from "react";
import "./styles/globals.css";
import "./styles/variables.css";
import Navbar from "./components/navbar/Navbar";

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
        <Navbar />
        <div className="flex justify-center">
          <div className="m-3 w-full max-w-7xl">{props.children}</div>
        </div>
      </body>
    </html>
  );
};

export default RootLayout;
