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
        <div className="flex">
          {/* ml-21/md:ml-67 = w-18/w-64 + 3 */}
          <div className="duration-medium mt-3 mr-3 mb-3 ml-21 w-full max-w-7xl transition-all md:ml-67">
            {props.children}
          </div>
        </div>
      </body>
    </html>
  );
};

export default RootLayout;
