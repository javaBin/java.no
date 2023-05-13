import path from "path"

/** @type {import("next-i18next").UserConfig} */
const config = {
  // To debug next-i18next, uncomment this line:
  // debug: process.env.NODE_ENV === "development",
  reloadOnPrerender: process.env.NODE_ENV === "development",
  i18n: {
    locales: ["en", "no"],
    defaultLocale: "no",
    localeDetection: false,
  },
  localePath: path.resolve("./public/locales"),
}
export default config
