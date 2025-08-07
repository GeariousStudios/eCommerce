import { ReactNode } from "react";
import LocaleLayoutWrapper from "./LocaleLayoutWrapper";
import { notFound } from "next/navigation";

const localeMessages: Record<string, any> = {
  sv: require("@/locales/sv.json"),
  en: require("@/locales/en.json"),
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const { locale } = await Promise.resolve(params);

  const messages = localeMessages[locale];

  if (!messages) {
    notFound();
  }

  return (
    <LocaleLayoutWrapper locale={locale} messages={messages}>
      {children}
    </LocaleLayoutWrapper>
  );
}
