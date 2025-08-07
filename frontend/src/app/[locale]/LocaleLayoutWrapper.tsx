"use client";

import { ReactNode } from "react";
import "@/app/styles/tailwind.css";
import "@/app/styles/globals.scss";
import "@/app/styles/variables.css";
import LayoutWrapper from "@/app/helpers/LayoutWrapper";
import StorageProvider from "@/app/helpers/StorageProvider";
import { ToastProvider } from "@/app/components/toast/ToastProvider";
import { NextIntlClientProvider } from "next-intl";
import useLanguage from "../hooks/useLanguage";
import useLocaleMessages from "../hooks/useLocaleMessages";

export default function LocaleLayoutWrapper({
  children,
  locale: initialLocale,
  messages: initialMessages,
}: {
  children: ReactNode;
  locale: string;
  messages: Record<string, any>;
}) {
  const { currentLanguage } = useLanguage();
  const messages = useLocaleMessages(currentLanguage ?? initialLocale);
  const locale = currentLanguage ?? initialLocale;

  const setInitialTheme = `
    (function() {
      try {
        const theme = localStorage.getItem("theme");
        if (theme) {
          document.documentElement.setAttribute("data-theme", theme);
        } else {
          document.documentElement.setAttribute("data-theme", "dark");
        }
      } catch(e) {}
    })();
  `;

  const setInitialLanguage = `
    (function() {
      try {
        const language = localStorage.getItem("language");
        if (language) {
          document.documentElement.setAttribute("data-language", language);
        } else {
          document.documentElement.setAttribute("data-language", "sv");
        }
      } catch(e) {}
    })();
  `;

  return (
    <html
      lang={locale}
      data-language="sv"
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Karla:ital,wght@0,400..700;1,400..700&display=swap"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: setInitialTheme + setInitialLanguage,
          }}
        />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <StorageProvider>
            <ToastProvider>
              <LayoutWrapper>{children}</LayoutWrapper>
            </ToastProvider>
          </StorageProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
