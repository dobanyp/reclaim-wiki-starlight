// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "Docs with Tailwind",
      social: [],
      logo: {
        light: "./src/assets/logo-dark.png",
        dark: "./src/assets/logo-light.png",
        replacesTitle: true,
      },
      sidebar: [
        {
          label: "Onboarding",
          link: "/onboarding/",
        },
        {
          label: "Shifting & Holidays",
          link: "/shifting-and-holidays",
        },
        {
          label: "Item Preparation",
          items: [{ autogenerate: { directory: "item-preparation" } }],
        },
        {
          label: "Daily Operations",
          items: [{ autogenerate: { directory: "daily-operations" } }],
        },
        {
          label: "Miscellaneous",
          items: [{ autogenerate: { directory: "miscellaneous" } }],
        },
      ],
      customCss: [
        "./src/styles/global.css",
        "@fontsource-variable/inter/index.css",
      ],
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
