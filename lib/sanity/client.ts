import { createClient } from "next-sanity";

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET;
const apiVersion = process.env.SANITY_API_VERSION ?? "2024-05-01";

export function getSanityClient() {
  if (!projectId || !dataset) {
    console.warn("SANITY_PROJECT_ID or SANITY_DATASET not set. Using placeholder client.");

    return createClient({
      projectId: "placeholder",
      dataset: "placeholder",
      apiVersion,
      useCdn: false,
    });
  }

  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: process.env.NODE_ENV === "production",
    perspective: "published",
  });
}
