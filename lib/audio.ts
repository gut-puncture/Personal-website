const mimeAliases: Record<string, string> = {
  "audio/x-wav": "audio/wav",
  "audio/wave": "audio/wav",
  "audio/x-aac": "audio/aac",
  "audio/x-aiff": "audio/aiff",
  "audio/x-flac": "audio/flac",
  "audio/x-m4a": "audio/mp4",
  "audio/mp3": "audio/mpeg"
};

export function normalizeAudioMimeType(mimeType?: string | null) {
  const baseType = (mimeType ?? "").split(";")[0]?.trim().toLowerCase();
  if (!baseType) return "audio/webm";
  return mimeAliases[baseType] ?? baseType;
}

export function getAudioExtension(mimeType?: string | null) {
  const normalized = normalizeAudioMimeType(mimeType);

  if (normalized.includes("wav")) return "wav";
  if (normalized.includes("ogg")) return "ogg";
  if (normalized.includes("aac")) return "aac";
  if (normalized.includes("aiff")) return "aiff";
  if (normalized.includes("flac")) return "flac";
  if (normalized.includes("mpeg")) return "mp3";
  if (normalized.includes("opus")) return "opus";
  if (normalized.includes("amr")) return "amr";
  if (normalized.includes("mp4")) return "m4a";

  return "webm";
}
