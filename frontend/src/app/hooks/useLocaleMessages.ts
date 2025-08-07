import { useEffect, useState } from "react";
import type { AbstractIntlMessages } from "next-intl";
import svMessages from "@/locales/sv.json";
import enMessages from "@/locales/en.json";

const messagesMap: Record<string, AbstractIntlMessages> = {
  sv: svMessages as AbstractIntlMessages,
  en: enMessages as AbstractIntlMessages,
};

export default function useLocaleMessages(language: string | null) {
  const [messages, setMessages] = useState<AbstractIntlMessages>(messagesMap["sv"]);

  useEffect(() => {
    if (language && messagesMap[language]) {
      setMessages(messagesMap[language]);
    }
  }, [language]);

  return messages;
}
