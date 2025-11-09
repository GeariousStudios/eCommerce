import { useCallback, useEffect, useState } from "react";
import { useUserPrefsContext } from "../context/UserPrefsContext";

const useLanguage = () => {
  const [currentLanguage, setCurrentLanguage] = useState<string | null>(null);

  const { userLanguage, updateUserLanguage } = useUserPrefsContext();

  useEffect(() => {
    const updateLanguage = () => {
      
      const language = document.documentElement.getAttribute("data-language");
      setCurrentLanguage(language);
    };

    updateLanguage();

    window.addEventListener("language-changed", updateLanguage);
    return () => {
      window.removeEventListener("language-changed", updateLanguage);
    };
  }, []);

  const toggleLanguage = useCallback(() => {
    const newLanguage = currentLanguage === "sv" ? "en" : "sv";

    document.documentElement.setAttribute("data-language", newLanguage);
    document.documentElement.setAttribute("lang", newLanguage);
    localStorage.setItem("language", newLanguage);
    window.dispatchEvent(new Event("language-changed"));

    updateUserLanguage(newLanguage);
  }, [updateUserLanguage]);

  return {
    toggleLanguage,
    userLanguage,
    currentLanguage,
  };
};

export default useLanguage;
