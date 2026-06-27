import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_APP_URL || "https://adspark.ai";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/portal", "/app", "/r/", "/api/"] }],
    sitemap: `${site}/sitemap.xml`,
  };
}
