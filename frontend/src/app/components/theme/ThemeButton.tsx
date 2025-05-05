import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

const ThemeButton = () => {
  const [darkTheme, setDarkTheme] = useState<boolean | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme) {
      if (savedTheme === "dark") {
        setDarkTheme(true);
      } else {
        setDarkTheme(false);
      }
    }
  }, []);

  // Add listener to button in case of multiple ThemeButton.
  useEffect(() => {
    const handleThemeChange = () => {
      const isDark = document.documentElement.getAttribute("data-theme");

      setTimeout(() => {
        setDarkTheme(isDark === "dark");
      }, 0);
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "theme") {
        const newTheme = event.newValue;

        setTimeout(() => {
          setDarkTheme(newTheme === "dark");

          if (newTheme) {
            document.documentElement.setAttribute("data-theme", newTheme);
          }
        }, 0);
      }
    };

    window.addEventListener("theme-changed", handleThemeChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("theme-changed", handleThemeChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Change theme.
  const toggleDarkTheme = () => {
    if (darkTheme) {
      setDarkTheme(false);
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    } else {
      setDarkTheme(true);
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    }

    window.dispatchEvent(new Event("theme-changed"));
  };

  if (darkTheme === null) {
    return null;
  }

  return (
    <button
      onClick={toggleDarkTheme}
      className="bg-navbar-link-hover duration-fast m-1 h-10 w-10 rounded-full transition-colors"
    >
      {darkTheme ? (
        <SunIcon className="h-10 w-10 p-2" />
      ) : (
        <MoonIcon className="h-10 w-10 p-2" />
      )}
    </button>
  );
};

export default ThemeButton;
