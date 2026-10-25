import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "دوزیار",
    short_name: "دوزیار",
    description: "همراه روزانه‌ی درمان دارویی؛ یادآور دوز، ثبت علائم و پیشرفت",
    lang: "fa",
    dir: "rtl",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F7F5FF",
    theme_color: "#F7F5FF",
    // TODO: add 192px, 512px and maskable PNG icons once the app icon is designed.
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
