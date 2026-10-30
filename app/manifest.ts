import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "by.alinkins",
    short_name: "by.alinkins",
    description: "Workout programs by Alina",
    // Open the purchased programs first, while keeping the entire site within
    // the installed application scope.
    id: "/",
    start_url: "/my-programs",
    // Program pages, course pages and the home page must all stay inside the
    // installed iOS web app. A narrower scope makes Safari show its controls
    // as soon as the user follows a link outside /my-programs.
    scope: "/",
    display: "standalone",
    background_color: "#f4ebe3",
    theme_color: "#f4ebe3",
    icons: [
      { src: "/icon.svg", sizes: "1024x1024", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "1024x1024", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
