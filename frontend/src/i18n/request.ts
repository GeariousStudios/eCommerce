import { getRequestConfig } from "next-intl/server";

const locales = ["sv", "en"];

export default getRequestConfig(async ({ locale }) => {
  const currentLocale = locale ?? "sv";
  const safeLocale = locales.includes(currentLocale) ? currentLocale : "sv";

  return {
    messages: (await import(`../locales/${safeLocale}.json`)).default,
    locale: safeLocale,
  };
});
