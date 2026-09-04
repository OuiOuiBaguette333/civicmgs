import type { Location } from "@types";

/**
 * Resolves an SA2 code to its name from the bundled list, so a shared link
 * carries only the code and the name shown always comes from our own data
 * rather than from the URL.
 */
export default async function findLocationByCode(code: string): Promise<Location | undefined> {
  const { default: vicSA2s } = await import("@data/abs/SA2_VIC.json");

  for (const group of vicSA2s) {
    const match = group.options.find(option => option.value === code);

    if (match) return { code: match.value, name: match.label };
  }

  return undefined;
}
