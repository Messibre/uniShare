import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard/",
        "/profile/",
        "/settings/",
        "/admin/",
        "/items/create",
        "/items/edit",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
