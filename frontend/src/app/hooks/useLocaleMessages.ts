import { useEffect, useState } from "react";
import svMessages from "@/locales/sv.json";
import enMessages from "@/locales/en.json";

const messagesMap: Record<string, Record<string, string>> = {
  sv: svMessages,
  en: enMessages,
};

export default function useLocaleMessages(language: string | null) {
  const [messages, setMessages] = useState(messagesMap["sv"]);

  useEffect(() => {
    if (language && messagesMap[language]) {
      setMessages(messagesMap[language]);
    }
  }, [language]);

  return messages;
}
