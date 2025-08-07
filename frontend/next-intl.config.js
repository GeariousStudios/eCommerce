module.exports = {
  locales: ["sv", "en"],
  defaultLocale: "sv",
  messages: (await import(`../locales/${locale || "sv"}.json`)).default,
};
