import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_APP_URL || "https://adspark.ai";
  return ["", "/done-for-you", "/login", "/terms", "/privacy"].map((p) => ({
    url: `${site}${p}`,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));
}
