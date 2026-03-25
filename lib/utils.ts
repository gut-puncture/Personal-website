import { clsx } from "clsx";

export function cn(...inputs: Array<string | false | null | undefined>) {
  return clsx(inputs);
}

export function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function isExternalLink(link: string) {
  return /^https?:\/\//.test(link);
}
